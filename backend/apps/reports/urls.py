from django.urls import path
from .views import EquipmentExportView, LoanExportView, CashDonationExportView

urlpatterns = [
    path("reports/equipment.csv", EquipmentExportView.as_view(), name="export-equipment"),
    path("reports/loans.csv", LoanExportView.as_view(), name="export-loans"),
    path("reports/cash-donations.csv", CashDonationExportView.as_view(), name="export-cash"),
]
