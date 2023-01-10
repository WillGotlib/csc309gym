"""
Limitations:
- Cant change info for 1 session
# TODO: note limitation of waiting list

Features:
- Multiple class times
- Infinite
- Crazy enrol

Notes:
    - We do not check that addresses and postal codes arriving from frontend are real. We do not validate since we
        do not have to (only geo coords are used in computations).

Explanation of classes:
Each class has a Class model with the general information about it.
Each class has a set of ClassTime models (they pt to Class) with the day of the week + time of day + duration + start_date.

Definition:
    - All classes are recurring, its the enroll vs drop which can be Recurring vs Individual,
        so create ClassTime in either case

Recurring Enrolls:
    - Enrol all future instances: create a RecurringEnroll object
    - Drop all future instances: add drop_date_time (current DateTime) to RecurringEnroll object
        (not just delete RecurringEnrol since we need to remember a user's class history)

    ONLY FOR FUTURE INSTANCES (need to remember history):
        - Drop individual instance: Each RecurringEnroll should have a 'set of individual drops'
            so create a RecurringIndividualDrop object pointing to RecurringEnroll
        - Re-enroll in dropped individual instance: Delete RecurringIndividualDrop

Individual Enrolls:
    IMPORTANT: these only make sense if
        1) user does not have an ACTIVE (drop_date_time is None) RecurringEnroll for this class time
        2) the class instance if in the FUTURE - cannot enroll in past classes and
            cannot drop past classes (for history)
    - Enrol individual instance: create IndividualEnroll object
    - Drop individual instance: delete IndividualEnroll object

TODO: can we drop all future instances of individual enrollment?
- Can still do with this DB, just need to amend drop method

Enrol endpoint:
- Either all future (recurring) or specific (either re-enroll in dropped recurring or just 1 instance with no recurring)
Drop endpoint:
- Either all future (recurring) or all future (individual) or individual (from recurring) or individual (not recurring)

Capacity checks:
    - IndividualEnroll
        - check num_enrolled(num_session)
        - check not in SpecificSessionCancelled
    - Recurring
        LOOP until no FUTURE exceptions:
            Either:
                XXX a) ex lets you enrol
                    IndividualEnroll objects at Sessions that are available
                    TODO: not allowed, spot is reserved
                b) ex doesnt let you enrol
                    RecurringEnroll object with SpecificSessionDrops
                    TODO: not allowed
        UPDATE:
            Case 1: num recurring < capacity
                Just add recurring (doesnt matter if overflows cause of a IndividualEnroll)
                Reason for not doing a drop:
                    TODO: then they could undrop, could be handeled by only allowing undrop if theres capacity, but complex (maybe later)
            Case 2: num recurring == capacity
                NOPE


            Individual and at capacity: no
            Recurring and num recurring = capacity (even if someone dropped this one): no

            Capacity 1:
                1 person enrolls in next 100
                Recurring user should be able to enroll

            FINAL FINAL FINAL:
                To enroll recurring, we only look at recurring
                    WHY?
                        Cause if we looked DID not include specific sessions that are full and added a SpecificSessionDrop
                        the user could just 'un-drop' (re-enrol). If we have time, we could allow functionality that says:
                            you cannot re-enrol since its at capacity, in which case it would make sense to include the drops at enrol time
                            (loop until no future exceptions)
                    SO:
                        for now, no loop until no future exceptions
                To enroll individual, we look at everything

    # General pattern:
    RecurringEnroll
    # Exceptions:
    RecurringEnrollSpecificSessionDrop
    SpecificSessionCancelled


Schedule for Studio:
    1) Class times for that

TODO Questions:
    - What does max_length=None mean? Should we use TextField in certain cases? Like TextField
    - Ok DecimalField?
    - Null vs Blank? Which should be required?

TODO:
    - Don't allow signups on cancelled (admin panel too?)
    - Auto create Session (if not exist) and Session signup (if not full) on enrol


Notes:
    super().clean() in model.Models is just a 'pass' method, so no need to call.
    TODO: Cancellation enrol? enrol on cancelled should still work?

TODO:
    Remove exceptions and be lenient?
"""
import calendar
import datetime
import os
import re

