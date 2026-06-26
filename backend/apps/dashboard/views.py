from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.equipment.models import Equipment, EquipmentStatus, EquipmentCategory
from apps.loans.models import Loan, EquipmentRequest, LoanStatus, RequestStatus
from apps.patients.models import Patient
from apps.maintenance.models import Maintenance, DamageReport, MaintenanceStatus
from apps.community.models import Donor, CashDonation, Volunteer

_MANAGER_ROLES = {"national_manager", "branch_manager", "unit_manager"}


def _scope_label(user):
    """Human-readable scope for the dashboard header."""
    if user.role == "unit_manager" and user.unit_id:
        return f"واحد {user.unit.name}"
    if user.role == "branch_manager" and user.branch_id:
        return f"شعبه {user.branch.name}"
    if user.role == "national_manager":
        return "سراسر کشور"
    return "همه"


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        equipment = Equipment.objects.filter(is_active=True)
        loans = Loan.objects.all()
        requests = EquipmentRequest.objects.all()
        patients = Patient.objects.filter(is_active=True)

        # Scope by branch/unit for non-national roles
        if user.role == "branch_manager" and user.branch_id:
            equipment = equipment.filter(branch_id=user.branch_id)
            loans = loans.filter(unit__branch_id=user.branch_id)
            requests = requests.filter(unit__branch_id=user.branch_id)
            patients = patients.filter(unit__branch_id=user.branch_id)
        elif user.role == "unit_manager" and user.unit_id:
            equipment = equipment.filter(unit_id=user.unit_id)
            loans = loans.filter(unit_id=user.unit_id)
            requests = requests.filter(unit_id=user.unit_id)
            patients = patients.filter(unit_id=user.unit_id)

        eq_by_status = {
            r["status"]: r["count"]
            for r in equipment.values("status").annotate(count=Count("id"))
        }
        eq_by_category = {
            r["category"]: r["count"]
            for r in equipment.values("category").annotate(count=Count("id"))
        }
        loans_by_status = {
            r["status"]: r["count"]
            for r in loans.values("status").annotate(count=Count("id"))
        }

        active_loans = loans.filter(
            status__in=[LoanStatus.ASSIGNED, LoanStatus.DELIVERED, LoanStatus.OVERDUE]
        )
        overdue = [l.id for l in active_loans if l.is_overdue]

        # KPIs
        kpis = {
            "equipment_total": equipment.count(),
            "equipment_ready": eq_by_status.get(EquipmentStatus.READY, 0),
            "equipment_on_loan": eq_by_status.get(EquipmentStatus.ON_LOAN, 0),
            "active_loans": active_loans.count(),
            "overdue_loans": len(overdue),
            "pending_requests": requests.filter(status=RequestStatus.PENDING).count(),
            "patients_total": patients.count(),
            "open_maintenance": Maintenance.objects.filter(
                status__in=[
                    MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS,
                    MaintenanceStatus.AWAITING_PARTS,
                ]
            ).count(),
            "unresolved_damage": DamageReport.objects.filter(resolved=False).count(),
        }

        # Network-wide community figures (managers + community + national)
        community = {
            "donor_count": Donor.objects.count(),
            "volunteer_count": Volunteer.objects.filter(is_active=True).count(),
            "total_cash": CashDonation.objects.aggregate(s=Sum("amount"))["s"] or 0,
        }

        # Charts — label maps for client display
        category_labels = dict(EquipmentCategory.choices)
        status_labels = dict(EquipmentStatus.choices)
        loan_status_labels = dict(LoanStatus.choices)

        charts = {
            "equipment_by_status": [
                {"key": k, "label": status_labels.get(k, k), "value": v}
                for k, v in sorted(eq_by_status.items(), key=lambda x: -x[1])
            ],
            "equipment_by_category": [
                {"key": k, "label": category_labels.get(k, k), "value": v}
                for k, v in sorted(eq_by_category.items(), key=lambda x: -x[1])
            ],
            "loans_by_status": [
                {"key": k, "label": loan_status_labels.get(k, k), "value": v}
                for k, v in sorted(loans_by_status.items(), key=lambda x: -x[1])
            ],
        }

        # Recent activity
        recent_loans = [
            {
                "id": l.id,
                "equipment": l.equipment.name,
                "patient": l.patient.full_name,
                "status": l.get_status_display(),
                "created_at": l.created_at.isoformat(),
            }
            for l in loans.select_related("equipment", "patient").order_by("-created_at")[:6]
        ]
        recent_requests = [
            {
                "id": r.id,
                "patient": r.patient.full_name,
                "category": r.get_category_display(),
                "priority": r.get_priority_display(),
                "status": r.get_status_display(),
                "created_at": r.created_at.isoformat(),
            }
            for r in requests.select_related("patient").order_by("-created_at")[:6]
        ]

        return Response({
            "role": user.role,
            "role_display": user.role_display,
            "scope": _scope_label(user),
            "generated_at": timezone.now().isoformat(),
            "kpis": kpis,
            "community": community,
            "charts": charts,
            "recent_loans": recent_loans,
            "recent_requests": recent_requests,
        })
