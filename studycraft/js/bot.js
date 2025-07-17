document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Your provided API Key. In a production environment, this should be handled on a backend server.
    const GEMINI_API_KEY = '';

    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage(message, 'user-message');
        userInput.value = '';
        showTypingIndicator(); // Show typing indicator

        try {
            const response = await fetch(GEMINI_ENDPOINT, { // Corrected: Using GEMINI_ENDPOINT
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Removed 'Authorization' header as API key is in URL for this endpoint type
                },
                body: JSON.stringify({
                    // Gemini API uses 'contents' with 'parts' structure
                    contents: [{
                        parts: [
                            { text: message }
                        ]
                    }],
                    // Optional: Add generation and safety settings specific to Gemini API
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 300,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                    ],
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API error:', errorData); // Corrected: Error logging for Gemini
                throw new Error(`Gemini API responded with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            // Access the bot's response correctly from the Gemini API structure
            const botResponse = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text
                                ? data.candidates[0].content.parts[0].text
                                : 'No response from AI.'; // Handle cases where no text is returned

            appendMessage(botResponse, 'bot-message');

        } catch (error) {
            console.error('Error communicating with Gemini:', error); // Corrected: Error logging for Gemini
            appendMessage('Oops! Something went wrong with the AI. Please try again later or check your API key/network connection.', 'bot-message error-message');
        } finally {
            removeTypingIndicator(); // Remove typing indicator
            chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
        }
    }

    function appendMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot-message', 'typing-indicator');
        typingIndicator.innerHTML = `<p>...</p>`;
        typingIndicator.id = 'typing-indicator';
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial message from the bot (already in HTML)
});
