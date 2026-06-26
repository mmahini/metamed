from django.db.models import Count, Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import ReadOnlyOrManager
from .models import DamageReport, Maintenance, MaintenanceStatus
from .serializers import (
    DamageReportSerializer, MaintenanceSerializer, DecommissionSerializer,
)


class MaintenanceStaffOrManager(ReadOnlyOrManager):
    """Read for authenticated; write for maintenance staff + managers."""

    _WRITE_ROLES = {"national_manager", "branch_manager", "unit_manager", "maintenance"}

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role in self._WRITE_ROLES


class DamageReportViewSet(viewsets.ModelViewSet):
    serializer_class = DamageReportSerializer
    permission_classes = [MaintenanceStaffOrManager]

    def get_queryset(self):
        qs = DamageReport.objects.select_related("equipment", "loan", "reported_by")
        p = self.request.query_params
        if p.get("resolved") is not None:
            qs = qs.filter(resolved=p["resolved"].lower() in ("1", "true"))
        if p.get("equipment"):
            qs = qs.filter(equipment_id=p["equipment"])
        if p.get("severity"):
            qs = qs.filter(severity=p["severity"])
        return qs

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class MaintenanceViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceSerializer
    permission_classes = [MaintenanceStaffOrManager]

    def get_queryset(self):
        qs = Maintenance.objects.select_related(
            "equipment", "damage_report", "technician", "supplier"
        )
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("equipment"):
            qs = qs.filter(equipment_id=p["equipment"])
        if p.get("open") == "1":
            qs = qs.filter(status__in=[
                MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS,
                MaintenanceStatus.AWAITING_PARTS,
            ])
        return qs

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        m = self.get_object()
        m.start(by=request.user)
        return Response(MaintenanceSerializer(m).data)

    @action(detail=True, methods=["post"], url_path="await-parts")
    def await_parts(self, request, pk=None):
        m = self.get_object()
        m.await_parts(by=request.user)
        return Response(MaintenanceSerializer(m).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        m = self.get_object()
        m.complete(by=request.user)
        return Response(MaintenanceSerializer(m).data)

    @action(detail=True, methods=["post"])
    def decommission(self, request, pk=None):
        m = self.get_object()
        ser = DecommissionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        m.decommission(by=request.user, reason=ser.validated_data.get("reason", ""))
        return Response(MaintenanceSerializer(m).data)


class MaintenanceStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Maintenance.objects.all()
        by_status = {
            row["status"]: row["count"]
            for row in qs.values("status").annotate(count=Count("id"))
        }
        open_count = sum(
            by_status.get(s, 0) for s in (
                MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS,
                MaintenanceStatus.AWAITING_PARTS,
            )
        )
        return Response({
            "open": open_count,
            "in_progress": by_status.get(MaintenanceStatus.IN_PROGRESS, 0),
            "awaiting_parts": by_status.get(MaintenanceStatus.AWAITING_PARTS, 0),
            "completed": by_status.get(MaintenanceStatus.COMPLETED, 0),
            "unresolved_damage": DamageReport.objects.filter(resolved=False).count(),
            "total_cost": qs.aggregate(s=Sum("cost"))["s"] or 0,
        })
