from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, EquipmentViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("equipment", EquipmentViewSet, basename="equipment")

urlpatterns = router.urls
