from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .email import EmailSendError, send_otp_email
from .models import EmailOTP, User
from .serializers import RequestOTPSerializer, UpdateProfileSerializer, UserSerializer, VerifyOTPSerializer


def _tokens_for(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@method_decorator(
    ratelimit(key="ip", rate=settings.AUTH_RATELIMIT_OTP_REQUEST_IP, method="POST", block=True),
    name="post",
)
@method_decorator(
    ratelimit(key="post:email", rate=settings.AUTH_RATELIMIT_OTP_REQUEST_EMAIL, method="POST", block=True),
    name="post",
)
class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        is_new_user = not User.objects.filter(email=email).exists()
        otp = EmailOTP.issue(email=email)

        try:
            send_otp_email(to=email, code=otp.code)
        except EmailSendError:
            return Response(
                {"detail": "ارسال ایمیل با خطا مواجه شد. لطفاً دوباره تلاش کنید.", "code": "email_send_failed"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payload: dict = {
            "otp_id": str(otp.id),
            "expires_at": otp.expires_at.isoformat(),
            "is_new_user": is_new_user,
        }
        if settings.OTP_EXPOSE_DEV_CODE:
            payload["dev_code"] = otp.code
        return Response(payload, status=status.HTTP_201_CREATED)


@method_decorator(
    ratelimit(key="ip", rate=settings.AUTH_RATELIMIT_OTP_VERIFY_IP, method="POST", block=True),
    name="post",
)
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_id = serializer.validated_data["otp_id"]
        code = serializer.validated_data["code"]

        try:
            otp = EmailOTP.objects.get(id=otp_id)
        except EmailOTP.DoesNotExist:
            return Response({"detail": "کد یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if otp.is_used:
            return Response({"detail": "این کد قبلاً استفاده شده است."}, status=status.HTTP_410_GONE)
        if otp.is_expired:
            return Response({"detail": "کد منقضی شده است."}, status=status.HTTP_410_GONE)
        if otp.is_locked:
            return Response({"detail": "تعداد تلاش‌های ناموفق بیش از حد مجاز است."}, status=status.HTTP_403_FORBIDDEN)

        if otp.code != code:
            otp.register_failed_attempt()
            remaining = max(0, 5 - otp.attempt_count)
            return Response(
                {"detail": "کد وارد شده صحیح نیست.", "attempts_remaining": remaining},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.mark_used()

        user, created = User.objects.get_or_create(
            email=otp.email,
            defaults={"full_name": ""},
        )

        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(
            {**_tokens_for(user), "user": UserSerializer(user).data},
            status=response_status,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
