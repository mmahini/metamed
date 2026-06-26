from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "metamed-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/", include("apps.accounts.urls")),
    path("api/org/", include("apps.organization.urls")),
    path("api/", include("apps.equipment.urls")),
    path("api/", include("apps.patients.urls")),
    path("api/", include("apps.loans.urls")),
]
