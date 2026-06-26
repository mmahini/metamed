"""Outbound email via Resend (https://resend.com). No SDK — just a single POST."""
from __future__ import annotations

import logging

import requests
from django.conf import settings

log = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"


class EmailSendError(Exception):
    """Raised when Resend rejects the request or is unreachable."""


def send_otp_email(*, to: str, code: str) -> None:
    """Send a one-time login code to `to`. No-op if RESEND_API_KEY is unset."""
    api_key = settings.RESEND_API_KEY
    if not api_key:
        log.info("Resend not configured; skipping OTP email to %s", to)
        return

    subject = f"کد ورود متامد: {code}"

    try:
        res = requests.post(
            RESEND_ENDPOINT,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM,
                "to": [to],
                "subject": subject,
                "html": _render_html(code),
                "text": _render_text(code),
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        log.exception("Resend request failed for %s", to)
        raise EmailSendError(str(exc)) from exc

    if res.status_code >= 300:
        log.error("Resend rejected OTP for %s: %s %s", to, res.status_code, res.text)
        raise EmailSendError(f"Resend returned {res.status_code}")


def _render_html(code: str) -> str:
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
  <body style="font-family:Tahoma,Arial,sans-serif;background:#F5F8FD;padding:24px;margin:0;">
    <table role="presentation" style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;text-align:right;box-shadow:0 4px 20px rgba(27,82,196,.1);">
      <tr><td>
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#1B52C4;">متامد</span>
          <span style="font-size:13px;color:#64748B;display:block;margin-top:4px;">مرکز تجهیزات امانی مراقبتی درمانی</span>
        </div>
        <p style="color:#1A2545;line-height:1.8;margin:0 0 20px;">سلام،<br>برای ورود به سامانه متامد، کد یک‌بارمصرف زیر را در مدت ۱۰ دقیقه وارد کنید:</p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:800;text-align:center;padding:20px;background:#EBF1FD;border-radius:12px;color:#1B52C4;direction:ltr;margin:20px 0;">{code}</div>
        <p style="color:#64748B;font-size:13px;line-height:1.8;margin:0;">اگر این درخواست از شما نبوده، این ایمیل را نادیده بگیرید.<br>این کد برای هیچ‌کس دیگری ارسال نشود.</p>
      </td></tr>
    </table>
  </body>
</html>"""


def _render_text(code: str) -> str:
    return (
        "متامد — مرکز تجهیزات امانی مراقبتی درمانی\n\n"
        f"کد ورود شما: {code}\n"
        "این کد تا ۱۰ دقیقه معتبر است.\n\n"
        "اگر این درخواست از شما نبوده، این ایمیل را نادیده بگیرید."
    )
