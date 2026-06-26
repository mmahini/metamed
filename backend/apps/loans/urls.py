from rest_framework.routers import DefaultRouter
from .views import (
    EquipmentRequestViewSet, BorrowerViewSet,
    LoanViewSet, GuaranteeViewSet,
)

router = DefaultRouter()
router.register("requests", EquipmentRequestViewSet, basename="request")
router.register("borrowers", BorrowerViewSet, basename="borrower")
router.register("loans", LoanViewSet, basename="loan")
router.register("guarantees", GuaranteeViewSet, basename="guarantee")

urlpatterns = router.urls
