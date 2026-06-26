from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    role_display = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "role_display",
            "display_name",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "is_staff", "date_joined", "role"]


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    otp_id = serializers.UUIDField()
    code = serializers.CharField(min_length=5, max_length=5)


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone"]
