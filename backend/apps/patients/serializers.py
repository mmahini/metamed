from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "full_name", "national_id", "phone", "address",
            "disease_description", "need_description", "referral_source",
            "unit", "unit_name", "is_active",
            "created_by", "created_by_email", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "unit_name", "created_by_email"]
