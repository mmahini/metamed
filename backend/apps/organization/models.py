from django.conf import settings
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=200, verbose_name="نام سازمان")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد")
    address = models.TextField(blank=True, verbose_name="آدرس")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "سازمان"
        verbose_name_plural = "سازمان‌ها"

    def __str__(self) -> str:
        return self.name


class Branch(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="branches",
        verbose_name="سازمان",
    )
    name = models.CharField(max_length=200, verbose_name="نام شعبه")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد")
    city = models.CharField(max_length=100, verbose_name="شهر")
    province = models.CharField(max_length=100, verbose_name="استان")
    address = models.TextField(blank=True, verbose_name="آدرس")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_branches",
        verbose_name="مدیر شعبه",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "شعبه"
        verbose_name_plural = "شعبه‌ها"
        ordering = ["province", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.city})"


class Unit(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="units",
        verbose_name="شعبه",
    )
    name = models.CharField(max_length=200, verbose_name="نام واحد")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد")
    address = models.TextField(blank=True, verbose_name="آدرس")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_units",
        verbose_name="مسئول واحد",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "واحد"
        verbose_name_plural = "واحدها"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} — {self.branch.name}"
