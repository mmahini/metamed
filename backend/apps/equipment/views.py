from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import ReadOnlyOrEquipmentStaff, ReadOnlyOrManager
from .models import Supplier, Equipment
from .serializers import (
    SupplierSerializer, EquipmentSerializer,
    EquipmentStatusHistorySerializer, ChangeStatusSerializer,
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [ReadOnlyOrManager]


class EquipmentViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [ReadOnlyOrEquipmentStaff]

    def get_queryset(self):
        qs = Equipment.objects.select_related("unit", "branch", "supplier", "registered_by")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("category"):
            qs = qs.filter(category=p["category"])
        if p.get("unit"):
            qs = qs.filter(unit_id=p["unit"])
        if p.get("branch"):
            qs = qs.filter(branch_id=p["branch"])
        if p.get("is_active") is not None:
            qs = qs.filter(is_active=p["is_active"].lower() in ("1", "true"))
        return qs

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        equipment = self.get_object()
        ser = ChangeStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        history = equipment.change_status(
            new_status=ser.validated_data["status"],
            changed_by=request.user,
            notes=ser.validated_data.get("notes", ""),
        )
        return Response(EquipmentStatusHistorySerializer(history).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        equipment = self.get_object()
        qs = equipment.status_history.select_related("changed_by").all()
        return Response(EquipmentStatusHistorySerializer(qs, many=True).data)