from django.core.exceptions import ValidationError
from django.db import models, IntegrityError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from accounts.models import TFCUser
import pytz


class Studio(models.Model):
    # Required
    name = models.CharField(max_length=200)
    lat = models.DecimalField(verbose_name='Latitude', max_digits=9, decimal_places=6)
    lng = models.DecimalField(verbose_name='Longitude', max_digits=9, decimal_places=6)
    # Optional
    address = models.CharField(max_length=200, default="Default Address")
    postal_code = models.CharField(max_length=50, default="Default Postal Code")
    phone = models.CharField(max_length=12, default="111-111-1111")

    def __str__(self):
        return self.name

    def clean(self):
        # TODO: how do something like which checks for required first? (without needing if self.lat)
        errors = {}

        if self.lat and not -90 <= self.lat <= 90:
            errors['lat'] = f"Latitude must be between -90 and 90."

        if self.lng and not -180 <= self.lng <= 180:
            errors['lng'] = f"Longitude must be between -180 and 180."

        if self.phone and not re.search('^\d\d\d-\d\d\d-\d\d\d\d$', self.phone):
            errors['phone'] = "Phone must be of the format ddd-ddd-dddd."

        if errors:
            raise ValidationError(errors)

    ## Custom Admin Panel Columns ##

    def amenities(self):
        return Amenity.objects.filter(studio=self.id)
    
    def coaches(self):
        coaches = set()
        for cls in Class.objects.filter(studio=self.id):
            coaches.add(cls.coach)
        return list(coaches)

    def images(self):
        return StudioImage.objects.filter(studio=self.id)

    def image_filenames(self):
        studio_images = StudioImage.objects.filter(studio=self.id)
        return ', '.join(os.path.basename(studio_image.image.path) for studio_image in studio_images)

    def amenities_str(self):
        amenities = Amenity.objects.filter(studio=self.id)
        return ', '.join(f'{amenity.type} ({amenity.quantity})' for amenity in amenities)

    def coaches_str(self):
        classes = Class.objects.filter(studio=self.id)
        return ', '.join(f'{cls.coach}' for cls in classes)

    image_filenames.short_description = 'Images'
    amenities.short_description = 'Amenities'


class StudioImage(models.Model):
    studio = models.ForeignKey(Studio, on_delete=models.CASCADE)  # If image's studio is deleted, it's image is deleted
    image = models.ImageField(upload_to='studio_images/')

    def path(self):
        return self.image.path

    def __str__(self):
        return f'studio: {self.studio.name} - filename: {os.path.basename(self.image.path)}'


class Amenity(models.Model):
    class Meta:
        unique_together = ('studio', 'type', 'quantity')
        verbose_name_plural = 'Amenities'

    studio = models.ForeignKey(Studio, on_delete=models.CASCADE)
    type = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f'{self.studio}, {self.type} ({self.quantity})'

    def studio_type_pair(self):
        return f'{self.studio} - {self.type}'

    studio_type_pair.short_description = 'Studio - Type'


