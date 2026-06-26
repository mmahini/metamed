from django.conf import settings
from django.db import models
from django.utils import timezone


class DamageSeverity(models.TextChoices):
    MINOR = "minor", "جزئی"
    MODERATE = "moderate", "متوسط"
    MAJOR = "major", "شدید"
    IRREPARABLE = "irreparable", "غیرقابل تعمیر"


class DamageReport(models.Model):
    equipment = models.ForeignKey(
        "equipment.Equipment", on_delete=models.CASCADE,
        related_name="damage_reports", verbose_name="تجهیز",
    )
    loan = models.ForeignKey(
        "loans.Loan", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="damage_reports", verbose_name="امانت مرتبط",
    )
    severity = models.CharField(
        max_length=20, choices=DamageSeverity.choices,
        default=DamageSeverity.MINOR, verbose_name="شدت آسیب",
    )
    description = models.TextField(verbose_name="شرح آسیب")
    resolved = models.BooleanField(default=False, verbose_name="رسیدگی شده")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="damage_reports", verbose_name="گزارش‌دهنده",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "گزارش آسیب"
        verbose_name_plural = "گزارش‌های آسیب"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code} — {self.get_severity_display()}"


class MaintenanceStatus(models.TextChoices):
    OPEN = "open", "باز"
    IN_PROGRESS = "in_progress", "در حال تعمیر"
    AWAITING_PARTS = "awaiting_parts", "در انتظار قطعه"
    COMPLETED = "completed", "تکمیل شده"
    DECOMMISSIONED = "decommissioned", "اسقاط"


class Maintenance(models.Model):
    equipment = models.ForeignKey(
        "equipment.Equipment", on_delete=models.CASCADE,
        related_name="maintenances", verbose_name="تجهیز",
    )
    damage_report = models.ForeignKey(
        DamageReport, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="maintenances", verbose_name="گزارش آسیب",
    )
    status = models.CharField(
        max_length=20, choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.OPEN, verbose_name="وضعیت",
    )
    description = models.TextField(blank=True, verbose_name="شرح کار")
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="maintenances", verbose_name="تکنسین",
    )
    supplier = models.ForeignKey(
        "equipment.Supplier", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="maintenances", verbose_name="تأمین‌کننده قطعه",
    )
    cost = models.DecimalField(
        max_digits=12, decimal_places=0, null=True, blank=True, verbose_name="هزینه (ریال)"
    )
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان شروع")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تکمیل")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تعمیر"
        verbose_name_plural = "تعمیرها"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code} — {self.get_status_display()}"

    def start(self, *, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = MaintenanceStatus.IN_PROGRESS
        self.started_at = timezone.now()
        if by and not self.technician_id:
            self.technician = by
        self.save(update_fields=["status", "started_at", "technician", "updated_at"])
        self.equipment.change_status(EquipmentStatus.UNDER_REPAIR, changed_by=by, notes="شروع تعمیر")

    def await_parts(self, *, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = MaintenanceStatus.AWAITING_PARTS
        self.save(update_fields=["status", "updated_at"])
        self.equipment.change_status(EquipmentStatus.AWAITING_PARTS, changed_by=by, notes="در انتظار قطعه")

    def complete(self, *, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = MaintenanceStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at", "updated_at"])
        if self.damage_report and not self.damage_report.resolved:
            self.damage_report.resolved = True
            self.damage_report.save(update_fields=["resolved"])
        self.equipment.change_status(EquipmentStatus.READY, changed_by=by, notes="تعمیر تکمیل شد")

    def decommission(self, *, by=None, reason: str = "") -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = MaintenanceStatus.DECOMMISSIONED
        self.completed_at = timezone.now()
        if reason:
            self.notes = (self.notes + "\n" + reason).strip()
        self.save(update_fields=["status", "completed_at", "notes", "updated_at"])
        self.equipment.is_active = False
        self.equipment.save(update_fields=["is_active", "updated_at"])
        self.equipment.change_status(
            EquipmentStatus.DECOMMISSIONED, changed_by=by, notes=reason or "اسقاط",
        )
