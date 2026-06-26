from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsNationalManager, ReadOnlyOrManager
from .models import Organization, Branch, Unit
from .serializers import OrganizationSerializer, BranchSerializer, UnitSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsNationalManager()]


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [ReadOnlyOrManager]

    def get_queryset(self):
        qs = Branch.objects.select_related("organization", "manager").all()
        province = self.request.query_params.get("province")
        is_active = self.request.query_params.get("is_active")
        if province:
            qs = qs.filter(province=province)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("1", "true"))
        return qs


class UnitViewSet(viewsets.ModelViewSet):
    serializer_class = UnitSerializer
    permission_classes = [ReadOnlyOrManager]

    def get_queryset(self):
        qs = Unit.objects.select_related("branch", "manager").all()
        branch = self.request.query_params.get("branch")
        is_active = self.request.query_params.get("is_active")
        if branch:
            qs = qs.filter(branch_id=branch)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("1", "true"))
        return qs
