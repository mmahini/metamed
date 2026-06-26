import django.contrib.auth.models
import django.db.models.deletion
import django.utils.timezone
import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("full_name", models.CharField(blank=True, max_length=120)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("role", models.CharField(
                    choices=[
                        ("national_manager", "مدیر کل متامد"),
                        ("branch_manager", "مدیر شعبه"),
                        ("unit_manager", "مسئول واحد"),
                        ("reception", "کارشناس پذیرش"),
                        ("equipment", "کارشناس تجهیزات"),
                        ("maintenance", "کارشناس تعمیر و نگهداری"),
                        ("community", "کارشناس مشارکت‌های مردمی"),
                        ("supervisor", "ناظر"),
                        ("volunteer", "داوطلب"),
                    ],
                    default="volunteer",
                    max_length=30,
                )),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={"verbose_name": "کاربر", "verbose_name_plural": "کاربران"},
            managers=[("objects", django.contrib.auth.models.BaseUserManager())],
        ),
        migrations.CreateModel(
            name="EmailOTP",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254)),
                ("code", models.CharField(max_length=5)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
            ],
        ),
        migrations.AddIndex(
            model_name="emailotp",
            index=models.Index(fields=["email", "-created_at"], name="accounts_em_email_idx"),
        ),
    ]
