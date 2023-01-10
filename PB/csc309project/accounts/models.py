import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from django.contrib.auth.models import AbstractUser
from django.db import models

from django.utils import timezone


# Create your models here.

class Subscription(models.Model):
    class Meta:
        verbose_name = 'Subscription plan'
        unique_together = ('name', 'fee', 'pay_period')

    class PayPeriods(models.TextChoices):
        DAILY = 'DAY', _('Daily')
        WEEKLY = 'WEEK', _('Weekly')
        MONTHLY = 'MONTH', _('Monthly')
        ANNUALLY = 'YEAR', _('Annually')

    name = models.CharField(max_length=200)
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    pay_period = models.CharField(
        max_length=5,
        choices=PayPeriods.choices,
        default=PayPeriods.MONTHLY,
    )

    def __str__(self):
        return self.name + " : $" + str(self.fee) + "/" + self.pay_period


class TFCUser(AbstractUser):
    phoneNumber = models.CharField(max_length=12, null=True, blank=True)
    creditCardNumber = models.IntegerField(blank=True, null=True, verbose_name="Credit Card #")
    activeSubscription = models.ForeignKey(Subscription, models.SET_NULL, blank=True, null=True)
    avatar = models.ImageField(blank=True, null=True, upload_to='files/avatars')

    def __str__(self):
        return self.username + "/" + self.first_name + " " + self.last_name

    def clean(self):
        errors = {}
        if self.phoneNumber and not re.search('^\d\d\d-\d\d\d-\d\d\d\d$', self.phoneNumber):
            errors['phoneNumber'] = "phoneNumber must be of the format ddd-ddd-dddd."
        if errors:
            raise ValidationError(errors)


class Payment(models.Model):
    user = models.ForeignKey(TFCUser, on_delete=models.CASCADE)
    subscription = models.ForeignKey(Subscription, models.SET_NULL, blank=True, null=True)
    datetime = models.DateTimeField(default=timezone.now, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    creditCardNumber = models.IntegerField(blank=True, null=True, verbose_name="Credit Card #")

    def __str__(self):
        return str(self.user) + " paid $" + str(self.amount) + " at datetime " + str(self.datetime)
