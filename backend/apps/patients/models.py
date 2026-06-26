from django.conf import settings
from django.db import models


class Patient(models.Model):
    full_name = models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")
    national_id = models.CharField(max_length=10, blank=True, verbose_name="کد ملی")
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    address = models.TextField(blank=True, verbose_name="آدرس")
    disease_description = models.TextField(blank=True, verbose_name="توضیح بیماری")
    need_description = models.TextField(blank=True, verbose_name="توضیح نیاز")
    referral_source = models.CharField(max_length=200, blank=True, verbose_name="مرجع معرفی")
    unit = models.ForeignKey(
        "organization.Unit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="patients",
        verbose_name="واحد",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="ثبت‌کننده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "بیمار"
        verbose_name_plural = "بیماران"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.full_name
