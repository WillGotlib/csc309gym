import re

from rest_framework import serializers

from accounts.models import TFCUser, Subscription, Payment


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Repeat Password'}
    )

    class Meta:
        model = TFCUser
        fields = ['username', 'email', 'password', 'password2']

    def save(self):
        user = TFCUser(username=self.validated_data['username'], email=self.validated_data['email'])
        password = self.validated_data['password']
        password2 = self.validated_data['password2']
        if password != password2:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'}
    )

    class Meta:
        model = TFCUser
        fields = ['username', 'password']


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TFCUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'phoneNumber', 'creditCardNumber', 'activeSubscription', 'avatar']
        extra_kwargs = {'activeSubscription': {'read_only': True}}

    def validate(self, data):
        if data.get('phoneNumber') and not re.search('^\d\d\d-\d\d\d-\d\d\d\d$', data.get('phoneNumber')):
            raise serializers.ValidationError({'phoneNumber': 'Phone number must have format ddd-ddd-dddd.'})
        return super().validate(data)


class TFCUserSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TFCUser
        fields = ['activateSubscription']


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'name', 'fee', 'pay_period']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'user', 'subscription', 'amount', 'creditCardNumber', 'datetime']
