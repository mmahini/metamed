from datetime import timedelta
from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-secret-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# ── Database ────────────────────────────────────────────────────────────────
# Production: parse DATABASE_URL (supports mysql:// and postgresql://)
# Development: read individual MYSQL_* env vars (set by docker-compose)

db_url = os.getenv("DATABASE_URL", "").strip()
if db_url:
    from urllib.parse import urlparse
    _u = urlparse(db_url)
    _scheme = _u.scheme.lower()
    if _scheme.startswith("postgres"):
        _engine = "django.db.backends.postgresql"
        _opts: dict = {}
    else:
        _engine = "django.db.backends.mysql"
        _opts = {"charset": "utf8mb4"}
    DATABASES = {
        "default": {
            "ENGINE": _engine,
            "NAME": _u.path.lstrip("/"),
            "USER": _u.username,
            "PASSWORD": _u.password,
            "HOST": _u.hostname,
            "PORT": _u.port or (3306 if "mysql" in _scheme else 5432),
            "OPTIONS": _opts,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("MYSQL_DATABASE", "metamed"),
            "USER": os.getenv("MYSQL_USER", "metamed"),
            "PASSWORD": os.getenv("MYSQL_PASSWORD", "metamed"),
            "HOST": os.getenv("MYSQL_HOST", "db"),
            "PORT": os.getenv("MYSQL_PORT", "3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }

# ── Auth ────────────────────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── Internationalisation ─────────────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

# ── Static files ─────────────────────────────────────────────────────────────

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5175,http://127.0.0.1:5175",
).split(",")

_csrf_trusted = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
if _csrf_trusted:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_trusted.split(",") if o.strip()]

# ── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# Sliding sessions: refresh every call issues a new refresh token so active
# users stay logged in indefinitely. Re-OTP needed only after long inactivity.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "180"))),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ── OTP / Rate limits ────────────────────────────────────────────────────────

# Permissive in DEBUG so local testing doesn't trip limits.
AUTH_RATELIMIT_OTP_REQUEST_IP = os.getenv(
    "AUTH_RATELIMIT_OTP_REQUEST_IP",
    "60/m" if DEBUG else "5/m",
)
AUTH_RATELIMIT_OTP_REQUEST_EMAIL = os.getenv(
    "AUTH_RATELIMIT_OTP_REQUEST_EMAIL",
    "120/h" if DEBUG else "10/h",
)
AUTH_RATELIMIT_OTP_VERIFY_IP = os.getenv(
    "AUTH_RATELIMIT_OTP_VERIFY_IP",
    "60/m" if DEBUG else "10/m",
)

# Resend transactional email. Unset → email skipped; OTP still returned in
# API response when OTP_EXPOSE_DEV_CODE is true (safe for local dev only).
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM", "متامد <noreply@metamed.ir>")
OTP_EXPOSE_DEV_CODE = os.getenv("OTP_EXPOSE_DEV_CODE", "1" if DEBUG else "").lower() in {"1", "true", "yes"}
