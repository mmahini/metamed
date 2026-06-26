import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="نام سازمان")),
                ("code", models.CharField(max_length=20, unique=True, verbose_name="کد")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "سازمان", "verbose_name_plural": "سازمان‌ها"},
        ),
        migrations.CreateModel(
            name="Branch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="نام شعبه")),
                ("code", models.CharField(max_length=20, unique=True, verbose_name="کد")),
                ("city", models.CharField(max_length=100, verbose_name="شهر")),
                ("province", models.CharField(max_length=100, verbose_name="استان")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="branches",
                        to="organization.organization",
                        verbose_name="سازمان",
                    ),
                ),
                (
                    "manager",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="managed_branches",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="مدیر شعبه",
                    ),
                ),
            ],
            options={
                "verbose_name": "شعبه",
                "verbose_name_plural": "شعبه‌ها",
                "ordering": ["province", "name"],
            },
        ),
        migrations.CreateModel(
            name="Unit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="نام واحد")),
                ("code", models.CharField(max_length=20, unique=True, verbose_name="کد")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "branch",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="units",
                        to="organization.branch",
                        verbose_name="شعبه",
                    ),
                ),
                (
                    "manager",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="managed_units",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="مسئول واحد",
                    ),
                ),
            ],
            options={
                "verbose_name": "واحد",
                "verbose_name_plural": "واحدها",
                "ordering": ["name"],
            },
        ),
    ]
