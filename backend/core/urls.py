from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


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
    path("api/", include("apps.maintenance.urls")),
    path("api/", include("apps.community.urls")),
    path("api/", include("apps.dashboard.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.search.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
