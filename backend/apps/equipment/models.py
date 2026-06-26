from django.conf import settings
from django.db import models


class EquipmentStatus(models.TextChoices):
    READY = "ready", "آماده خدمت"
    RESERVED = "reserved", "رزرو شده"
    ON_LOAN = "on_loan", "امانت داده شده"
    IN_TRANSFER = "in_transfer", "در حال انتقال"
    NEEDS_REVIEW = "needs_review", "نیازمند بررسی"
    NEEDS_DISINFECTION = "needs_disinfection", "نیازمند ضدعفونی"
    UNDER_REPAIR = "under_repair", "در حال تعمیر"
    AWAITING_PARTS = "awaiting_parts", "در انتظار قطعه"
    DECOMMISSIONED = "decommissioned", "خارج از خدمت"
    SCRAPPED = "scrapped", "اسقاط شده"
    LOST = "lost", "مفقود شده"


class EquipmentCategory(models.TextChoices):
    MOBILITY = "mobility", "تجهیزات حرکتی"
    RESPIRATORY = "respiratory", "تجهیزات تنفسی"
    BED_CARE = "bed_care", "تجهیزات بستری"
    REHABILITATION = "rehabilitation", "تجهیزات توانبخشی"
    MONITORING = "monitoring", "تجهیزات پایش و مراقبت"
    OTHER = "other", "سایر"


class AcquisitionType(models.TextChoices):
    DONATED = "donated", "اهدایی"
    PURCHASED = "purchased", "خریداری شده"
    TRANSFERRED = "transferred", "انتقالی"


class Supplier(models.Model):
    name = models.CharField(max_length=200, verbose_name="نام تأمین‌کننده")
    contact_name = models.CharField(max_length=100, blank=True, verbose_name="نام تماس")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    address = models.TextField(blank=True, verbose_name="آدرس")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تأمین‌کننده"
        verbose_name_plural = "تأمین‌کنندگان"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Equipment(models.Model):
    code = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="کد تجهیز")
    serial_number = models.CharField(max_length=100, blank=True, verbose_name="سریال")
    name = models.CharField(max_length=200, verbose_name="نام تجهیز")
    category = models.CharField(
        max_length=30,
        choices=EquipmentCategory.choices,
        default=EquipmentCategory.OTHER,
        verbose_name="دسته‌بندی",
    )
    status = models.CharField(
        max_length=30,
        choices=EquipmentStatus.choices,
        default=EquipmentStatus.READY,
        verbose_name="وضعیت",
    )
    unit = models.ForeignKey(
        "organization.Unit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="equipment",
        verbose_name="واحد",
    )
    branch = models.ForeignKey(
        "organization.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="equipment",
        verbose_name="شعبه",
    )
    supplier = models.ForeignKey(
        Supplier,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="equipment",
        verbose_name="تأمین‌کننده",
    )
    acquisition_type = models.CharField(
        max_length=20,
        choices=AcquisitionType.choices,
        default=AcquisitionType.DONATED,
        verbose_name="نوع تملک",
    )
    acquisition_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تملک")
    purchase_price = models.DecimalField(
        max_digits=12, decimal_places=0, null=True, blank=True, verbose_name="قیمت (ریال)"
    )
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="registered_equipment",
        verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تجهیز"
        verbose_name_plural = "تجهیزات"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.code or '—'} — {self.name}"

    def save(self, *args, **kwargs):
        generating_code = not self.code
        super().save(*args, **kwargs)
        if generating_code:
            self.code = f"MM-{self.pk:06d}"
            Equipment.objects.filter(pk=self.pk).update(code=self.code)

    def change_status(self, new_status: str, changed_by=None, notes: str = "") -> "EquipmentStatusHistory":
        old_status = self.status
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        return EquipmentStatusHistory.objects.create(
            equipment=self,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )


class TransferStatus(models.TextChoices):
    PENDING = "pending", "در انتظار تأیید"
    IN_TRANSIT = "in_transit", "در حال انتقال"
    COMPLETED = "completed", "تکمیل شده"
    CANCELLED = "cancelled", "لغو شده"


class EquipmentTransfer(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="transfers")
    from_unit = models.ForeignKey(
        "organization.Unit", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="transfers_out", verbose_name="از واحد",
    )
    to_unit = models.ForeignKey(
        "organization.Unit", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="transfers_in", verbose_name="به واحد",
    )
    status = models.CharField(
        max_length=20, choices=TransferStatus.choices,
        default=TransferStatus.PENDING, verbose_name="وضعیت انتقال",
    )
    reason = models.TextField(blank=True, verbose_name="دلیل انتقال")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="requested_transfers", verbose_name="درخواست‌دهنده",
    )
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تکمیل")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "انتقال تجهیز"
        verbose_name_plural = "انتقال‌های تجهیزات"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code}: {self.from_unit} → {self.to_unit}"

    def complete(self, completed_by=None) -> None:
        from django.utils import timezone
        self.status = TransferStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at"])
        # move the equipment to the destination unit
        self.equipment.unit = self.to_unit
        if self.to_unit:
            self.equipment.branch = self.to_unit.branch
        self.equipment.save(update_fields=["unit", "branch", "updated_at"])
        self.equipment.change_status(
            EquipmentStatus.READY, changed_by=completed_by, notes="انتقال تکمیل شد",
        )


class InspectionResult(models.TextChoices):
    PASS = "pass", "سالم"
    MINOR_ISSUE = "minor_issue", "نقص جزئی"
    NEEDS_REPAIR = "needs_repair", "نیازمند تعمیر"
    FAIL = "fail", "مردود"


class EquipmentInspection(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="inspections")
    result = models.CharField(
        max_length=20, choices=InspectionResult.choices,
        default=InspectionResult.PASS, verbose_name="نتیجه بازرسی",
    )
    checklist = models.JSONField(default=dict, blank=True, verbose_name="چک‌لیست")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="inspections", verbose_name="بازرس",
    )
    inspected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "بازرسی تجهیز"
        verbose_name_plural = "بازرسی‌های تجهیزات"
        ordering = ["-inspected_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code}: {self.get_result_display()}"


class EquipmentStatusHistory(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=30, blank=True, verbose_name="وضعیت قبلی")
    new_status = models.CharField(max_length=30, verbose_name="وضعیت جدید")
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, verbose_name="تغییر توسط"
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, verbose_name="توضیحات")

    class Meta:
        verbose_name = "تاریخچه وضعیت"
        verbose_name_plural = "تاریخچه‌های وضعیت"
        ordering = ["-changed_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code}: {self.old_status} → {self.new_status}"
