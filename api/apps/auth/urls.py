from django.urls import path
from knox.views import LogoutAllView, LogoutView

from .views import SigninView, SignupView, VerifyEmailView, WhoAmIView

app_name = "studx_auth"

urlpatterns = [
    path("signup", SignupView.as_view(), name="signup"),
    path("signin", SigninView.as_view(), name="signin"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("logout-all", LogoutAllView.as_view(), name="logout_all"),
    path("verify-email", VerifyEmailView.as_view(), name="verify_email"),
    path("whoami", WhoAmIView.as_view(), name="whoami"),
]
