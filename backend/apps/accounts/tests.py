from django.test import TestCase
from django.utils import timezone

from .models import EmailOTP, User, OTP_MAX_ATTEMPTS


class UserCreationTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(email="test@example.com")
        self.assertEqual(user.email, "test@example.com")
        self.assertFalse(user.has_usable_password())

    def test_create_superuser(self):
        user = User.objects.create_superuser(email="admin@example.com", password="pass")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_display_name_uses_full_name(self):
        user = User(email="x@y.com", full_name="علی محمدی")
        self.assertEqual(user.display_name, "علی محمدی")

    def test_display_name_falls_back_to_email_local(self):
        user = User(email="ali@example.com")
        self.assertEqual(user.display_name, "ali")


class EmailOTPTest(TestCase):
    def test_issue_creates_otp(self):
        otp = EmailOTP.issue("test@example.com")
        self.assertFalse(otp.is_expired)
        self.assertFalse(otp.is_used)
        self.assertFalse(otp.is_locked)

    def test_mark_used(self):
        otp = EmailOTP.issue("test@example.com")
        otp.mark_used()
        self.assertTrue(otp.is_used)

    def test_failed_attempts_lock(self):
        otp = EmailOTP.issue("test@example.com")
        for _ in range(OTP_MAX_ATTEMPTS):
            otp.register_failed_attempt()
        self.assertTrue(otp.is_locked)

    def test_expired(self):
        otp = EmailOTP.issue("test@example.com")
        otp.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        self.assertTrue(otp.is_expired)
