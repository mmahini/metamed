from django.db.models import Count, Sum
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS, BasePermission

from .models import Donor, CashDonation, EquipmentDonation, Volunteer
from .serializers import (
    DonorSerializer, CashDonationSerializer,
    EquipmentDonationSerializer, VolunteerSerializer,
)

_WRITE_ROLES = {"national_manager", "branch_manager", "unit_manager", "community"}


class CommunityStaffOrManager(BasePermission):
    """Read for authenticated; write for community staff + managers."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in _WRITE_ROLES


class DonorViewSet(viewsets.ModelViewSet):
    serializer_class = DonorSerializer
    permission_classes = [CommunityStaffOrManager]

    def get_queryset(self):
        qs = Donor.objects.select_related("branch").prefetch_related(
            "cash_donations", "equipment_donations"
        )
        p = self.request.query_params
        if p.get("type"):
            qs = qs.filter(type=p["type"])
        if p.get("branch"):
            qs = qs.filter(branch_id=p["branch"])
        if p.get("q"):
            qs = qs.filter(name__icontains=p["q"])
        return qs


class CashDonationViewSet(viewsets.ModelViewSet):
    serializer_class = CashDonationSerializer
    permission_classes = [CommunityStaffOrManager]

    def get_queryset(self):
        qs = CashDonation.objects.select_related("donor", "branch", "received_by")
        p = self.request.query_params
        if p.get("donor"):
            qs = qs.filter(donor_id=p["donor"])
        if p.get("branch"):
            qs = qs.filter(branch_id=p["branch"])
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


class EquipmentDonationViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentDonationSerializer
    permission_classes = [CommunityStaffOrManager]

    def get_queryset(self):
        qs = EquipmentDonation.objects.select_related("donor", "equipment", "branch", "received_by")
        p = self.request.query_params
        if p.get("donor"):
            qs = qs.filter(donor_id=p["donor"])
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


class VolunteerViewSet(viewsets.ModelViewSet):
    serializer_class = VolunteerSerializer
    permission_classes = [CommunityStaffOrManager]

    def get_queryset(self):
        qs = Volunteer.objects.select_related("branch", "user")
        p = self.request.query_params
        if p.get("branch"):
            qs = qs.filter(branch_id=p["branch"])
        if p.get("is_active") is not None:
            qs = qs.filter(is_active=p["is_active"].lower() in ("1", "true"))
        if p.get("q"):
            qs = qs.filter(full_name__icontains=p["q"])
        return qs


class CommunityStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "donor_count": Donor.objects.count(),
            "volunteer_count": Volunteer.objects.filter(is_active=True).count(),
            "total_cash": CashDonation.objects.aggregate(s=Sum("amount"))["s"] or 0,
            "cash_donation_count": CashDonation.objects.count(),
            "equipment_donation_count": EquipmentDonation.objects.count(),
            "donors_by_type": {
                row["type"]: row["count"]
                for row in Donor.objects.values("type").annotate(count=Count("id"))
            },
        })
