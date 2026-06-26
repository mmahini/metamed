from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, BranchViewSet, UnitViewSet

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("branches", BranchViewSet, basename="branch")
router.register("units", UnitViewSet, basename="unit")

urlpatterns = router.urls
