document.addEventListener('DOMContentLoaded', () => {
    console.log('StudyCraft Home Page Loaded!');

    const subjectInput = document.getElementById('subject-input');
    const searchButton = document.querySelector('.subject-search-bar .search-button');
    const syllabusOutputSection = document.getElementById('syllabus-output-section');
    const syllabusLoadingIndicator = document.getElementById('syllabus-loading-indicator');
    const syllabusContentDiv = document.getElementById('syllabus-content');
    const syllabusSubjectTitle = document.getElementById('syllabus-subject-title');
    const generatedSyllabusText = document.getElementById('generated-syllabus-text');

   
    const GEMINI_API_KEY = 'AIzaSyCz2o8_6ypoW3wydlnKyjOepGbj0__QO_c'; 
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;


    // Function to handle subject search and fetch syllabus directly from Gemini API
    async function handleSubjectSearch() {
        const selectedSubject = subjectInput.value.trim();
        if (selectedSubject === '') {
            alert('Please choose or type a subject to get its syllabus.');
            return;
        }

        // Show loading indicator and syllabus section
        syllabusOutputSection.style.display = 'block';
        syllabusLoadingIndicator.style.display = 'block';
        syllabusContentDiv.style.display = 'none';
        generatedSyllabusText.textContent = ''; // Clear previous content
        syllabusSubjectTitle.textContent = selectedSubject; // Set subject title immediately

        try {
            // Prompt for Gemini to generate a concise and comprehensive syllabus
            const prompt = `
            Generate a concise and comprehensive syllabus for the subject: "${selectedSubject}".
            Include key topics, sub-topics, and a brief description or a few bullet points for each major topic.
            Structure it clearly with headings (e.g., using Markdown) and bullet points.
            Focus on what a student would typically need to learn for this subject or exam.
            If the subject is an exam (e.g., JEE, JEE Mains, NEET, UPSC, SSC, State PCS), provide a syllabus outline for that specific exam.
            `;

            const payload = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000, // Adjust token limit for syllabus length
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                ],
            };

            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if data.error exists for more specific error messages from Gemini API
                const errorMessage = data.error && data.error.message ? data.error.message : 'Unknown API error.';
                throw new Error(`Gemini API responded with status ${response.status}: ${errorMessage}`);
            }

            // Extract the generated text from the Gemini API response structure
            const generatedSyllabus = data.candidates && data.candidates[0] && 
                                     data.candidates[0].content && data.candidates[0].content.parts &&
                                     data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text
                                     ? data.candidates[0].content.parts[0].text
                                     : 'Could not generate syllabus for this subject.';

            generatedSyllabusText.textContent = generatedSyllabus;
            syllabusContentDiv.style.display = 'block'; // Show syllabus content

        } catch (error) {
            console.error('Error fetching syllabus directly from Gemini:', error);
            generatedSyllabusText.textContent = `Error: Could not retrieve syllabus for "${selectedSubject}". Please try again later. (Details: ${error.message})`;
            syllabusContentDiv.style.display = 'block'; // Still show the content div to display error
        } finally {
            syllabusLoadingIndicator.style.display = 'none'; // Hide loading indicator
            // Scroll to the syllabus section for better UX
            syllabusOutputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Event listener for the search button
    if (searchButton) {
        searchButton.addEventListener('click', handleSubjectSearch);
    }

    // Event listener for 'Enter' key press in the input field
    if (subjectInput) {
        subjectInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if any
                handleSubjectSearch();
            }
        });
    }

    // Add any specific animations or interactions here if desired.
});
