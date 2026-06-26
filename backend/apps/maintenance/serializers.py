from rest_framework import serializers
from .models import DamageReport, Maintenance


class DamageReportSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)
    reported_by_email = serializers.CharField(source="reported_by.email", read_only=True)

    class Meta:
        model = DamageReport
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "loan", "severity", "severity_display", "description",
            "resolved", "reported_by", "reported_by_email", "created_at",
        ]
        read_only_fields = ["id", "created_at", "reported_by", "reported_by_email"]


class MaintenanceSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    technician_email = serializers.CharField(source="technician.email", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Maintenance
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "damage_report", "status", "status_display", "description",
            "technician", "technician_email", "supplier", "supplier_name",
            "cost", "started_at", "completed_at", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "started_at", "completed_at",
            "technician_email", "supplier_name",
        ]


class DecommissionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")