class Class(models.Model):
    """
    Note: we check capacity in ClassTime since capacity is really for a specific ClassTime.
    """

    class Meta:
        verbose_name_plural = 'Classes'

    studio = models.ForeignKey(Studio, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    coach = models.CharField(max_length=200, null=True, blank=True)
    keywords = models.CharField(max_length=200, null=True, blank=True)
    capacity = models.PositiveIntegerField(default=5)

    def __str__(self):
        return self.name

    def class_times(self):
        class_times = ClassTime.objects.filter(class_id=self.id)
        return class_times

    def user_class_times(self, user_id):
        rec_enrolls = RecurringEnroll.objects.filter(user=user_id)
        class_times = ClassTime.objects.none()
        for rec_enroll in rec_enrolls:
            class_times = class_times | ClassTime.objects.filter(id=rec_enroll.class_time.id)  # for qset to work
        indiv_enrolls = IndividualEnroll.objects.filter(user=user_id)
        for indiv_enroll in indiv_enrolls:
            class_times = class_times | ClassTime.objects.filter(id=indiv_enroll.class_time.id)
        return class_times


# Assume everything is once a week
class ClassTime(models.Model):
    class Meta:
        unique_together = ('class_id', 'day', 'time')  # can't have multiple duration or start_dates for same class_time

    class Days(models.TextChoices):
        MONDAY = 'Monday', _('Monday')
        TUESDAY = 'Tuesday', _('Tuesday')
        WEDNESDAY = 'Wednesday', _('Wednesday')
        THURSDAY = 'Thursday', _('Thursday')
        FRIDAY = 'Friday', _('Friday')
        SATURDAY = 'Saturday', _('Saturday')
        SUNDAY = 'Sunday', _('Sunday')

    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, verbose_name='Class')
    day = models.CharField(max_length=9, choices=Days.choices)
    time = models.TimeField()
    duration = models.PositiveIntegerField(verbose_name='Duration (Hours)')
    start_date = models.DateField()

    def __str__(self):
        return f'{self.class_id}, {self.day} at {self.time} ' \
               f'({self.duration} hours)'

    def clean(self):
        errors = {}

        if self.duration == 0:
            errors['duration'] = 'Duration must be positive integer, got 0.'

        if self.start_date is not None:  # TODO: why need this and not auto check?
            start_date_day = calendar.day_name[self.start_date.weekday()]
            if start_date_day != self.day:
                errors['start_date'] = f'Start date must be on same day as Day, ' \
                                       f'got {start_date_day} instead of {self.day}.'

        if errors:
            raise ValidationError(errors)

        return super().clean()

    def recurring_enrolls(self):
        """ Return all the RecurringEnroll objects of users enrolled in this classtime. """
        recurring_enrolls = RecurringEnroll.objects.filter(class_time=self)
        return recurring_enrolls

    def user_recurring_enrolls(self, user):
        """ Return all the RecurringEnroll objects of a specific user in this classtime. Should just be one. """
        print("id " + str(self.class_id))
        recurring_enrolls = RecurringEnroll.objects.filter(class_time=self, user=user)
        print(recurring_enrolls)
        return recurring_enrolls

    def individual_enrolls(self):
        """ Return all the IndividualEnroll objects of users enrolled in this classtime. """
        individual_enrolls = IndividualEnroll.objects.filter(class_time=self)
        return individual_enrolls

    def user_individual_enrolls(self, user):
        """ Return all the IndividualEnroll objects of a specific user in this classtime. Could be many. """
        print(self)
        individual_enrolls = IndividualEnroll.objects.filter(user=user, class_time=self)
        return individual_enrolls

    def specific_session_cancellations(self):
        specific_session_cancellations = SpecificSessionCancellation.objects.filter(class_time=self.id)
        return specific_session_cancellations

    def num_enrolled(self, session_num: int):  # TODO: check
        """Get the number of users enrolled in the session_num session for this ClassTime."""
        recurring_enrolls = RecurringEnroll.objects.filter(class_time=self.id)
        num_enrolled = 0
        session_datetime = get_session_datetime(self, session_num)

        # Count RecurringEnrolls that do not have a RecurringEnrollSpecificSessionDrop on session_num
        # TODO: see edge case 1 in RecurringEnroll, otherwise could count things twice when should be 1 or
        #  once when should be zero (one has drop on session_num, other doesnt)
        for recurring_enroll in recurring_enrolls:
            drops = RecurringEnrollSpecificSessionDrop.objects.filter(
                recurring_enroll=recurring_enroll).filter(session_num=session_num)

            if drops:
                # If there is a drop on this session_num, then the user is not enrolled in this session
                continue

            if recurring_enroll.end_datetime is not None:
                # If end_datetime is not None and not dropped, then the user is enrolled if session_datetime is
                # between start_datetime and end_datetime
                if recurring_enroll.start_datetime <= session_datetime <= recurring_enroll.end_datetime:
                    num_enrolled += 1
            else:
                # If end_datetime is None and not dropped, then the user is enrolled if
                # session_datetime is after start_datetime
                if recurring_enroll.start_datetime <= session_datetime:
                    num_enrolled += 1

        individual_enrolls_for_session = IndividualEnroll.objects.filter(class_time=self.id, session_num=session_num)
        num_enrolled += len(individual_enrolls_for_session)
        return num_enrolled


