import json
import os
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth, firestore
from django.conf import settings # Import Django settings

# Get Firestore and Auth clients from settings
FIRESTORE_DB = settings.FIRESTORE_DB
FIREBASE_AUTH = settings.FIREBASE_AUTH

# --- Helper function for authentication (optional, for protected endpoints) ---
def get_authenticated_user(request):
    """
    Verifies Firebase ID token from Authorization header and returns the user.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, "Authorization header missing or malformed."

    id_token = auth_header.split('Bearer ')[1]
    try:
        decoded_token = FIREBASE_AUTH.verify_id_token(id_token)
        uid = decoded_token['uid']
        return uid, None
    except Exception as e:
        return None, f"Invalid or expired token: {e}"

# --- User Authentication Endpoints ---

@api_view(['POST'])
def signup_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'message': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create user in Firebase Authentication
        user_record = FIREBASE_AUTH.create_user(email=email, password=password)

        # Store additional user data in Firestore (private collection)
        app_id = os.getenv('APP_ID', 'default-app-id')
        user_doc_ref = FIRESTORE_DB.document(f'artifacts/{app_id}/users/{user_record.uid}/profile/data')
        user_doc_ref.set({
            'userId': user_record.uid,
            'email': user_record.email,
            'createdAt': firestore.SERVER_TIMESTAMP # Use server timestamp
        }, merge=True)

        print(f'Successfully created new user: {user_record.uid}')
        return Response({'message': 'User created successfully!', 'uid': user_record.uid}, status=status.HTTP_201_CREATED)

    except Exception as e:
        error_code = getattr(e, 'code', 'unknown')
        error_message = 'Failed to create user.'
        if 'email-already-in-use' in str(e):
            error_message = 'The email address is already in use by another account.'
        elif 'weak-password' in str(e):
            error_message = 'Password should be at least 6 characters.'
        elif 'invalid-email' in str(e):
            error_message = 'The email address is not valid.'
        print(f'Error creating user: {e}')
        return Response({'message': error_message, 'code': error_code}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password') # Password is not used directly by Admin SDK for login

    if not email or not password:
        return Response({'message': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get user by email to generate custom token
        user_record = FIREBASE_AUTH.get_user_by_email(email)
        custom_token = FIREBASE_AUTH.create_custom_token(user_record.uid).decode('utf-8')

        print(f'Successfully generated custom token for user: {user_record.uid}')
        return Response({
            'message': 'Login successful!',
            'customToken': custom_token,
            'uid': user_record.uid,
            'email': user_record.email
        }, status=status.HTTP_200_OK)

    except Exception as e:
        error_code = getattr(e, 'code', 'unknown')
        error_message = 'Login failed. Invalid credentials.'
        if 'user-not-found' in str(e):
            error_message = 'User not found.'
        elif 'invalid-email' in str(e):
            error_message = 'Invalid email format.'
        print(f'Error logging in user: {e}')
        return Response({'message': error_message, 'code': error_code}, status=status.HTTP_401_UNAUTHORIZED)

# --- AI Study Plan Generation Endpoint ---

@api_view(['POST'])
def generate_study_plan_view(request):
    # Optional: Implement authentication/authorization here if this endpoint needs protection
    # uid, error_message = get_authenticated_user(request)
    # if uid is None:
    #     return Response({'message': error_message}, status=status.HTTP_401_UNAUTHORIZED)

    syllabus_content = request.data.get('syllabusContent')
    exam_date = request.data.get('examDate')
    user_schedule = request.data.get('userSchedule')

    if not syllabus_content or not exam_date or not user_schedule:
        return Response({'message': 'Syllabus content, exam date, and user schedule are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Call LLM (Gemini) for plan generation
        prompt = f"""
        Given the following syllabus content and exam date, create a detailed, day-wise study plan.
        Consider topic dependencies and allocate time slots based on the user's availability.
        The plan should be dynamic, allowing for reshuffling if topics are skipped.
        Prioritize core topics first.

        Syllabus Content:
        "{syllabus_content}"

        Exam Date: {exam_date}

        User's Daily Study Availability:
        "{user_schedule}"

        Format the output as a clear, structured list of days, with topics and estimated time.
        Example format:
        Day 1 (YYYY-MM-DD):
          - Topic A: 2 hours (8:00 AM - 10:00 AM)
          - Topic B: 1.5 hours (7:00 PM - 8:30 PM)
        Day 2 (YYYY-MM-DD):
          - Topic C: 3 hours (9:00 AM - 12:00 PM)
        ...
        """

        # Gemini API call
        GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")

        GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1500,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ],
        }

        # Use requests library for HTTP calls in Python
        gemini_response = requests.post(GEMINI_ENDPOINT, json=payload)
        gemini_response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)

        gemini_data = gemini_response.json()
        ai_generated_plan = (
            gemini_data.get('candidates', [{}])[0]
            .get('content', {})
            .get('parts', [{}])[0]
            .get('text', 'No response from AI.')
        )

        # You might want to save this plan to Firestore for the authenticated user
        # app_id = os.getenv('APP_ID', 'default-app-id')
        # user_plan_ref = FIRESTORE_DB.collection(f'artifacts/{app_id}/users/{uid}/studyPlans').document()
        # user_plan_ref.set({
        #   'syllabusContent': syllabus_content,
        #   'examDate': exam_date,
        #   'userSchedule': user_schedule,
        #   'generatedPlan': ai_generated_plan,
        #   'createdAt': firestore.SERVER_TIMESTAMP
        # })

        return Response({'plan': ai_generated_plan}, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        print(f"HTTP Request failed: {e}")
        return Response({'message': f'Failed to connect to Gemini API: {e}', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except ValueError as e:
        print(f"Configuration error: {e}")
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f'Error generating study plan: {e}')
        return Response({'message': 'Failed to generate study plan.', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST']) # New view for getting syllabus by subject
def get_syllabus_view(request):
    subject = request.data.get('subject')

    if not subject:
        return Response({'message': 'Subject is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Prompt for Gemini to generate a concise and comprehensive syllabus for the given subject
        prompt = f"""
        Generate a concise and comprehensive syllabus for the subject: "{subject}".
        Include key topics, sub-topics, and a brief description or a few bullet points for each major topic.
        Structure it clearly with headings (e.g., using Markdown) and bullet points.
        Focus on what a student would typically need to learn for this subject or exam.
        If the subject is an exam (e.g., JEE, NEET, UPSC), provide a syllabus outline for that exam.
        """

        GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")

        GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000, # Adjust token limit for syllabus length
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ],
        }

        gemini_response = requests.post(GEMINI_ENDPOINT, json=payload)
        gemini_response.raise_for_status()

        gemini_data = gemini_response.json()
        generated_syllabus = (
            gemini_data.get('candidates', [{}])[0]
            .get('content', {})
            .get('parts', [{}])[0]
            .get('text', 'Could not generate syllabus for this subject.')
        )

        return Response({'syllabus': generated_syllabus}, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        print(f"HTTP Request to Gemini failed: {e}")
        return Response({'message': f'Failed to connect to AI service for syllabus: {e}', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except ValueError as e:
        print(f"Configuration error: {e}")
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f'Error generating syllabus for {subject}: {e}')
        return Response({'message': 'An unexpected error occurred while generating the syllabus.', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

