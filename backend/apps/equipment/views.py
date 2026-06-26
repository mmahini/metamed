from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import ReadOnlyOrEquipmentStaff, ReadOnlyOrManager
from .models import (
    Supplier, Equipment, EquipmentTransfer, EquipmentInspection,
    EquipmentStatus, TransferStatus,
)
from .serializers import (
    SupplierSerializer, EquipmentSerializer,
    EquipmentStatusHistorySerializer, ChangeStatusSerializer,
    EquipmentTransferSerializer, EquipmentInspectionSerializer,
    BulkImportRowSerializer,
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
        if p.get("q"):
            qs = qs.filter(name__icontains=p["q"])
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

    @action(detail=True, methods=["get"])
    def inspections(self, request, pk=None):
        equipment = self.get_object()
        qs = equipment.inspections.select_related("inspected_by").all()
        return Response(EquipmentInspectionSerializer(qs, many=True).data)

    @action(detail=False, methods=["post"], url_path="bulk-import")
    def bulk_import(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list):
            return Response({"detail": "rows باید یک آرایه باشد."}, status=status.HTTP_400_BAD_REQUEST)
        created, errors = [], []
        for idx, row in enumerate(rows):
            ser = BulkImportRowSerializer(data=row)
            if not ser.is_valid():
                errors.append({"row": idx, "errors": ser.errors})
                continue
            data = ser.validated_data
            eq = Equipment.objects.create(
                name=data["name"],
                category=data["category"],
                serial_number=data.get("serial_number", ""),
                acquisition_type=data["acquisition_type"],
                unit_id=data.get("unit"),
                notes=data.get("notes", ""),
                registered_by=request.user,
            )
            created.append(eq.id)
        return Response(
            {"created_count": len(created), "created_ids": created, "errors": errors},
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )


class EquipmentTransferViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentTransferSerializer
    permission_classes = [ReadOnlyOrEquipmentStaff]

    def get_queryset(self):
        qs = EquipmentTransfer.objects.select_related(
            "equipment", "from_unit", "to_unit", "requested_by"
        )
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("equipment"):
            qs = qs.filter(equipment_id=p["equipment"])
        return qs

    def perform_create(self, serializer):
        equipment = serializer.validated_data["equipment"]
        transfer = serializer.save(
            requested_by=self.request.user,
            from_unit=equipment.unit,
        )
        equipment.change_status(
            EquipmentStatus.IN_TRANSFER, changed_by=self.request.user,
            notes="درخواست انتقال ثبت شد",
        )
        return transfer

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == TransferStatus.COMPLETED:
            return Response({"detail": "این انتقال قبلاً تکمیل شده است."}, status=status.HTTP_400_BAD_REQUEST)
        transfer.complete(completed_by=request.user)
        return Response(EquipmentTransferSerializer(transfer).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        transfer.status = TransferStatus.CANCELLED
        transfer.save(update_fields=["status"])
        transfer.equipment.change_status(
            EquipmentStatus.READY, changed_by=request.user, notes="انتقال لغو شد",
        )
        return Response(EquipmentTransferSerializer(transfer).data)


class EquipmentInspectionViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentInspectionSerializer
    permission_classes = [ReadOnlyOrEquipmentStaff]

    def get_queryset(self):
        qs = EquipmentInspection.objects.select_related("equipment", "inspected_by")
        if self.request.query_params.get("equipment"):
            qs = qs.filter(equipment_id=self.request.query_params["equipment"])
        return qs

    def perform_create(self, serializer):
        serializer.save(inspected_by=self.request.user)


class EquipmentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Equipment.objects.filter(is_active=True)
        by_status = {
            row["status"]: row["count"]
            for row in qs.values("status").annotate(count=Count("id"))
        }
        by_category = {
            row["category"]: row["count"]
            for row in qs.values("category").annotate(count=Count("id"))
        }
        return Response({
            "total": qs.count(),
            "ready": by_status.get(EquipmentStatus.READY, 0),
            "on_loan": by_status.get(EquipmentStatus.ON_LOAN, 0),
            "under_repair": by_status.get(EquipmentStatus.UNDER_REPAIR, 0),
            "by_status": by_status,
            "by_category": by_category,
            "pending_transfers": EquipmentTransfer.objects.filter(
                status__in=[TransferStatus.PENDING, TransferStatus.IN_TRANSIT]
            ).count(),
        })