def get_session_datetime(class_time: ClassTime, session_num: int) -> datetime.datetime:
    session_date = class_time.start_date + datetime.timedelta(weeks=int(session_num))
    session_datetime = datetime.datetime.combine(session_date, class_time.time)
    return session_datetime.replace(tzinfo=pytz.UTC)


class RecurringEnroll(models.Model):
    """Represents a recurring enrollment by a user.

    To enroll in all future instances, create this object.
    To drop all future instances, set end_datetime to current datetime.
        (don't delete this object since we need to remember a user's history)

    Edge cases:
        1) Make sure we cannot have two RecurringEnroll for the same class_time and user with overlapping intervals
            Necessary for class_time.num_enrolled() to work correctly.
        2) Make sure that if this user has FUTURE IndividualEnrolls for this class_time, they are deleted
            when RecurringEnroll is created.
    """

    class Meta:
        unique_together = ('class_time', 'user', 'start_datetime')

    class_time = models.ForeignKey(ClassTime, on_delete=models.CASCADE)
    user = models.ForeignKey(TFCUser, on_delete=models.CASCADE)
    # filled when user makes recurring enrollment to class (upon creation)
    start_datetime = models.DateTimeField(default=timezone.now)
    # filled when user makes recurring drop to class (drop all future instances)
    end_datetime = models.DateTimeField(null=True, blank=True, default=None)

    def delete_future_individual_enrolls(self, dt: timezone):
        individual_enrolls = IndividualEnroll.objects.filter(class_time=self.class_time, user=self.user)

        for individual_enroll in individual_enrolls:
            session_datetime = get_session_datetime(individual_enroll.class_time, individual_enroll.session_num)

            if session_datetime.replace(tzinfo=None) >= dt.replace(tzinfo=None):
                # Datetime of the session for this ind enrol is after dt, delete
                individual_enroll.delete()

    def delete_future_recurring_enroll_drops(self, dt: timezone):
        recurring_enroll_specific_session_drops = self.recurring_enroll_specific_session_drops()

        for ressd in recurring_enroll_specific_session_drops:
            session_datetime = get_session_datetime(self.class_time, ressd.session_num)

            if session_datetime.replace(tzinfo=None) >= dt.replace(tzinfo=None):
                # Datetime of the session for this drop is after dt, delete
                ressd.delete()

    def recurring_enroll_specific_session_drops(self):
        recurring_enroll_specific_session_drops = \
            RecurringEnrollSpecificSessionDrop.objects.filter(recurring_enroll=self.id)
        return recurring_enroll_specific_session_drops

    def save(self, *args, **kwargs):
        """Check Edge Cases when creating or updating."""
        if self.end_datetime is None:
            self.ensure_no_recurring_overlap()
            self.delete_future_individual_enrolls(self.start_datetime)
            self.delete_future_recurring_enroll_drops(self.start_datetime)

        # Delete drops after end_datetime is set
        if self.end_datetime is not None:
            self.delete_future_recurring_enroll_drops(self.end_datetime)
        super().save(*args, **kwargs)

    def ensure_no_recurring_overlap(self):
        """ TODO: Test
        Checks Edge Case #1:
            Make sure we cannot have two RecurringEnroll for the same class_time and user with overlapping intervals.
            Necessary for class_time.num_enrolled() to work correctly.
        """
        matches = RecurringEnroll.objects.filter(class_time=self.class_time, user=self.user)
        err_msg = 'Unable to create RecurringEnroll, overlaps with existing RecurringEnroll.'

        # Check that there is no ACTIVE RecurringEnroll for this class_time and user
        for match in matches:
            # Started before now and no end date
            if match.start_datetime <= self.start_datetime and match.end_datetime is None:
                # TODO: what's better?
                # raise ValidationError(code='invalid', message=err_msg)
                raise IntegrityError(err_msg)

            # Started before now and end date is after now
            if match.start_datetime <= self.start_datetime and self.start_datetime <= match.end_datetime is None:
                # raise ValidationError(code='invalid', message=err_msg)
                raise IntegrityError(err_msg)

            # There exists a match with a future start_datetime
            # if self.start_datetime <= match.start_datetime:
                # raise Exception('This should never happen since start_datetime should always be in the past.')

    def delete_future_individuals_when_save(self):
        """
        Checks Edge Case #2:
            Delete IndividualEnrolls for this class_time and user that start after
            the RecurringEnroll we want to make, they are deleted when RecurringEnroll is created.
            Don't delete is end_date is None (not active recurring anymore).
        """
        if self.end_datetime is not None:  # should only do in this case
            individual_enrolls = IndividualEnroll.objects.filter(class_time=self.class_time, user=self.user)
            # delete ind enrolls that are after this start time
            for enroll in individual_enrolls:
                if self.start_datetime <= get_session_datetime(enroll.class_time, enroll.session_num):
                    enroll.delete()

    def get_recurring_enroll_specific_session_drops(self):
        return RecurringEnrollSpecificSessionDrop.objects.filter(recurring_enroll=self)

    def __str__(self):
        return str(self.user) + " recurring enrollment in " + \
               str(self.class_time) + " : starting at " + str(self.start_datetime)


