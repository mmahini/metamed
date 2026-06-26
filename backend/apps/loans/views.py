from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import ReadOnlyOrReception, ReadOnlyOrManager
from .models import EquipmentRequest, Borrower, Loan, Guarantee, RequestStatus, LoanStatus
from .serializers import (
    EquipmentRequestSerializer, BorrowerSerializer,
    LoanSerializer, GuaranteeSerializer, DeliverSerializer,
)


class EquipmentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentRequestSerializer
    permission_classes = [ReadOnlyOrReception]

    def get_queryset(self):
        qs = EquipmentRequest.objects.select_related("patient", "unit", "requested_by")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("priority"):
            qs = qs.filter(priority=p["priority"])
        if p.get("patient"):
            qs = qs.filter(patient_id=p["patient"])
        if p.get("unit"):
            qs = qs.filter(unit_id=p["unit"])
        return qs

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = RequestStatus.APPROVED
        req.save(update_fields=["status", "updated_at"])
        return Response(EquipmentRequestSerializer(req).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = RequestStatus.REJECTED
        req.save(update_fields=["status", "updated_at"])
        return Response(EquipmentRequestSerializer(req).data)


class BorrowerViewSet(viewsets.ModelViewSet):
    queryset = Borrower.objects.all()
    serializer_class = BorrowerSerializer
    permission_classes = [ReadOnlyOrReception]

    def get_queryset(self):
        qs = Borrower.objects.all()
        if self.request.query_params.get("q"):
            qs = qs.filter(full_name__icontains=self.request.query_params["q"])
        return qs


class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [ReadOnlyOrReception]

    def get_queryset(self):
        qs = Loan.objects.select_related(
            "equipment", "patient", "borrower", "unit", "created_by"
        ).prefetch_related("guarantees")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("patient"):
            qs = qs.filter(patient_id=p["patient"])
        if p.get("unit"):
            qs = qs.filter(unit_id=p["unit"])
        if p.get("active") == "1":
            qs = qs.filter(status__in=[LoanStatus.ASSIGNED, LoanStatus.DELIVERED, LoanStatus.OVERDUE])
        return qs

    def perform_create(self, serializer):
        loan = serializer.save(created_by=self.request.user)
        # mark linked request fulfilled
        if loan.request:
            loan.request.status = RequestStatus.FULFILLED
            loan.request.save(update_fields=["status", "updated_at"])
        return loan

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        loan = self.get_object()
        ser = DeliverSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        loan.deliver(due_date=ser.validated_data.get("due_date"), by=request.user)
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=["post"], url_path="return")
    def return_loan(self, request, pk=None):
        loan = self.get_object()
        loan.mark_returned(by=request.user)
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        loan = self.get_object()
        loan.close(by=request.user)
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=["post"])
    def extend(self, request, pk=None):
        loan = self.get_object()
        ser = DeliverSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        new_due = ser.validated_data.get("due_date")
        if not new_due:
            return Response({"detail": "due_date لازم است."}, status=status.HTTP_400_BAD_REQUEST)
        loan.due_date = new_due
        if loan.status == LoanStatus.OVERDUE:
            loan.status = LoanStatus.DELIVERED
        loan.save(update_fields=["due_date", "status", "updated_at"])
        return Response(LoanSerializer(loan).data)


class GuaranteeViewSet(viewsets.ModelViewSet):
    serializer_class = GuaranteeSerializer
    permission_classes = [ReadOnlyOrReception]

    def get_queryset(self):
        qs = Guarantee.objects.select_related("loan")
        if self.request.query_params.get("loan"):
            qs = qs.filter(loan_id=self.request.query_params["loan"])
        return qs
