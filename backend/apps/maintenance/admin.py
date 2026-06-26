from django.contrib import admin
from .models import DamageReport, Maintenance


@admin.register(DamageReport)
class DamageReportAdmin(admin.ModelAdmin):
    list_display = ["equipment", "severity", "resolved", "reported_by", "created_at"]
    list_filter = ["severity", "resolved"]
    search_fields = ["equipment__code"]
    raw_id_fields = ["equipment", "loan", "reported_by"]
    readonly_fields = ["created_at"]


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ["equipment", "status", "technician", "cost", "started_at", "completed_at"]
    list_filter = ["status"]
    search_fields = ["equipment__code"]
    raw_id_fields = ["equipment", "damage_report", "technician", "supplier"]
    readonly_fields = ["created_at", "updated_at", "started_at", "completed_at"]
