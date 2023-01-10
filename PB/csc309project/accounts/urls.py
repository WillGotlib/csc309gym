from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegistrationView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("profile/", (views.ProfileView.as_view()), name="profile"),
    path("payments/history", views.UserPaymentsHistory.as_view(), name="payments_history"),
    path("payments/future", views.UserPaymentsFuture.as_view(), name="payments_future"),
    path("subscriptions/all/", views.SubscriptionsAll.as_view(), name="subsAll"),
    path("subscriptions/<int:sub_id>/", views.SubscriptionView.as_view(), name="subscriptionView"),
    path("subscriptions/<int:sub_id>/subscribe/", views.SubscriptionSubscribe.as_view(), name="subscribe"),
    path("subscriptions/unsubscribe/", views.SubscriptionUnsubscribe.as_view(), name="unsubscribe"),

]
