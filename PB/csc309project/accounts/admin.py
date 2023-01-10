from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import TFCUser, Subscription, Payment


@admin.register(TFCUser)
class TFCUserAdmin(UserAdmin):
    list_display = ['username', 'id', 'email', 'first_name', 'last_name', 'is_staff']
    model = TFCUser
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('creditCardNumber', 'phoneNumber', 'avatar', 'activeSubscription')}),
    )


class TFCUserInline(admin.TabularInline):
    model = TFCUser
    fields = ['username']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    inlines = [TFCUserInline]


admin.site.register(Payment)
