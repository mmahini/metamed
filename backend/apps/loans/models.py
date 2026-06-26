from django.conf import settings
from django.db import models
from django.utils import timezone


class RequestStatus(models.TextChoices):
    PENDING = "pending", "در انتظار بررسی"
    APPROVED = "approved", "تأیید شده"
    FULFILLED = "fulfilled", "تأمین شده"
    REJECTED = "rejected", "رد شده"
    CANCELLED = "cancelled", "لغو شده"


class RequestPriority(models.TextChoices):
    LOW = "low", "عادی"
    NORMAL = "normal", "متوسط"
    HIGH = "high", "بالا"
    URGENT = "urgent", "اضطراری"


class EquipmentRequest(models.Model):
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE,
        related_name="requests", verbose_name="بیمار",
    )
    category = models.CharField(
        max_length=30,
        choices=[
            ("mobility", "تجهیزات حرکتی"),
            ("respiratory", "تجهیزات تنفسی"),
            ("bed_care", "تجهیزات بستری"),
            ("rehabilitation", "تجهیزات توانبخشی"),
            ("monitoring", "تجهیزات پایش و مراقبت"),
            ("other", "سایر"),
        ],
        verbose_name="دسته‌بندی موردنیاز",
    )
    description = models.TextField(blank=True, verbose_name="توضیحات")
    priority = models.CharField(
        max_length=10, choices=RequestPriority.choices,
        default=RequestPriority.NORMAL, verbose_name="اولویت",
    )
    status = models.CharField(
        max_length=20, choices=RequestStatus.choices,
        default=RequestStatus.PENDING, verbose_name="وضعیت",
    )
    unit = models.ForeignKey(
        "organization.Unit", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="requests", verbose_name="واحد",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="created_requests", verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "درخواست تجهیز"
        verbose_name_plural = "درخواست‌های تجهیزات"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.patient.full_name} — {self.get_category_display()}"


class Borrower(models.Model):
    """Person who physically receives equipment — may differ from the patient."""
    full_name = models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")
    national_id = models.CharField(max_length=10, blank=True, verbose_name="کد ملی")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    address = models.TextField(blank=True, verbose_name="آدرس")
    relationship = models.CharField(max_length=100, blank=True, verbose_name="نسبت با بیمار")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تحویل‌گیرنده"
        verbose_name_plural = "تحویل‌گیرندگان"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name


class LoanStatus(models.TextChoices):
    ASSIGNED = "assigned", "تخصیص یافته"
    DELIVERED = "delivered", "تحویل داده شده"
    RETURNED = "returned", "بازگشت داده شده"
    DISINFECTED = "disinfected", "ضدعفونی شده"
    CLOSED = "closed", "بسته شده"
    OVERDUE = "overdue", "معوق"


class Loan(models.Model):
    equipment = models.ForeignKey(
        "equipment.Equipment", on_delete=models.PROTECT,
        related_name="loans", verbose_name="تجهیز",
    )
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.PROTECT,
        related_name="loans", verbose_name="بیمار",
    )
    borrower = models.ForeignKey(
        Borrower, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="loans", verbose_name="تحویل‌گیرنده",
    )
    request = models.ForeignKey(
        EquipmentRequest, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="loans", verbose_name="درخواست مرتبط",
    )
    unit = models.ForeignKey(
        "organization.Unit", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="loans", verbose_name="واحد",
    )
    status = models.CharField(
        max_length=20, choices=LoanStatus.choices,
        default=LoanStatus.ASSIGNED, verbose_name="وضعیت",
    )
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تحویل")
    due_date = models.DateField(null=True, blank=True, verbose_name="موعد بازگشت")
    returned_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان بازگشت")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="created_loans", verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "امانت"
        verbose_name_plural = "امانت‌ها"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.equipment.code} → {self.patient.full_name}"

    @property
    def is_overdue(self) -> bool:
        if self.status in (LoanStatus.RETURNED, LoanStatus.DISINFECTED, LoanStatus.CLOSED):
            return False
        return bool(self.due_date and self.due_date < timezone.now().date())

    def deliver(self, *, due_date=None, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = LoanStatus.DELIVERED
        self.delivered_at = timezone.now()
        if due_date:
            self.due_date = due_date
        self.save(update_fields=["status", "delivered_at", "due_date", "updated_at"])
        self.equipment.change_status(EquipmentStatus.ON_LOAN, changed_by=by, notes="تحویل امانت")

    def mark_returned(self, *, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = LoanStatus.RETURNED
        self.returned_at = timezone.now()
        self.save(update_fields=["status", "returned_at", "updated_at"])
        self.equipment.change_status(
            EquipmentStatus.NEEDS_DISINFECTION, changed_by=by, notes="بازگشت امانت",
        )

    def close(self, *, by=None) -> None:
        from apps.equipment.models import EquipmentStatus
        self.status = LoanStatus.CLOSED
        self.save(update_fields=["status", "updated_at"])
        self.equipment.change_status(EquipmentStatus.READY, changed_by=by, notes="آماده خدمت مجدد")


class GuaranteeType(models.TextChoices):
    COMMITMENT = "commitment", "تعهدنامه"
    GUARANTOR = "guarantor", "ضامن"
    PROMISSORY = "promissory", "سفته"
    CHEQUE = "cheque", "چک"
    DEPOSIT = "deposit", "ودیعه نقدی"


class Guarantee(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="guarantees", verbose_name="امانت")
    type = models.CharField(max_length=20, choices=GuaranteeType.choices, verbose_name="نوع تضمین")
    reference = models.CharField(max_length=200, blank=True, verbose_name="شماره/مرجع")
    amount = models.DecimalField(
        max_digits=12, decimal_places=0, null=True, blank=True, verbose_name="مبلغ (ریال)"
    )
    guarantor_name = models.CharField(max_length=200, blank=True, verbose_name="نام ضامن")
    guarantor_phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن ضامن")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    returned = models.BooleanField(default=False, verbose_name="مسترد شده")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تضمین"
        verbose_name_plural = "تضمین‌ها"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_type_display()} — {self.loan}"
