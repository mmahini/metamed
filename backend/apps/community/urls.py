from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DonorViewSet, CashDonationViewSet,
    EquipmentDonationViewSet, VolunteerViewSet, CommunityStatsView,
)

router = DefaultRouter()
router.register("donors", DonorViewSet, basename="donor")
router.register("cash-donations", CashDonationViewSet, basename="cash-donation")
router.register("equipment-donations", EquipmentDonationViewSet, basename="equipment-donation")
router.register("volunteers", VolunteerViewSet, basename="volunteer")

urlpatterns = [
    path("community-stats/", CommunityStatsView.as_view(), name="community-stats"),
    *router.urls,
]
