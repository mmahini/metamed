from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, EquipmentViewSet,
    EquipmentTransferViewSet, EquipmentInspectionViewSet,
    EquipmentStatsView,
)

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("equipment", EquipmentViewSet, basename="equipment")
router.register("transfers", EquipmentTransferViewSet, basename="transfer")
router.register("inspections", EquipmentInspectionViewSet, basename="inspection")

urlpatterns = [
    path("equipment-stats/", EquipmentStatsView.as_view(), name="equipment-stats"),
    *router.urls,
]
