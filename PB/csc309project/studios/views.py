import datetime
import decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from geopy.distance import geodesic
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from studios.models import Amenity, SpecificSessionCancellation, \
    get_session_datetime
from studios.models import Studio, Class, ClassTime, IndividualEnroll, \
    RecurringEnroll, \
    RecurringEnrollSpecificSessionDrop
from studios.serializers import StudioSerializer, ClassSerializer, \
    IndividualEnrollSerializer, \
    RecurringEnrollSerializer, UserClassesSerializer


class StandardPagination(PageNumberPagination):
    page_size = 5
    # Allows front-end to override page_size (but MAX will always be max_page_size)
    page_size_query_param = 'page_size'
    max_page_size = 100


class StudiosView(ListAPIView):
    serializer_class = StudioSerializer
    pagination_class = StandardPagination

    def check_filter_param(self, s: str):
        try:
            filter_ = self.request.query_params.get(s)
            if filter_ is not None:
                assert type(filter_) == str
        except:
            return Response({
                'message': f'if filter \'{s}\' is passed in query params, it must be a string'},
                status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):
        """
        Required GET parameters:
            lat
            lng
        """
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        lat_err_msg = 'lat is a required parameter and must be float between -90 and 90 (inclusive).'
        lng_err_msg = 'lng is a required parameter and must be float between -180 and 180 (inclusive).'

        try:
            user_lat = decimal.Decimal(self.request.GET['lat'])
            assert -90 <= user_lat <= 90
        except:
            return Response({'message': lat_err_msg},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            user_lng = decimal.Decimal(self.request.GET['lng'])
            assert -180 <= user_lng <= 180
        except:
            return Response({'message': lng_err_msg},
                            status=status.HTTP_400_BAD_REQUEST)

        self.check_filter_param('name')
        self.check_filter_param('coach')
        self.check_filter_param(
            'amenities')  # Should be formatted "amenity1, amenity2, ..."
        self.check_filter_param('class_names')

        return super().get(request, args, kwargs)

    def get_queryset(self):
        """Return filtered queryset ordered by distance to studio (lat, lng).

        Optional query params:
            name (str)
            coach (str)
            amenities (str): comma-separated list
        TODO: check the filtering works
        """
        user_lat = decimal.Decimal(self.request.GET['lat'])
        user_lng = decimal.Decimal(self.request.GET['lng'])

        # Initial qset, gets updated every time filtering happens
        qset = Studio.objects.all()

        # Filter by name
        filter_name = self.request.query_params.get('name')
        if filter_name is not None:
            qset = qset.filter(name__contains=filter_name)

        # Filter by amenities
        filter_amenities = self.request.query_params.get('amenities')
        if filter_amenities is not None:
            # Filter qset by list of keywords in filter_amenities (list of strings).
            # That is, only include studios that have any of these amenities.
            qset2 = Studio.objects.none()
            for amenity_raw in filter_amenities.split(','):
                amenity = amenity_raw.strip()

                if amenity != '':
                    curr_amenities = Amenity.objects.filter(type__contains=amenity)
                    for filtered_amenity in curr_amenities:
                        # Add studio to qset2 (this studio has the amenity)
                        qset2 |= Studio.objects.filter(id=filtered_amenity.studio.id)

            # Intersect with qset
            qset = qset & qset2

        # Filter by class names (same as above)
        filter_classes = self.request.query_params.get('class_names')
        if filter_classes is not None:
            qset2 = Studio.objects.none()
            for class_name_raw in filter_classes.split(','):
                class_name = class_name_raw.strip()
                if class_name != '':
                    curr_class = Class.objects.filter(name__contains=class_name)
                    for filtered_class in curr_class:
                        qset2 |= Studio.objects.filter(id=filtered_class.studio.id)
                        filtered_class.studio
            qset = qset & qset2

        # Filter by coach
        filter_coach = self.request.query_params.get('coach')
        if filter_coach is not None:
            qset2 = Studio.objects.none()
            curr_class = Class.objects.filter(coach__contains=filter_coach)
            for filtered_class in curr_class:
                qset2 |= Studio.objects.filter(id=filtered_class.studio.id)
            qset = qset & qset2

        # Order by distance to user
        user_coords = (user_lat, user_lng)
        lst_dist = []
        for studio in qset:
            studio_coords = (studio.lat, studio.lng)
            distance = geodesic(user_coords, studio_coords).km
            lst_dist.append((distance, studio))
        lst_dist_sorted = sorted(
            lst_dist)  # asc order by distance (first tuple element)
        studios_by_dist = [tup[1] for tup in lst_dist_sorted]

        return studios_by_dist


class StudioView(RetrieveAPIView):
    serializer_class = StudioSerializer

    def get(self, request, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        return super().get(request, args, kwargs)

    def get_object(self):
        # Q: Can we override and return Response(dict) to give extra info? A: Just put in serializer.
        return get_object_or_404(Studio, id=self.kwargs['studio_id'])


class ClassScheduleView(ListAPIView):
    """Note that we do not add ordering -> frontend issue. Plus we literally cannot since we don't
    store or send session specific info. We send the general pattern + exceptions.
    """
    serializer_class = ClassSerializer

    def get(self, request, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        return super().get(request, args, kwargs)

    def get_queryset(self):
        studio_id = self.kwargs['studio_id']
        studio = get_object_or_404(Studio, id=studio_id)
        queryset = Class.objects.filter(studio=studio)
        return queryset


class UserClassScheduleView(ListAPIView):
    """
    Returns a list of all the classes/class-times/sessions that the currently logged-in user is enrolled in.
    The indefinitely repeating session structure makes this a bit confusing, with a few design decisions that need
        to be specified here.

    This view will return a nested structure.
        - The top level is the CLASSES that this user is somehow enrolled in.
        - Each class contains its own information and a list of all its CLASS TIMES.
        - Each of these class times have fields showing a user's enrollement status in that class time.
            For example, a class could run on Mondays 4-5 and Thursdays 11-12.
        - A user can have a registered RECURRING ENROLLMENT in a class time, meaning they're enrolled to attend every week.
            - A user can drop specific sessions from this recurring enrollment.
                These are listed too in the recurring_enrolls -> individual_drops field.
        - A user can also have INDIVIDUAL ENROLLMENTS, that is, be enrolled in specific sessions rather than all future ones.
            These are listed in the individual_enrolls field.
        - A classtime with nothing in either the recurring_enrolls or individual_enrolls fields is one this user isn't involved in.
    """
    serializer_class = UserClassesSerializer

    def get(self, request, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        return super().get(request, args, kwargs)

    def get_queryset(self):
        # user_id = self.kwargs['user_id']
        queryset = Class.objects.none()
        # Have to check RECURRING AND INDIVIDUAL enrolls, and also include DROPS.
        # For now just going to add every class that the user has some enrollment in.
        # print(RecurringEnroll.objects.filter(user=self.request.user))
        for recur_enroll in RecurringEnroll.objects.filter(user=self.request.user):
            class_id = recur_enroll.class_time.class_id.id
            # print(class_id)
            # print(recur_enroll.class_time.class_id.id)
            curr_class = Class.objects.filter(id=class_id)
            queryset = queryset | curr_class
        for indiv_enroll in IndividualEnroll.objects.filter(user=self.request.user):
            class_id = indiv_enroll.class_time.class_id.id
            curr_class = Class.objects.filter(id=class_id)
            queryset = queryset | curr_class
        return queryset


class ClassEnrollView(APIView):
    def post(self, request, class_time_id: int):
        """
        URL parameters:
            class_time_id: int

        Query data:
            session_num: Optional[int]

        If session_num is passed and user has dropped that session, it tries to delete that drop (re-enroll the user).
        Should fail if session is at capacity (TODO: test).

        SOLVED PROBLEMS:
            - User can enrol in same specific session twice (IndividualEnroll).
            - User can enrol in recurring multiple times (does not check for an active recurring).
            - User can enrol recurring when already has individual (TODO: test)
                Fixed by deleting individuals
            - Enrolling in cancelled class, ensure cannot undrop if cancelled (TODO: test)
            - User can enrol individual when already has ACTIVE recurring (TODO: test)
        """
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'}, status=status.HTTP_401_UNAUTHORIZED)
        if self.request.user.activeSubscription is None:
            return Response(
                {'message': 'User does not have an active subscription.'}, status=status.HTTP_403_FORBIDDEN)

        # Get session_num for request data is included, set None if not included
        session_num = self.request.data.get('session_num', '')
        session_num = None if session_num == '' else session_num

        # Get objects and info from DB
        class_time = get_object_or_404(ClassTime, id=class_time_id)
        capacity = get_object_or_404(Class, id=class_time.class_id.id).capacity

        if session_num is not None:  # user is trying to make an individual enroll
            if get_session_datetime(class_time, session_num) <= timezone.now():
                return Response({'message': 'Cannot enrol in a past session.'},
                                status=status.HTTP_400_BAD_REQUEST)

            # Don't enroll if cancelled.
            cancelled = SpecificSessionCancellation.objects.filter(
                class_time=class_time, session_num=session_num)
            if cancelled:
                return Response(
                    {'message': 'Unable to enroll, this session is cancelled.'},
                    status=status.HTTP_200_OK)

            # If have a drop on this session, check if remove if possible (TODO: check will not delete if full)
            for recurring_enroll in RecurringEnroll.objects.filter(class_time=class_time, user=self.request.user):
                try:
                    drop = RecurringEnrollSpecificSessionDrop.objects.get(recurring_enroll=recurring_enroll,
                                                                          session_num=session_num)
                    drop.delete()
                    return Response({
                        'message': 'Re-enrolled in this session (was dropped and had space).'},
                        status=status.HTTP_200_OK)
                except RecurringEnrollSpecificSessionDrop.DoesNotExist:
                    pass

            if RecurringEnroll.objects.filter(class_time=class_time_id, end_datetime=None):
                return Response({
                    'message': 'Cannot enrol in a session, already enrolled in all future sessions.'},
                    status=status.HTTP_400_BAD_REQUEST)

            # Create IndividualEnroll for session if not at capacity
            num_enrolled = class_time.num_enrolled(session_num)
            if capacity is None or num_enrolled < capacity:  # capacity can be None (no limit)
                try:
                    individual_enroll_obj = IndividualEnroll.objects.create(
                        class_time=class_time,
                        user=self.request.user,
                        session_num=session_num
                    )
                except IntegrityError:  # uniqueness
                    return Response({'message': 'User has already enrolled in this session.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                except ValidationError as ex:
                    return Response({'message': ex.args[0]},
                                    status=status.HTTP_400_BAD_REQUEST)

                serializer = IndividualEnrollSerializer(individual_enroll_obj)
                return Response({'message': 'Successfully created IndividualEnroll for this session.'}
                                | serializer.data,
                                status=status.HTTP_201_CREATED)
            # elif num_enrolled > capacity:
            #     raise Exception('num_enrolled > capacity, something is wrong')
            else:
                return Response({'message': f'Unable to enrol, session_num {session_num} '
                                f'for class_time_id {class_time_id} if full.'},
                    status=status.HTTP_200_OK)  # TODO: good status?
        else:  # user is trying to make a recurring enroll
            # First, get number of recurring enrollments that are active for this session
            # (end_datetime is None or after timezone.now())
            recurring_enrolls = [
                enroll for enroll in RecurringEnroll.objects.filter(class_time=class_time)
                if (enroll.end_datetime is None or timezone.now() <= enroll.end_datetime)
            ]
            num_recurring = len(recurring_enrolls)

            if capacity is None or num_recurring < capacity:
                # In this case, there is space for a recurring enrollment, so create a RecurringEnroll.

                try:
                    recurring_enroll_obj = RecurringEnroll.objects.create(
                        class_time=class_time,
                        user=self.request.user
                    )
                except IntegrityError as ex:
                    return Response({'message': ex.args[0]},
                                    status=status.HTTP_400_BAD_REQUEST)  # TODO: 400?

                # For future cancelled sessions, add a drop
                cancellations = SpecificSessionCancellation.objects.filter(class_time=class_time)
                for c in cancellations:
                    if get_session_datetime(c.class_time, c.session_num) > timezone.now():
                        # Is a future cancellation for this class_time
                        RecurringEnrollSpecificSessionDrop.objects.create(
                            recurring_enroll=recurring_enroll_obj,
                            session_num=c.session_num
                        )

                # If capacity is None, there is no limit so no we are done.
                # However, if capacity is not None, we need to look through the future IndividualEnroll for
                # this class_time to make and add RecurringEnrollSpecificSessionDrop objects when a
                # SPECIFIC session is already at capacity
                if capacity is not None:
                    # There is a capacity, so for every future date that has an IndividualEnroll, check if
                    # we are at capacity and add a drop if necessary (if recurring_enroll_obj took use over).

                    # Get the session_nums of future individual_enrolls for this class_time.
                    individual_enrolls = IndividualEnroll.objects.filter(
                        class_time=class_time)
                    future_individual_enrolls_session_nums = [
                        individual_enroll.session_num
                        for individual_enroll in individual_enrolls
                        if individual_enroll.get_session_datetime() > timezone.now()
                    ]

                    for future_session_num in future_individual_enrolls_session_nums:
                        num_enrolled = class_time.num_enrolled(future_session_num)
                        if num_enrolled == capacity:
                            # assert num_enrolled == capacity + 1  # since we already created recurring_enroll_obj

                            # Drop this class from the recurring enroll since its already at capacity
                            RecurringEnrollSpecificSessionDrop.objects.create(
                                recurring_enroll=recurring_enroll_obj,
                                session_num=future_session_num
                            )

                            # assert num_enrolled == capacity  # since we just dropped this session
                        # elif num_enrolled > capacity:
                        # raise Exception('num_enrolled > capacity, something is wrong')

                serializer = RecurringEnrollSerializer(recurring_enroll_obj)
                return Response({'message': 'Successfully created RecurringEnroll '
                                            '(created RecurringEnrollSpecificSessionDrops if necessary).'}
                                | serializer.data,
                                status=status.HTTP_201_CREATED
                                )
            elif num_recurring == capacity:
                # Unlike previous, nothing happens by default since we only add IndividualEnroll there is space.

                # Get the session_nums of future specific_session_drops for this class_time (where we *might have space)
                # Do class_time filtering in comprehension since doesn't work in objects.filter (too deep)
                specific_session_drops = RecurringEnrollSpecificSessionDrop.objects.all()
                future_specific_session_drops_session_nums = [
                    specific_session_drop.session_num
                    for specific_session_drop in specific_session_drops
                    if specific_session_drop.get_session_datetime() > timezone.now() and
                       specific_session_drop.recurring_enroll.class_time == class_time
                    # filter by this class_time
                ]

                created_individual = False
                for future_session_num in future_specific_session_drops_session_nums:
                    num_enrolled = class_time.num_enrolled(future_session_num)
                    if num_enrolled < capacity:
                        # There is space in this session so create an IndividualEnroll here
                        individual_enroll_obj = IndividualEnroll.objects.create(
                            class_time=class_time,
                            user=self.request.user,
                            session_num=future_session_num
                        )
                        created_individual = True
                    # elif num_enrolled > capacity:
                    #     raise Exception('num_enrolled > capacity, something is wrong')

                if created_individual:
                    serializer = IndividualEnrollSerializer(
                        individual_enroll_obj)
                    return Response({'message': 'Successfully created IndividualEnroll\'s for available sessions.'}
                                    | serializer.data,
                                    status=status.HTTP_201_CREATED)
                else:
                    return Response({'message': 'Unable to enrol, there was no space for a '
                                                f'recurring or individual enrollment in class_time {class_time}.'},
                                    status=status.HTTP_200_OK)  # TODO: good status?
            # else:
            #     raise Exception('num_recurring > capacity, something is wrong')


class ClassDropView(APIView):
    def post(self, request, class_time_id: int):
        """
        URL parameters:
            class_time_id: int

        Query data:
            session_num: Optional[int]

        If session_num is passed, the user wants to drop that specific session.
        If session_num is not passed (or None), the user wants to drop all future sessions.

        Cases:
            Drop specific session:
                Session could be
                    1) IndividualEnroll: just delete it
                    2) RecurringEnroll: add a RecurringEnrollSpecificSessionDrop (if not already exists)
            Drop all future sessions:
                User could
                    1) Have a RecurringEnroll AND/OR some IndividualEnrolls
                        Just loop through and
                        Add end_datetime to RecurringEnroll and Delete FUTURE IndividualEnrolls
                            Also, when we add end_datetime to RecurringEnroll, delete future
                                RecurringEnroll drops (done in save() method). TODO: change to clean?
        TODO: Test
        """
        if not self.request.user.is_authenticated:
            return Response({'message': 'User is not logged in.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        if self.request.user.activeSubscription is None:
            return Response(
                {'message': 'User does not have an active subscription.'},
                status=status.HTTP_403_FORBIDDEN)

        # Get session_num for request data is included, set None if not included
        session_num = self.request.data.get('session_num', '')
        session_num = None if session_num == '' else session_num

        # Get objects and info from DB
        class_time = get_object_or_404(ClassTime, id=class_time_id)

        # Note: There shouldn't be IndividualEnroll AND RecurringEnroll
        # for specific sessions, but check and drop just in case

        if session_num is not None:
            if get_session_datetime(class_time, session_num) <= timezone.now():
                return Response({'message': 'Cannot drop a past session.'},
                                status=status.HTTP_400_BAD_REQUEST)

            ## Drop a specific session ##

            # First, delete any IndividualEnroll at that session
            individual_enrolls = IndividualEnroll.objects.filter(
                class_time=class_time, session_num=session_num)
            for individual_enroll in individual_enrolls:
                individual_enroll.delete()

            # Then, add drops to any RecurringEnrolls that are still active (no end_datetime, so encompass this
            # future session).
            recurring_enrolls = RecurringEnroll.objects.filter(class_time=class_time, end_datetime=None)
            for recurring_enroll in recurring_enrolls:
                # Check if this recurring_enroll already has a drop at this session_num (TODO: remove and catch integrity?)
                # recurring_enroll_drop = RecurringEnrollSpecificSessionDrop(recurring_enroll=recurring_enroll,
                #                                                            session_num=session_num)
                # if not recurring_enroll_drop:
                try:
                    RecurringEnrollSpecificSessionDrop.objects.create(
                        recurring_enroll=recurring_enroll,
                        session_num=session_num
                    )
                except ValidationError as ex:  # TODO: ok?
                    return Response({'message': ex.args[0]}, status=status.HTTP_400_BAD_REQUEST)
                except IntegrityError as ex:  # TODO: ok? status?
                    return Response({'message': 'User has already dropped that session.'},
                                    status=status.HTTP_200_OK)

            return Response({
                'message': f'Successfully dropped session_num {session_num} for class_time {class_time}.'},
                status=status.HTTP_200_OK)
        else:
            # First, delete any IndividualEnroll for the entire class (ANY session_num)
            individual_enrolls = IndividualEnroll.objects.filter(class_time=class_time)
            for individual_enroll in individual_enrolls:
                individual_enroll.delete()

            # Then, add end_datetime for any ACTIVE RecurringEnrolls for the entire class
            recurring_enrolls = RecurringEnroll.objects.filter(class_time=class_time, end_datetime=None,
                                                               user=self.request.user)
            # if len(recurring_enrolls) > 1:
            #     raise ValidationError('There should not be multiple ACTIVE recurring_enrolls for 1 class_time.')
            # else:
            for recurring_enroll in recurring_enrolls:
                print('Adding end_datetime to recurring_enroll: ', recurring_enroll)
                recurring_enroll.end_datetime = timezone.now()
                recurring_enroll.save()

            return Response({'message': f'Successfully dropped all future sessions for class_time {class_time}.'},
                            status=status.HTTP_200_OK)


class NumEnrolledView(APIView):
    """Get number of enrolled users in a session """

    def get(self, request, class_time_id: int, session_num: int):
        class_time = get_object_or_404(ClassTime, id=class_time_id)
        num_enrolled = class_time.num_enrolled(session_num)
        return Response({'num_enrolled': num_enrolled})


class StudioIdsView(APIView):
    """Get a list of all the studio ids."""

    def get(self, request):
        studio_ids = [studio.id for studio in Studio.objects.all()]
        return Response(studio_ids)
