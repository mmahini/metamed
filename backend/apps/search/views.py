from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.equipment.models import Equipment
from apps.patients.models import Patient
from apps.community.models import Donor


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response({"query": q, "results": []})

        results = []

        for e in Equipment.objects.filter(
            Q(name__icontains=q) | Q(code__icontains=q) | Q(serial_number__icontains=q)
        )[:8]:
            results.append({
                "type": "equipment",
                "type_label": "تجهیز",
                "id": e.id,
                "title": e.name,
                "subtitle": f"{e.code} · {e.get_status_display()}",
                "link": f"/app/equipment/{e.id}",
            })

        for p in Patient.objects.filter(
            Q(full_name__icontains=q) | Q(national_id__icontains=q) | Q(phone__icontains=q)
        )[:8]:
            results.append({
                "type": "patient",
                "type_label": "بیمار",
                "id": p.id,
                "title": p.full_name,
                "subtitle": p.phone or p.national_id or "",
                "link": "/app/patients",
            })

        for d in Donor.objects.filter(
            Q(name__icontains=q) | Q(phone__icontains=q)
        )[:8]:
            results.append({
                "type": "donor",
                "type_label": "خیر",
                "id": d.id,
                "title": str(d),
                "subtitle": d.get_type_display(),
                "link": "/app/donors",
            })

        return Response({"query": q, "results": results})
