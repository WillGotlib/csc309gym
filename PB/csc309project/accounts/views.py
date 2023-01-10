from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, ListAPIView, CreateAPIView, UpdateAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from studios.models import RecurringEnroll, IndividualEnroll, get_session_datetime
from .serializers import *

from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout
from django.shortcuts import get_object_or_404


class RegistrationView(CreateAPIView):
    serializer_class = RegistrationSerializer

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            auth_login(request, user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        if request.user.is_authenticated:
            return Response({'message': 'Already logged in. Please logout first.'},
                            status=status.HTTP_400_BAD_REQUEST)

        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)

        if user is None:
            return Response({'message': 'Incorrect username or password.'},
                            status=status.HTTP_400_BAD_REQUEST)

        auth_login(request, user)
        print("Successfully authenticated user login:", user)
        return Response({"Success": "User logged in.", "Username": user.username, "ID": user.id},
                        status=status.HTTP_200_OK)


class LogoutView(APIView):
    def get(self, request):
        message = "There is no user currently logged-in."
        if request.user.is_authenticated:
            auth_logout(request)
            print("Successfully logged out username:", request.user.username)
            message = "Log-out successful."
        return Response({'message': message}, status=status.HTTP_200_OK)


class ProfileView(RetrieveAPIView, UpdateAPIView):
    queryset = TFCUser.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully"} | serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Failed to update profile.", "details": serializer.errors} | serializer.data,
                            status=status.HTTP_400_BAD_REQUEST)


class StandardPagination(PageNumberPagination):
    page_size = 4
    page_size_query_param = 'page_size'  # TODO: allows front-end to override page_size (max 100 will show)
    max_page_size = 100


class UserPaymentsHistory(ListAPIView):
    serializer_class = PaymentSerializer
    pagination_class = StandardPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        payments = Payment.objects.filter(user=self.request.user.id)
        payments_dt = [(p.datetime, p) for p in payments]
        payments_dt_sorted = sorted(payments_dt, reverse=True)  # desc order, most recent first
        payments_sorted = [p_dt[1] for p_dt in payments_dt_sorted]
        return payments_sorted


class UserPaymentsFuture(ListAPIView):
    """Note that in this case we just send the user's subscription (only subscribed to one at a time) to the frontend.
    Then the frontend can implement an 'infinite pagination of future pay-dates' based on this subscription."""
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return [self.request.user.activeSubscription]


class SubscriptionsAll(ListAPIView):
    serializer_class = SubscriptionSerializer
    pagination_class = StandardPagination
    queryset = Subscription.objects.all()

class SubscriptionView(RetrieveAPIView):
    serializer_class = SubscriptionSerializer

    def get_object(self):
        return get_object_or_404(Subscription, id=self.kwargs['sub_id'])


class SubscriptionSubscribe(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, sub_id):
        if request.user.creditCardNumber is None:
            # The user has no registered credit card.
            return Response({"message": "User has no registered credit card. Please add one to the user's profile."},
                            status=status.HTTP_400_BAD_REQUEST)

        subscription = get_object_or_404(Subscription, id=sub_id)
        Payment.objects.create(
            user=request.user,
            amount=subscription.fee,
            subscription=subscription,
            creditCardNumber=request.user.creditCardNumber
        )

        request.user.activeSubscription = subscription
        request.user.save()

        return Response({'message': 'User successfully subscribed',
                         'Username': request.user.username, 'Subscribed to': subscription.name},
                        status=status.HTTP_200_OK)


class SubscriptionUnsubscribe(APIView):
    def get(self, request):
        activeID = request.user.activeSubscription
        if activeID is not None:
            request.user.activeSubscription = None
            request.user.save()

            # Drop all future sessions for this user:
            # First, add end_datetime to any active RecurringEnrolls
            for enrol in RecurringEnroll.objects.filter(user=request.user, end_datetime=None):
                enrol.end_datetime = timezone.now()
                enrol.save()
            # Then, delete any future IndividualEnrolls
            for enrol in IndividualEnroll.objects.filter(user=request.user):
                session_datetime = get_session_datetime(enrol.class_time, enrol.session_num)
                if session_datetime > timezone.now():
                    enrol.delete()

            return Response({'message': f"Unsubscribed from subscription {activeID.name} with ID {activeID},"
                                        f"and removed from all future class sessions (if any)."},
                            status=status.HTTP_200_OK)
        return Response({'message': "User was not subscribed to anything."}, status=status.HTTP_200_OK)
