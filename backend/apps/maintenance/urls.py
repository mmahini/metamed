from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import DamageReportViewSet, MaintenanceViewSet, MaintenanceStatsView

router = DefaultRouter()
router.register("damage-reports", DamageReportViewSet, basename="damage-report")
router.register("maintenances", MaintenanceViewSet, basename="maintenance")

urlpatterns = [
    path("maintenance-stats/", MaintenanceStatsView.as_view(), name="maintenance-stats"),
    *router.urls,
]
