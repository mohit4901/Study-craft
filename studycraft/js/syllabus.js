document.addEventListener('DOMContentLoaded', () => {
    const syllabusPdfInput = document.getElementById('syllabus-pdf');
    const examDateInput = document.getElementById('exam-date');
    const userScheduleTextarea = document.getElementById('user-schedule');
    const generatePlanButton = document.getElementById('generate-plan-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const planOutput = document.getElementById('plan-output');
    const generatedPlanText = document.getElementById('generated-plan-text');
    const viewFullPlanButton = document.getElementById('view-full-plan-button');

    
    const OPENAI_API_KEY = '07881394-1fe8-4d47-a108-930ee112d453'; // Replace with your key for testing
    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    generatePlanButton.addEventListener('click', async () => {
        const pdfFile = syllabusPdfInput.files[0];
        const examDate = examDateInput.value;
        const userSchedule = userScheduleTextarea.value.trim();

        if (!pdfFile || !examDate || !userSchedule) {
            alert('Please upload your syllabus PDF, select an exam date, and describe your study schedule.');
            return;
        }

        if (pdfFile.type !== 'application/pdf') {
            alert('Please upload a PDF file for your syllabus.');
            return;
        }

        loadingIndicator.style.display = 'block';
        planOutput.style.display = 'none';

        let syllabusContent = '';
        try {
            // --- Frontend PDF Text Extraction (for demo purposes, limited) ---
            // In a real app, you'd send the PDF to a backend for more robust parsing.
            // This requires a library like PDF.js or a backend service.
            // For simplicity, let's just pretend we extracted text.
            // You would use FileReader to read the file, then PDF.js to parse.
            // Example placeholder:
            syllabusContent = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // In a real app, parse e.target.result (ArrayBuffer) with PDF.js
                    // For this demo, let's just indicate a successful "read"
                    resolve(`[Content from ${pdfFile.name} - This would be actual text extracted from PDF]`);
                };
                reader.readAsArrayBuffer(pdfFile);
            });
           

            const prompt = `
            Given the following syllabus content and exam date, create a detailed, day-wise study plan.
            Consider topic dependencies and allocate time slots based on the user's availability.
            The plan should be dynamic, allowing for reshuffling if topics are skipped.
            Prioritize core topics first.

            Syllabus Content:
            "${syllabusContent}"

            Exam Date: ${examDate}

            User's Daily Study Availability:
            "${userSchedule}"

            Format the output as a clear, structured list of days, with topics and estimated time.
            Example format:
            Day 1 (YYYY-MM-DD):
              - Topic A: 2 hours (8:00 AM - 10:00 AM)
              - Topic B: 1.5 hours (7:00 PM - 8:30 PM)
            Day 2 (YYYY-MM-DD):
              - Topic C: 3 hours (9:00 AM - 12:00 PM)
            ...
            `;

            const response = await fetch(OPENAI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // or 'gpt-4'
                    messages: [
                        { role: 'system', content: 'You are StudyCraft, an AI assistant specialized in creating detailed study plans from syllabi.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1500, // Adjust as needed for long plans
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API error:', errorData);
                throw new Error(`OpenAI API responded with status ${response.status}: ${errorData.error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const aiGeneratedPlan = data.choices[0].message.content;

            generatedPlanText.textContent = aiGeneratedPlan; // Display the plan
            localStorage.setItem('studyCraftGeneratedPlan', aiGeneratedPlan); // Save for studyplan.html
            planOutput.style.display = 'block';

        } catch (error) {
            console.error('Error generating study plan:', error);
            alert('Failed to generate study plan. Please check your inputs and try again. (Developer info: ' + error.message + ')');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    viewFullPlanButton.addEventListener('click', () => {
        window.location.href = 'studyplan.html'; // Navigate to the study plan page
    });
});