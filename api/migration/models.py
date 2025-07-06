from django.db import models

# In this project, data persistence is primarily handled by Firebase Firestore
# via the Firebase Admin SDK in api/views.py.
# You do not need to define Django models here unless you plan to use a
# traditional relational database (like SQLite, PostgreSQL) alongside Firestore
# for specific data.

# Example of a Django model if you were to use one:
# class StudyPlan(models.Model):
#     user_id = models.CharField(max_length=255)
#     syllabus_content = models.TextField()
#     exam_date = models.DateField()
#     generated_plan_text = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     def __str__(self):
#         return f"Study Plan for {self.user_id} on {self.exam_date}"

