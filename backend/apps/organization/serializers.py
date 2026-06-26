from rest_framework import serializers
from .models import Organization, Branch, Unit


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "code", "address", "phone", "created_at"]
        read_only_fields = ["id", "created_at"]


class BranchSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            "id", "organization", "organization_name", "name", "code",
            "city", "province", "address", "phone", "manager",
            "is_active", "unit_count", "created_at",
        ]
        read_only_fields = ["id", "organization_name", "unit_count", "created_at"]

    def get_unit_count(self, obj):
        return obj.units.filter(is_active=True).count()


class UnitSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_city = serializers.CharField(source="branch.city", read_only=True)

    class Meta:
        model = Unit
        fields = [
            "id", "branch", "branch_name", "branch_city", "name", "code",
            "address", "phone", "manager", "is_active", "created_at",
        ]
        read_only_fields = ["id", "branch_name", "branch_city", "created_at"]
