from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["full_name", "national_id", "phone", "unit", "is_active", "created_at"]
    list_filter = ["is_active", "unit"]
    search_fields = ["full_name", "national_id", "phone"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["unit", "created_by"]
