import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


OTP_LENGTH = 5
OTP_TTL = timedelta(minutes=10)
OTP_MAX_ATTEMPTS = 5


class UserRole(models.TextChoices):
    NATIONAL_MANAGER = "national_manager", "مدیر کل متامد"
    BRANCH_MANAGER = "branch_manager", "مدیر شعبه"
    UNIT_MANAGER = "unit_manager", "مسئول واحد"
    RECEPTION = "reception", "کارشناس پذیرش"
    EQUIPMENT = "equipment", "کارشناس تجهیزات"
    MAINTENANCE = "maintenance", "کارشناس تعمیر و نگهداری"
    COMMUNITY = "community", "کارشناس مشارکت‌های مردمی"
    SUPERVISOR = "supervisor", "ناظر"
    VOLUNTEER = "volunteer", "داوطلب"


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return email
    if len(local) <= 2:
        masked = local[0] + "*"
    else:
        masked = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked}@{domain}"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.NATIONAL_MANAGER)
        if extra_fields["is_staff"] is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields["is_superuser"] is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.VOLUNTEER,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self) -> str:
        return self.email

    @property
    def display_name(self) -> str:
        return self.full_name or self.email.split("@", 1)[0]

    @property
    def role_display(self) -> str:
        return UserRole(self.role).label if self.role else ""


def _generate_otp_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


class EmailOTP(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    code = models.CharField(max_length=OTP_LENGTH)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["email", "-created_at"])]

    @classmethod
    def issue(cls, email: str) -> "EmailOTP":
        return cls.objects.create(
            email=email.lower(),
            code=_generate_otp_code(),
            expires_at=timezone.now() + OTP_TTL,
        )

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_locked(self) -> bool:
        return self.attempt_count >= OTP_MAX_ATTEMPTS

    def mark_used(self) -> None:
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    def register_failed_attempt(self) -> None:
        self.attempt_count = models.F("attempt_count") + 1
        self.save(update_fields=["attempt_count"])
        self.refresh_from_db(fields=["attempt_count"])
