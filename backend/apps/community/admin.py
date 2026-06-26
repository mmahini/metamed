from django.contrib import admin
from .models import Donor, CashDonation, EquipmentDonation, Volunteer


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "phone", "anonymous", "branch", "created_at"]
    list_filter = ["type", "anonymous"]
    search_fields = ["name", "phone", "national_id"]
    raw_id_fields = ["branch"]


@admin.register(CashDonation)
class CashDonationAdmin(admin.ModelAdmin):
    list_display = ["donor", "amount", "method", "branch", "donated_at", "created_at"]
    list_filter = ["method"]
    raw_id_fields = ["donor", "branch", "received_by"]


@admin.register(EquipmentDonation)
class EquipmentDonationAdmin(admin.ModelAdmin):
    list_display = ["item_name", "donor", "estimated_value", "branch", "donated_at"]
    raw_id_fields = ["donor", "equipment", "branch", "received_by"]


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ["full_name", "phone", "skills", "branch", "is_active"]
    list_filter = ["is_active", "branch"]
    search_fields = ["full_name", "phone"]
    raw_id_fields = ["branch", "user"]
