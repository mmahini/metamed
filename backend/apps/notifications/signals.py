from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.loans.models import EquipmentRequest
from apps.maintenance.models import DamageReport
from .models import notify_managers, NotificationKind


@receiver(post_save, sender=EquipmentRequest)
def on_request_created(sender, instance, created, **kwargs):
    if not created:
        return
    branch_id = instance.unit.branch_id if instance.unit_id else None
    notify_managers(
        title="درخواست تجهیز جدید",
        body=f"{instance.patient.full_name} — {instance.get_category_display()} (اولویت {instance.get_priority_display()})",
        kind=NotificationKind.REQUEST,
        link="/app/requests",
        branch_id=branch_id,
    )


@receiver(post_save, sender=DamageReport)
def on_damage_reported(sender, instance, created, **kwargs):
    if not created:
        return
    branch_id = instance.equipment.branch_id if instance.equipment.branch_id else None
    notify_managers(
        title="گزارش آسیب جدید",
        body=f"{instance.equipment.code} — {instance.get_severity_display()}",
        kind=NotificationKind.MAINTENANCE,
        link="/app/maintenance",
        branch_id=branch_id,
    )
