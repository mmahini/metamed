import csv

from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.equipment.models import Equipment
from apps.loans.models import Loan
from apps.community.models import CashDonation


class _Echo:
    """File-like object that returns the value written, for streaming CSV."""

    def write(self, value):
        return value


def _stream_csv(filename, header, rows):
    writer = csv.writer(_Echo())

    def generate():
        # UTF-8 BOM so Excel renders Persian correctly
        yield "﻿"
        yield writer.writerow(header)
        for row in rows:
            yield writer.writerow(row)

    response = StreamingHttpResponse(generate(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


class EquipmentExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Equipment.objects.select_related("unit", "branch", "supplier").all()
        header = ["کد", "نام", "دسته‌بندی", "وضعیت", "واحد", "شعبه", "نوع تملک", "تاریخ ثبت"]
        rows = (
            [
                e.code, e.name, e.get_category_display(), e.get_status_display(),
                e.unit.name if e.unit else "", e.branch.name if e.branch else "",
                e.get_acquisition_type_display(), e.created_at.date().isoformat(),
            ]
            for e in qs
        )
        return _stream_csv("equipment.csv", header, rows)


class LoanExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Loan.objects.select_related("equipment", "patient", "unit").all()
        header = ["کد تجهیز", "تجهیز", "بیمار", "وضعیت", "تاریخ تحویل", "موعد بازگشت", "تاریخ بازگشت"]
        rows = (
            [
                l.equipment.code, l.equipment.name, l.patient.full_name,
                l.get_status_display(),
                l.delivered_at.date().isoformat() if l.delivered_at else "",
                l.due_date.isoformat() if l.due_date else "",
                l.returned_at.date().isoformat() if l.returned_at else "",
            ]
            for l in qs
        )
        return _stream_csv("loans.csv", header, rows)


class CashDonationExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CashDonation.objects.select_related("donor", "branch").all()
        header = ["خیر", "مبلغ (ریال)", "روش", "بابت", "شعبه", "تاریخ"]
        rows = (
            [
                str(d.donor) if d.donor else "ناشناس",
                int(d.amount), d.get_method_display(), d.purpose,
                d.branch.name if d.branch else "", d.created_at.date().isoformat(),
            ]
            for d in qs
        )
        return _stream_csv("cash_donations.csv", header, rows)
