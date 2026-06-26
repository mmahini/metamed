from django.contrib import admin
from .models import EquipmentRequest, Borrower, Loan, Guarantee


@admin.register(EquipmentRequest)
class EquipmentRequestAdmin(admin.ModelAdmin):
    list_display = ["patient", "category", "priority", "status", "unit", "created_at"]
    list_filter = ["status", "priority", "category"]
    search_fields = ["patient__full_name"]
    raw_id_fields = ["patient", "unit", "requested_by"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Borrower)
class BorrowerAdmin(admin.ModelAdmin):
    list_display = ["full_name", "national_id", "phone", "relationship"]
    search_fields = ["full_name", "national_id", "phone"]


class GuaranteeInline(admin.TabularInline):
    model = Guarantee
    extra = 0
    raw_id_fields = []


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ["equipment", "patient", "status", "delivered_at", "due_date", "returned_at"]
    list_filter = ["status"]
    search_fields = ["equipment__code", "patient__full_name"]
    raw_id_fields = ["equipment", "patient", "borrower", "request", "unit", "created_by"]
    readonly_fields = ["created_at", "updated_at", "delivered_at", "returned_at"]
    inlines = [GuaranteeInline]


@admin.register(Guarantee)
class GuaranteeAdmin(admin.ModelAdmin):
    list_display = ["loan", "type", "reference", "amount", "returned", "created_at"]
    list_filter = ["type", "returned"]
    raw_id_fields = ["loan"]
