import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("organization", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Patient",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")),
                ("national_id", models.CharField(blank=True, max_length=10, verbose_name="کد ملی")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("disease_description", models.TextField(blank=True, verbose_name="توضیح بیماری")),
                ("need_description", models.TextField(blank=True, verbose_name="توضیح نیاز")),
                ("referral_source", models.CharField(blank=True, max_length=200, verbose_name="مرجع معرفی")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "unit",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="patients",
                        to="organization.unit",
                        verbose_name="واحد",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="ثبت‌کننده",
                    ),
                ),
            ],
            options={"verbose_name": "بیمار", "verbose_name_plural": "بیماران", "ordering": ["-created_at"]},
        ),
    ]
