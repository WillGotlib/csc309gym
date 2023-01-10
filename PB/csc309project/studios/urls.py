from django.urls import path

from studios.views import StudiosView, StudioView, ClassScheduleView, ClassEnrollView, UserClassScheduleView, \
    ClassDropView, NumEnrolledView, StudioIdsView

urlpatterns = [
    path("list/", StudiosView.as_view()),
    path("<int:studio_id>/", StudioView.as_view()),
    path("<int:studio_id>/schedule/", ClassScheduleView.as_view()),
    path("class_time/<int:class_time_id>/enroll/", ClassEnrollView.as_view()),
    path("class_time/<int:class_time_id>/drop/", ClassDropView.as_view()),
    path("schedule/", UserClassScheduleView.as_view()),
    path("class_time/num_enrolled/<int:class_time_id>/<int:session_num>/", NumEnrolledView.as_view()),
    path("ids/", StudioIdsView.as_view()),
]
