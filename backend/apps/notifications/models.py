from django.conf import settings
from django.db import models


class NotificationKind(models.TextChoices):
    REQUEST = "request", "درخواست"
    LOAN = "loan", "امانت"
    MAINTENANCE = "maintenance", "نگهداری"
    DONATION = "donation", "اهدا"
    SYSTEM = "system", "سیستمی"


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="notifications", verbose_name="گیرنده",
    )
    kind = models.CharField(
        max_length=20, choices=NotificationKind.choices,
        default=NotificationKind.SYSTEM, verbose_name="نوع",
    )
    title = models.CharField(max_length=200, verbose_name="عنوان")
    body = models.TextField(blank=True, verbose_name="متن")
    link = models.CharField(max_length=300, blank=True, verbose_name="پیوند")
    read = models.BooleanField(default=False, verbose_name="خوانده‌شده")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "اعلان"
        verbose_name_plural = "اعلان‌ها"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "read", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.recipient_id}: {self.title}"


def notify(recipient, *, title, body="", kind=NotificationKind.SYSTEM, link=""):
    return Notification.objects.create(
        recipient=recipient, title=title, body=body, kind=kind, link=link,
    )


def notify_managers(*, title, body="", kind=NotificationKind.SYSTEM, link="", branch_id=None):
    """Create a notification for every active manager (optionally branch-scoped)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    qs = User.objects.filter(
        is_active=True,
        role__in=["national_manager", "branch_manager", "unit_manager"],
    )
    if branch_id is not None:
        qs = qs.filter(models.Q(branch_id=branch_id) | models.Q(role="national_manager"))
    objs = [
        Notification(recipient=u, title=title, body=body, kind=kind, link=link)
        for u in qs
    ]
    Notification.objects.bulk_create(objs)
    return len(objs)
