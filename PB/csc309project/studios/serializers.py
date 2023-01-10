from rest_framework import serializers
from colorama import Fore, Back, Style

from studios.models import Studio, Class, ClassTime, Amenity, IndividualEnroll, RecurringEnrollSpecificSessionDrop, \
    RecurringEnroll, StudioImage, SpecificSessionCancellation


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['type', 'quantity']


class StudioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioImage
        fields = ['path']  # TODO: sends global path, bad for security


class StudioSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True)
    images = StudioImageSerializer(many=True)

    class Meta:
        model = Studio
        fields = ['id', 'name', 'lng', 'lat', 'address', 'postal_code', 'phone', 'amenities', 'images', 'coaches']

class BriefStudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = fields = ['id', 'name', 'lng', 'lat']


class IndividualEnrollSerializer(serializers.ModelSerializer):
    session_datetime = serializers.SerializerMethodField('session_datetime_method')

    class Meta:
        model = IndividualEnroll
        fields = ['user', 'class_time', 'session_num', 'session_datetime']

    def session_datetime_method(self, obj: IndividualEnroll):
        return obj.get_session_datetime()


class RecurringEnrollSpecificSessionDropSerializer(serializers.ModelSerializer):
    datetime = serializers.SerializerMethodField('drop_date')

    class Meta:
        model = RecurringEnrollSpecificSessionDrop
        fields = ['recurring_enroll', 'session_num', 'datetime']

    def drop_date(self, obj):
        return obj.get_session_datetime()


class RecurringEnrollSerializer(serializers.ModelSerializer):
    recurring_enroll_specific_session_drops = RecurringEnrollSpecificSessionDropSerializer(many=True)

    class Meta:
        model = RecurringEnroll
        fields = ['user', 'class_time', 'start_datetime', 'end_datetime', 'recurring_enroll_specific_session_drops']


class SpecificSessionCancellationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpecificSessionCancellation
        fields = ['session_num']


class ClassTimeSerializer(serializers.ModelSerializer):
    recurring_enrolls = RecurringEnrollSerializer(many=True)
    individual_enrolls = IndividualEnrollSerializer(many=True)
    specific_session_cancellations = SpecificSessionCancellationSerializer(many=True)

    class Meta:
        model = ClassTime
        fields = ['id', 'class_id', 'day', 'time', 'duration',
                  'start_date', 'recurring_enrolls',
                  'individual_enrolls', 'specific_session_cancellations']

class UserClassTimesSerializer(serializers.ModelSerializer):
    recurring_enrolls = serializers.SerializerMethodField('user_rec_method')
    individual_enrolls = serializers.SerializerMethodField('user_indiv_method')
    specific_session_cancellations = SpecificSessionCancellationSerializer(many=True)

    class Meta:
        model = ClassTime
        fields = ['id', 'class_id', 'day', 'time', 'duration',
                  'start_date', 'recurring_enrolls', 'individual_enrolls',
                  'specific_session_cancellations']

    """ Given a ClassTime, finds the recurring enrollment information (if it exists) of this user to it. """

    def user_rec_method(self, obj):
        request = self.context.get('request', None)
        if request:
            print(Fore.RED + 'User: ' + str(request.user) + Style.RESET_ALL)
            new_data = obj.user_recurring_enrolls(request.user)
            ser = UserRecurringEnrollSerializer(many=True, data=new_data, context=self.context)
            ser.is_valid()
            return ser.data

    """ Given a ClassTime, finds the individual-session enrollment objects (if they exists) of this user to it. """

    def user_indiv_method(self, obj):
        request = self.context.get('request', None)
        if request:
            print(Fore.RED + 'User: ' + str(request.user) + Style.RESET_ALL)
            new_data = obj.user_individual_enrolls(request.user)
            ser = IndividualEnrollSerializer(many=True, data=new_data, context=self.context)
            ser.is_valid()
            return ser.data


class ClassSerializer(serializers.ModelSerializer):
    studio = BriefStudioSerializer()
    class_times = UserClassTimesSerializer(many=True)  # Get all class_times, only include enroll info for current user

    # Use below if you want to get include enroll info for all users, not just logged in user
    # class_times = ClassTimeSerializer(many=True)

    class Meta:
        model = Class
        fields = ['id', 'studio', 'name', 'description', 'coach', 'keywords', 'capacity', 'class_times']


### USER SCHEDULE ###


class UserRecurringEnrollSerializer(serializers.ModelSerializer):
    recurring_enroll_specific_session_drops = \
        serializers.SerializerMethodField('user_recurring_enroll_specific_session_drops_method')

    class Meta:
        model = RecurringEnroll
        fields = ['user', 'class_time', 'start_datetime', 'end_datetime', 'recurring_enroll_specific_session_drops']

    def user_recurring_enroll_specific_session_drops_method(self, obj: RecurringEnroll):
        request = self.context.get('request', None)
        if request:
            new_data = obj.get_recurring_enroll_specific_session_drops()
            ser = RecurringEnrollSpecificSessionDropSerializer(many=True, data=new_data)
            ser.is_valid()
            return ser.data


class UserClassesSerializer(serializers.ModelSerializer):
    studio = BriefStudioSerializer()
    class_times = serializers.SerializerMethodField('get_user_class_times')

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'coach', 'studio', 'capacity', 'class_times']

    def get_user_class_times(self, obj):
        """ Have to do this in order to pass CONTEXT down the chain, which contains user information. """
        ser = UserClassTimesSerializer(many=True, data=ClassTime.objects.filter(class_id=obj.id), context=self.context)
        ser.is_valid()
        return ser.data