class RecurringEnrollSpecificSessionDrop(models.Model):
    """RecurringEnroll can have a 'set of individual drops' -> specific sessions that the user drops.
    This entry represents a user's drop of a specific session in a recurring enrollment.

    To drop an specific session in a recurring enrollment, create this entry.
    To re-enroll in this specific session within this recurring_enroll, delete this entry.

    TODO: can we disallow updates? should only be able to create/delete.
    TODO: can we make a function that is called every time the row is created/deleted?
    IMPORTANT:
        - CANNOT modify this object, only create and delete.
        - CAN ONLY create/delete (drop/re-enroll) for future sessions. That is, when
            recurring_enroll.class_time.start_date + session_num is in the future.
        - CAN ONLY delete if not at capacity for session_num.
    """

    class Meta:
        unique_together = ('recurring_enroll', 'session_num')

    recurring_enroll = models.ForeignKey(RecurringEnroll, on_delete=models.CASCADE)
    session_num = models.PositiveIntegerField()  # can be 0, since we can drop the first instance (if in future)

    # TODO: check these
    def create(self, *args, **kwargs):
        """Only create if session_date is in future."""
        if not self.verify_in_future():
            raise ValidationError('Cannot create drop for a past session.')

        return super().create(*args, **kwargs)

    def update(self, *args, **kwargs):
        """Cannot update this model."""
        raise ValidationError('Cannot edit object of this type.')

    def delete(self, *args, **kwargs):
        if not self.verify_in_future():
            raise ValidationError('Cannot delete a past session.')
        # elif not self.verify_not_cancelled(): TODO: I commented this out for now.
        #     raise ValidationError('Cannot enroll in a cancelled session.')
        # elif not self.verify_undrop():
        #     raise ValidationError('Cannot enroll in a full session.')
        else:
            # We are clear to delete
            super().delete(args, kwargs)

    def verify_undrop(self):
        """Returns whether or not we can allow this session_drop_id to be deleted
        (indicating the user is "re-enrolling") in a particular session.
        """
        try:
            capacity = self.recurring_enroll.class_id.capacity
            if capacity is None or self.recurring_enroll.class_time.num_enrolled(self.session_num) >= capacity:
                # We cannot enroll. There is no space.
                return False
        except:  # TODO: why?
            return False
        return True

    def verify_in_future(self):
        try:
            session_datetime = get_session_datetime(self.recurring_enroll.class_time, self.session_num)
            print(str(session_datetime.astimezone(tz=None)) + " // " + str(timezone.now()))
            print(str(session_datetime.astimezone(tz=None) - timezone.now()))
            return session_datetime.astimezone(tz=None) > timezone.now()
        except:  # TODO: why have try?
            return False

    def verify_not_cancelled(self):
        try:
            cancellation = SpecificSessionCancellation.objects.get(class_time=self.recurring_enroll.class_time,
                                                                   session_num=self.session_num)
            if cancellation is not None:
                return False  # This session was cancelled and we cannot re-enroll in it.
        except:  # TODO: why
            return False
        return True

    def get_session_datetime(self):
        return get_session_datetime(self.recurring_enroll.class_time, self.session_num)


