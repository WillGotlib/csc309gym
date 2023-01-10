from django.contrib import admin

from studios.models import Studio, Class, StudioImage, Amenity, ClassTime, SpecificSessionCancellation, \
    IndividualEnroll, RecurringEnrollSpecificSessionDrop, RecurringEnroll


# Reference:
# class StudioInline(admin.TabularInline):
#     model = Studio
#     fields = ['name', 'price']
#
#
# class StoreAdmin(admin.ModelAdmin):
#     readonly_fields = ['id', 'url']
#     fields = ['id', 'name', 'url']
#     list_display = ['id', 'name', 'url']
#     inlines = [ProductInline]

### STUDIOS ###

class AmenityInline(admin.TabularInline):
    model = Amenity
    fields = ['type', 'quantity']


class StudioImageInline(admin.TabularInline):
    model = StudioImage


class ClassInline(admin.TabularInline):
    model = Class
    # fields = ['name', 'coach', 'keywords', 'capacity']


@admin.register(Studio)
class StudioAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'lat', 'lng', 'coaches_str', 'image_filenames', 'amenities_str']
    inlines = [ClassInline, AmenityInline, StudioImageInline]


@admin.register(StudioImage)
class StudioImageAdmin(admin.ModelAdmin):
    list_display = ['image', 'id', 'studio']


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['studio_type_pair', 'id', 'quantity']


### CLASSES ###

class ClassTimeInline(admin.TabularInline):
    model = ClassTime
    fields = ['day', 'time', 'duration', 'start_date']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'studio', 'capacity']
    inlines = [ClassTimeInline]


class SpecificSessionCancellationInline(admin.TabularInline):
    model = SpecificSessionCancellation
    fields = ['session_num']


@admin.register(ClassTime)
class ClassTimeAdmin(admin.ModelAdmin):
    list_display = ['class_id', 'id', 'day', 'time', 'duration', 'start_date']
    inlines = [SpecificSessionCancellationInline]


@admin.register(RecurringEnroll)
class RecurringEnrollAdmin(admin.ModelAdmin):
    list_display = ['id', 'class_time', 'user', 'start_datetime', 'end_datetime']


@admin.register(RecurringEnrollSpecificSessionDrop)
class RecurringEnrollSpecificSessionDropAdmin(admin.ModelAdmin):
    list_display = ['id', 'recurring_enroll', 'session_num']


@admin.register(IndividualEnroll)
class IndividualEnrollAdmin(admin.ModelAdmin):
    list_display = ['id', 'class_time', 'user', 'session_num']


@admin.register(SpecificSessionCancellation)
class SpecificSessionCancellationAdmin(admin.ModelAdmin):
    list_display = ['class_time', 'session_num', 'id', 'studio_id', 'class_id']
