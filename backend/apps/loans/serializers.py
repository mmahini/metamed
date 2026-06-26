from rest_framework import serializers
from .models import EquipmentRequest, Borrower, Loan, Guarantee


class EquipmentRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    unit_name = serializers.CharField(source="unit.name", read_only=True)

    class Meta:
        model = EquipmentRequest
        fields = [
            "id", "patient", "patient_name",
            "category", "category_display", "description",
            "priority", "priority_display",
            "status", "status_display",
            "unit", "unit_name", "requested_by",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "requested_by"]


class BorrowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrower
        fields = [
            "id", "full_name", "national_id", "phone",
            "address", "relationship", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class GuaranteeSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Guarantee
        fields = [
            "id", "loan", "type", "type_display", "reference", "amount",
            "guarantor_name", "guarantor_phone", "notes", "returned", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class LoanSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    borrower_name = serializers.CharField(source="borrower.full_name", read_only=True)
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    guarantees = GuaranteeSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "patient", "patient_name", "borrower", "borrower_name",
            "request", "unit", "unit_name",
            "status", "status_display", "is_overdue",
            "delivered_at", "due_date", "returned_at", "notes",
            "created_by", "guarantees", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by",
            "delivered_at", "returned_at",
        ]


class DeliverSerializer(serializers.Serializer):
    due_date = serializers.DateField(required=False, allow_null=True)
