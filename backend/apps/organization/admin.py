from django.contrib import admin
from .models import Organization, Branch, Unit


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "phone", "created_at"]
    search_fields = ["name", "code"]


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "city", "province", "organization", "is_active", "created_at"]
    list_filter = ["province", "is_active", "organization"]
    search_fields = ["name", "code", "city"]
    autocomplete_fields = ["manager"]
    raw_id_fields = ["organization"]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "branch", "is_active", "created_at"]
    list_filter = ["branch", "is_active"]
    search_fields = ["name", "code"]
    autocomplete_fields = ["manager"]
    raw_id_fields = ["branch"]
