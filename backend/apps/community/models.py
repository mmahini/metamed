from django.conf import settings
from django.db import models


class DonorType(models.TextChoices):
    INDIVIDUAL = "individual", "حقیقی"
    ORGANIZATION = "organization", "حقوقی"


class Donor(models.Model):
    name = models.CharField(max_length=200, verbose_name="نام خیر")
    type = models.CharField(
        max_length=20, choices=DonorType.choices,
        default=DonorType.INDIVIDUAL, verbose_name="نوع",
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    email = models.EmailField(blank=True, verbose_name="ایمیل")
    national_id = models.CharField(max_length=20, blank=True, verbose_name="کد ملی/شناسه")
    address = models.TextField(blank=True, verbose_name="آدرس")
    anonymous = models.BooleanField(default=False, verbose_name="ناشناس")
    branch = models.ForeignKey(
        "organization.Branch", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="donors", verbose_name="شعبه",
    )
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "خیر"
        verbose_name_plural = "خیرین"
        ordering = ["name"]

    def __str__(self) -> str:
        return "ناشناس" if self.anonymous else self.name


class CashDonationMethod(models.TextChoices):
    CASH = "cash", "نقدی"
    CARD = "card", "کارت‌خوان"
    TRANSFER = "transfer", "انتقال بانکی"
    ONLINE = "online", "درگاه آنلاین"


class CashDonation(models.Model):
    donor = models.ForeignKey(
        Donor, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="cash_donations", verbose_name="خیر",
    )
    amount = models.DecimalField(max_digits=14, decimal_places=0, verbose_name="مبلغ (ریال)")
    method = models.CharField(
        max_length=20, choices=CashDonationMethod.choices,
        default=CashDonationMethod.CASH, verbose_name="روش پرداخت",
    )
    reference = models.CharField(max_length=200, blank=True, verbose_name="شماره پیگیری")
    purpose = models.CharField(max_length=200, blank=True, verbose_name="بابت")
    branch = models.ForeignKey(
        "organization.Branch", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="cash_donations", verbose_name="شعبه",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="received_donations", verbose_name="دریافت‌کننده",
    )
    donated_at = models.DateField(null=True, blank=True, verbose_name="تاریخ اهدا")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "اهدای نقدی"
        verbose_name_plural = "اهدای‌های نقدی"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.amount} ریال — {self.donor or 'ناشناس'}"


class EquipmentDonation(models.Model):
    donor = models.ForeignKey(
        Donor, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="equipment_donations", verbose_name="خیر",
    )
    equipment = models.ForeignKey(
        "equipment.Equipment", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="donation", verbose_name="تجهیز ثبت‌شده",
    )
    item_name = models.CharField(max_length=200, verbose_name="نام قلم اهدایی")
    estimated_value = models.DecimalField(
        max_digits=14, decimal_places=0, null=True, blank=True, verbose_name="ارزش برآوردی (ریال)"
    )
    branch = models.ForeignKey(
        "organization.Branch", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="equipment_donations", verbose_name="شعبه",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="received_equipment_donations", verbose_name="دریافت‌کننده",
    )
    donated_at = models.DateField(null=True, blank=True, verbose_name="تاریخ اهدا")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "اهدای تجهیز"
        verbose_name_plural = "اهدای‌های تجهیزات"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.item_name} — {self.donor or 'ناشناس'}"


class Volunteer(models.Model):
    full_name = models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    email = models.EmailField(blank=True, verbose_name="ایمیل")
    skills = models.CharField(max_length=300, blank=True, verbose_name="مهارت‌ها")
    availability = models.CharField(max_length=200, blank=True, verbose_name="در دسترس بودن")
    branch = models.ForeignKey(
        "organization.Branch", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="volunteers", verbose_name="شعبه",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="volunteer_profiles", verbose_name="کاربر مرتبط",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    notes = models.TextField(blank=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "داوطلب"
        verbose_name_plural = "داوطلبان"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name