class IndividualEnroll(models.Model):
    """Represents an enrollment to a specific session.

    TODO Questions:
        Can we disallow updates? should only be able to create/delete.
            A: Hard. For now, just dont allow through API
        When is clean called? Delete to?
        Can we make a function that is called every time the row is created/deleted?

    IMPORTANT:
        - CANNOT create this object if user already has an ACTIVE (end_datetime is None) RecurringEnroll for
            class_time.
        - CANNOT modify this object, only create and delete.
        - CAN ONLY create/delete for future sessions. That is, when class_time.start_date + session_num
            is in the future.

    Note that we consider a session starting as having past, for simplicity. So you cannot enrol
    or drop a session which just started but hasn't ended.
    """

    class Meta:
        unique_together = ('class_time', 'user', 'session_num')

    class_time = models.ForeignKey(ClassTime, on_delete=models.CASCADE)
    user = models.ForeignKey(TFCUser, on_delete=models.CASCADE)
    session_num = models.PositiveIntegerField()  # can be 0, since we can enroll in the first instance (if in future)

    def clean(self):
        """Called on every create and update.
        # TODO: Check the cases (1 works, 2 still needs ot be checked).
        """
        # 1. Ensure that user does NOT have an ACTIVE (end_datetime is None) RecurringEnroll for class_time
        recurring_enrolls = RecurringEnroll.objects.filter(class_time=self.class_time)
        recurring_enrolls_for_user = recurring_enrolls.filter(user=self.user)
        if recurring_enrolls_for_user.filter(end_datetime=None):
            raise ValidationError('There exists a RecurringEnroll for this class_time and this user which is ACTIVE.')

        # TODO: test this case
        # 2. Ensure that this specific session is a future session
        session_datetime = get_session_datetime(self.class_time, self.session_num)

        if session_datetime.replace(tzinfo=pytz.UTC) <= timezone.now():
            raise ValidationError('Can only create/delete IndividualEnroll for future sessions.')

    def get_session_datetime(self):
        return get_session_datetime(self.class_time, self.session_num)


class SpecificSessionCancellation(models.Model):
    """Admin creates this entry to cancel a specific session."""

    class Meta:
        unique_together = ('class_time', 'session_num')

    class_time = models.ForeignKey(ClassTime, on_delete=models.CASCADE)
    session_num = models.PositiveIntegerField()  # can be 0, since we can cancel the first instance (as long as in future)

    def class_id(self):
        return self.class_time.class_id

    def studio_id(self):
        return self.class_time.class_id.studio.id
