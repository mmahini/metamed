from django.contrib import admin
from .models import (
    Supplier, Equipment, EquipmentStatusHistory,
    EquipmentTransfer, EquipmentInspection,
)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_name", "phone", "created_at"]
    search_fields = ["name"]


class StatusHistoryInline(admin.TabularInline):
    model = EquipmentStatusHistory
    extra = 0
    readonly_fields = ["old_status", "new_status", "changed_by", "changed_at", "notes"]
    can_delete = False


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "category", "status", "unit", "branch", "is_active", "created_at"]
    list_filter = ["status", "category", "acquisition_type", "is_active", "branch"]
    search_fields = ["code", "name", "serial_number"]
    readonly_fields = ["code", "created_at", "updated_at"]
    inlines = [StatusHistoryInline]
    raw_id_fields = ["unit", "branch", "supplier", "registered_by"]


@admin.register(EquipmentStatusHistory)
class EquipmentStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ["equipment", "old_status", "new_status", "changed_by", "changed_at"]
    list_filter = ["new_status"]
    readonly_fields = ["changed_at"]
    raw_id_fields = ["equipment", "changed_by"]


@admin.register(EquipmentTransfer)
class EquipmentTransferAdmin(admin.ModelAdmin):
    list_display = ["equipment", "from_unit", "to_unit", "status", "requested_by", "created_at"]
    list_filter = ["status"]
    raw_id_fields = ["equipment", "from_unit", "to_unit", "requested_by"]
    readonly_fields = ["created_at", "completed_at"]


@admin.register(EquipmentInspection)
class EquipmentInspectionAdmin(admin.ModelAdmin):
    list_display = ["equipment", "result", "inspected_by", "inspected_at"]
    list_filter = ["result"]
    raw_id_fields = ["equipment", "inspected_by"]
    readonly_fields = ["inspected_at"]
