from rest_framework import serializers
from .models import (
    Supplier, Equipment, EquipmentStatusHistory,
    EquipmentTransfer, EquipmentInspection,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_name", "phone", "address", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class EquipmentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source="changed_by.email", read_only=True)

    class Meta:
        model = EquipmentStatusHistory
        fields = ["id", "old_status", "new_status", "changed_by", "changed_by_email", "changed_at", "notes"]
        read_only_fields = ["id", "changed_at"]


class EquipmentSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    acquisition_type_display = serializers.CharField(source="get_acquisition_type_display", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id", "code", "serial_number", "name",
            "category", "category_display",
            "status", "status_display",
            "unit", "unit_name", "branch", "branch_name",
            "supplier", "supplier_name",
            "acquisition_type", "acquisition_type_display",
            "acquisition_date", "purchase_price",
            "notes", "is_active",
            "registered_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class ChangeStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[s[0] for s in Equipment._meta.get_field("status").choices])
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class EquipmentTransferSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    from_unit_name = serializers.CharField(source="from_unit.name", read_only=True)
    to_unit_name = serializers.CharField(source="to_unit.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = EquipmentTransfer
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "from_unit", "from_unit_name", "to_unit", "to_unit_name",
            "status", "status_display", "reason",
            "requested_by", "completed_at", "created_at",
        ]
        read_only_fields = ["id", "completed_at", "created_at", "from_unit"]


class EquipmentInspectionSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)
    result_display = serializers.CharField(source="get_result_display", read_only=True)
    inspected_by_email = serializers.CharField(source="inspected_by.email", read_only=True)

    class Meta:
        model = EquipmentInspection
        fields = [
            "id", "equipment", "equipment_code",
            "result", "result_display", "checklist", "notes",
            "inspected_by", "inspected_by_email", "inspected_at",
        ]
        read_only_fields = ["id", "inspected_at", "inspected_by_email"]


class BulkImportRowSerializer(serializers.Serializer):
    name = serializers.CharField()
    category = serializers.ChoiceField(
        choices=[c[0] for c in Equipment._meta.get_field("category").choices],
        required=False, default="other",
    )
    serial_number = serializers.CharField(required=False, allow_blank=True, default="")
    acquisition_type = serializers.ChoiceField(
        choices=[a[0] for a in Equipment._meta.get_field("acquisition_type").choices],
        required=False, default="donated",
    )
    unit = serializers.IntegerField(required=False, allow_null=True, default=None)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
