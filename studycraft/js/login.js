// login.js - Frontend Authentication Logic (Interacting with Django Backend)

// Firebase client-side SDK is still needed for signInWithCustomToken and onAuthStateChanged
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithCustomToken, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleText = document.getElementById('toggle-text');

    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorMessage = document.getElementById('login-error-message');
    const loginButton = document.getElementById('login-button');

    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmPasswordInput = document = document.getElementById('signup-confirm-password');
    const signupErrorMessage = document.getElementById('signup-error-message');
    const signupButton = document.getElementById('signup-button');

    const userInfoDisplay = document.querySelector('.user-info-display');
    const currentUserIdSpan = document.getElementById('current-user-id');
    const currentUserEmailSpan = document.getElementById('current-user-email');
    const logoutButton = document.getElementById('logout-button');

    // Backend API URL (IMPORTANT: Change this to your Django backend server's URL)
    // Django typically runs on port 8000 by default
    const BACKEND_URL = 'http://localhost:8000'; 

    // Firebase Client-side Initialization
    let app, auth; 
    try {
        // Global variables provided by the Canvas environment
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

        if (!firebaseConfig) {
            console.error("Firebase client-side configuration not found. Cannot initialize Firebase client.");
            loginErrorMessage.textContent = "Authentication is not available. Firebase config missing.";
            signupErrorMessage.textContent = "Authentication is not available. Firebase config missing.";
            loginButton.disabled = true;
            signupButton.disabled = true;
            return;
        }

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);

        // Sign in with custom token if available, otherwise anonymously
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

        console.log("Firebase client-side initialized and authenticated.");

    } catch (error) {
        console.error("Error initializing Firebase client-side:", error);
        loginErrorMessage.textContent = `Firebase client initialization failed: ${error.message}`;
        signupErrorMessage.textContent = `Firebase client initialization failed: ${error.message}`;
        loginButton.disabled = true;
        signupButton.disabled = true;
        return;
    }

    let currentUserId = auth.currentUser?.uid || crypto.randomUUID(); 

    // Function to update UI based on auth state
    const updateAuthUI = (user) => {
        if (user && user.email) { 
            currentUserId = user.uid;
            currentUserIdSpan.textContent = user.uid;
            currentUserEmailSpan.textContent = user.email;
            userInfoDisplay.style.display = 'block';
            loginForm.style.display = 'none';
            signupForm.style.display = 'none';
            authTitle.textContent = 'Welcome Back!';
            toggleText.style.display = 'none'; 
            console.log("User is signed in:", user.uid);
            window.location.href = 'index.html'; // Redirect to home page after successful login/signup
        } else {
            currentUserId = null; 
            userInfoDisplay.style.display = 'none';
            loginForm.style.display = 'block'; 
            authTitle.textContent = 'Login to StudyCraft';
            toggleText.style.display = 'block'; 
            console.log("User is signed out or anonymous.");
        }
    };

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);
    });

    // Handle Login via Backend
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMessage.textContent = ''; 

        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        if (!email || !password) {
            loginErrorMessage.textContent = 'Please enter both email and password.';
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/login/`, { // Note the trailing slash for Django
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            // Backend returns a custom token, sign in with it on the client
            await signInWithCustomToken(auth, data.customToken);
            console.log('User logged in via backend custom token:', data.uid);
            // updateAuthUI will be called by onAuthStateChanged listener and handle redirect
        } catch (error) {
            console.error('Login error:', error);
            loginErrorMessage.textContent = error.message || 'Login failed. Please try again.';
        }
    });

    // Handle Sign Up via Backend
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupErrorMessage.textContent = ''; 

        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        const confirmPassword = signupConfirmPasswordInput.value;

        if (!email || !password || !confirmPassword) {
            signupErrorMessage.textContent = 'Please fill in all fields.';
            return;
        }

        if (password !== confirmPassword) {
            signupErrorMessage.textContent = 'Passwords do not match.';
            return;
        }

        if (password.length < 6) {
            signupErrorMessage.textContent = 'Password should be at least 6 characters.';
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/signup/`, { // Note the trailing slash for Django
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Sign up failed.');
            }

            console.log('User signed up via backend:', data.uid);
            // Auto-login after successful signup for better UX
            await loginUserAfterSignup(email, password); 
        } catch (error) {
            console.error('Sign up error:', error);
            signupErrorMessage.textContent = error.message || 'Sign up failed. Please try again.';
        }
    });

    // Helper function to login user immediately after successful signup
    const loginUserAfterSignup = async (email, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/login/`, { // Note the trailing slash for Django
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Auto-login failed after signup.');
            }

            await signInWithCustomToken(auth, data.customToken);
            console.log('User auto-logged in after signup:', data.uid);
            // updateAuthUI will handle redirect
        } catch (error) {
            console.error('Auto-login after signup error:', error);
            loginErrorMessage.textContent = 'Account created, but auto-login failed. Please try logging in manually.';
            // Switch to login form if auto-login fails
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            authTitle.textContent = 'Login to StudyCraft';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="show-signup">Sign Up</a>';
        }
    };


    // Handle Logout
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log('User logged out.');
            // Clear form fields
            loginEmailInput.value = '';
            loginPasswordInput.value = '';
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
            signupConfirmPasswordInput.value = '';
            loginErrorMessage.textContent = '';
            signupErrorMessage.textContent = '';
            // updateAuthUI will be called by onAuthStateChanged listener and handle UI update
        } catch (error) {
            console.error('Logout error:', error);
            // Display error in a message box (or custom modal)
            alert('Logout failed: ' + error.message); // Using alert for simplicity, replace with custom modal
        }
    });

    // Toggle between Login and Sign Up forms
    toggleText.addEventListener('click', (e) => {
        if (e.target.id === 'show-signup') {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            authTitle.textContent = 'Create Your Account';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="show-login">Login</a>';
        } else if (e.target.id === 'show-login') {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            authTitle.textContent = 'Login to StudyCraft';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="show-signup">Sign Up</a>';
        }
    });

    // Initial UI update
    updateAuthUI(auth.currentUser);
});
