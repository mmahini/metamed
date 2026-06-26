from rest_framework import serializers
from .models import Donor, CashDonation, EquipmentDonation, Volunteer


class DonorSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    total_cash = serializers.SerializerMethodField()
    donation_count = serializers.SerializerMethodField()

    class Meta:
        model = Donor
        fields = [
            "id", "name", "type", "type_display", "phone", "email",
            "national_id", "address", "anonymous", "branch", "branch_name",
            "notes", "total_cash", "donation_count", "created_at",
        ]
        read_only_fields = ["id", "created_at", "type_display", "branch_name", "total_cash", "donation_count"]

    def get_total_cash(self, obj):
        return sum((d.amount for d in obj.cash_donations.all()), 0)

    def get_donation_count(self, obj):
        return obj.cash_donations.count() + obj.equipment_donations.count()


class CashDonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    method_display = serializers.CharField(source="get_method_display", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = CashDonation
        fields = [
            "id", "donor", "donor_name", "amount", "method", "method_display",
            "reference", "purpose", "branch", "branch_name",
            "received_by", "donated_at", "created_at",
        ]
        read_only_fields = ["id", "created_at", "received_by", "donor_name", "method_display", "branch_name"]

    def get_donor_name(self, obj):
        if obj.donor is None:
            return "ناشناس"
        return str(obj.donor)


class EquipmentDonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)

    class Meta:
        model = EquipmentDonation
        fields = [
            "id", "donor", "donor_name", "equipment", "equipment_code",
            "item_name", "estimated_value", "branch", "branch_name",
            "received_by", "donated_at", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at", "received_by", "donor_name", "branch_name", "equipment_code"]

    def get_donor_name(self, obj):
        if obj.donor is None:
            return "ناشناس"
        return str(obj.donor)


class VolunteerSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Volunteer
        fields = [
            "id", "full_name", "phone", "email", "skills", "availability",
            "branch", "branch_name", "user", "is_active", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at", "branch_name"]
