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
            name="Supplier",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="نام تأمین‌کننده")),
                ("contact_name", models.CharField(blank=True, max_length=100, verbose_name="نام تماس")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("notes", models.TextField(blank=True, verbose_name="توضیحات")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "تأمین‌کننده", "verbose_name_plural": "تأمین‌کنندگان", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Equipment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(blank=True, max_length=20, null=True, unique=True, verbose_name="کد تجهیز")),
                ("serial_number", models.CharField(blank=True, max_length=100, verbose_name="سریال")),
                ("name", models.CharField(max_length=200, verbose_name="نام تجهیز")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("mobility", "تجهیزات حرکتی"),
                            ("respiratory", "تجهیزات تنفسی"),
                            ("bed_care", "تجهیزات بستری"),
                            ("rehabilitation", "تجهیزات توانبخشی"),
                            ("monitoring", "تجهیزات پایش و مراقبت"),
                            ("other", "سایر"),
                        ],
                        default="other",
                        max_length=30,
                        verbose_name="دسته‌بندی",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ready", "آماده خدمت"),
                            ("reserved", "رزرو شده"),
                            ("on_loan", "امانت داده شده"),
                            ("in_transfer", "در حال انتقال"),
                            ("needs_review", "نیازمند بررسی"),
                            ("needs_disinfection", "نیازمند ضدعفونی"),
                            ("under_repair", "در حال تعمیر"),
                            ("awaiting_parts", "در انتظار قطعه"),
                            ("decommissioned", "خارج از خدمت"),
                            ("scrapped", "اسقاط شده"),
                            ("lost", "مفقود شده"),
                        ],
                        default="ready",
                        max_length=30,
                        verbose_name="وضعیت",
                    ),
                ),
                (
                    "acquisition_type",
                    models.CharField(
                        choices=[
                            ("donated", "اهدایی"),
                            ("purchased", "خریداری شده"),
                            ("transferred", "انتقالی"),
                        ],
                        default="donated",
                        max_length=20,
                        verbose_name="نوع تملک",
                    ),
                ),
                ("acquisition_date", models.DateField(blank=True, null=True, verbose_name="تاریخ تملک")),
                ("purchase_price", models.DecimalField(blank=True, decimal_places=0, max_digits=12, null=True, verbose_name="قیمت (ریال)")),
                ("notes", models.TextField(blank=True, verbose_name="توضیحات")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "branch",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="equipment",
                        to="organization.branch",
                        verbose_name="شعبه",
                    ),
                ),
                (
                    "unit",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="equipment",
                        to="organization.unit",
                        verbose_name="واحد",
                    ),
                ),
                (
                    "supplier",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="equipment",
                        to="equipment.supplier",
                        verbose_name="تأمین‌کننده",
                    ),
                ),
                (
                    "registered_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="registered_equipment",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="ثبت‌کننده",
                    ),
                ),
            ],
            options={"verbose_name": "تجهیز", "verbose_name_plural": "تجهیزات", "ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="EquipmentStatusHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("old_status", models.CharField(blank=True, max_length=30, verbose_name="وضعیت قبلی")),
                ("new_status", models.CharField(max_length=30, verbose_name="وضعیت جدید")),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True, verbose_name="توضیحات")),
                (
                    "equipment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="equipment.equipment",
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="تغییر توسط",
                    ),
                ),
            ],
            options={"verbose_name": "تاریخچه وضعیت", "verbose_name_plural": "تاریخچه‌های وضعیت", "ordering": ["-changed_at"]},
        ),
    ]
