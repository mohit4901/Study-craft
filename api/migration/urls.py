from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('generate-study-plan/', views.generate_study_plan_view, name='generate_study_plan'),
    path('get-syllabus/', views.get_syllabus_view, name='get_syllabus'), # Endpoint for syllabus search
    # Add more API endpoints here as your application grows
]
