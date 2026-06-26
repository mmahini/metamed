from rest_framework import viewsets

from apps.accounts.permissions import ReadOnlyOrReception
from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [ReadOnlyOrReception]

    def get_queryset(self):
        qs = Patient.objects.select_related("unit", "created_by")
        p = self.request.query_params
        if p.get("unit"):
            qs = qs.filter(unit_id=p["unit"])
        if p.get("is_active") is not None:
            qs = qs.filter(is_active=p["is_active"].lower() in ("1", "true"))
        if p.get("q"):
            qs = qs.filter(full_name__icontains=p["q"])
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
