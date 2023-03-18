from apps.studx.views.notifications import NotificationsViewSet
from django.urls import include, path
from rest_framework_nested import routers

from .views.events import EventsViewSet
from .views.organization import OrganizationViewSet

app_name = "studx"

router = routers.SimpleRouter()

router.register(r"orgs", OrganizationViewSet, basename="orgs")
router.register(r"notifications", NotificationsViewSet, basename="notifications")

events_router = routers.NestedSimpleRouter(router, r"orgs", lookup="org")
events_router.register(r"events", EventsViewSet, basename="events")

urlpatterns = [
    path(r"", include(router.urls)),
    path(r"", include(events_router.urls)),
]
