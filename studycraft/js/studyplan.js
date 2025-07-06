document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanban-board');
    const toDoColumn = document.querySelector('#to-do-column .tasks');
    const inProgressColumn = document.querySelector('#in-progress-column .tasks');
    const doneColumn = document.querySelector('#done-column .tasks');
    const reshufflePlanButton = document.getElementById('reshuffle-plan-button');

    // Retrieve generated plan from localStorage (from syllabus.js)
    let generatedPlan = localStorage.getItem('studyCraftGeneratedPlan') || 'No plan generated yet.';
    let parsedPlan = []; // This will hold the structured plan data

    // Function to parse the AI-generated plan (very basic, needs robust parsing)
    function parsePlanText(planText) {
        const lines = planText.split('\n').filter(line => line.trim() !== '');
        let currentDay = null;
        let tasks = [];

        lines.forEach(line => {
            if (line.startsWith('Day')) {
                currentDay = line.trim();
            } else if (line.startsWith('- ')) {
                const taskContent = line.substring(2).trim();
                tasks.push({
                    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID
                    day: currentDay,
                    content: taskContent,
                    status: 'todo' // Default status
                });
            }
        });
        return tasks;
    }

    // Function to render tasks into Kanban columns
    function renderKanbanTasks() {
        // Clear existing tasks
        toDoColumn.innerHTML = '';
        inProgressColumn.innerHTML = '';
        doneColumn.innerHTML = '';

        parsedPlan.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.setAttribute('draggable', true);
            taskCard.dataset.id = task.id; // Store ID for drag/drop
            taskCard.dataset.day = task.day; // Store day info
            taskCard.innerHTML = `
                <h3>${task.day}</h3>
                <p>${task.content}</p>
            `;

            if (task.status === 'todo') {
                toDoColumn.appendChild(taskCard);
            } else if (task.status === 'inprogress') {
                inProgressColumn.appendChild(taskCard);
            } else if (task.status === 'done') {
                doneColumn.appendChild(taskCard);
            }
        });
        addDragAndDropListeners();
    }

    function addDragAndDropListeners() {
        const tasks = document.querySelectorAll('.task-card');
        const columns = document.querySelectorAll('.kanban-column .tasks');

        tasks.forEach(task => {
            task.addEventListener('dragstart', dragStart);
        });

        columns.forEach(column => {
            column.addEventListener('dragover', dragOver);
            column.addEventListener('dragleave', dragLeave);
            column.addEventListener('drop', drop);
        });
    }

    let draggedTask = null;

    function dragStart(e) {
        draggedTask = this;
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0); // Allow browser to capture the element first
        e.dataTransfer.setData('text/plain', this.dataset.id); // Set data to transfer
    }

    function dragOver(e) {
        e.preventDefault(); // Allow drop
        if (e.target.classList.contains('tasks') || e.target.closest('.tasks')) {
            // Optional: add visual feedback for drag over
             e.target.classList.add('drag-over');
        }
    }

    function dragLeave(e) {
        if (e.target.classList.contains('tasks') || e.target.closest('.tasks')) {
            // Optional: remove visual feedback
            e.target.classList.remove('drag-over');
        }
    }

    function drop(e) {
        e.preventDefault();
        const droppedOnColumn = e.target.closest('.tasks');
        if (droppedOnColumn) {
            const newStatus = droppedOnColumn.dataset.status;
            const taskId = draggedTask.dataset.id;

            // Update task status in parsedPlan array
            const taskIndex = parsedPlan.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                parsedPlan[taskIndex].status = newStatus;
                saveParsedPlan(); // Save updated plan to localStorage
                droppedOnColumn.appendChild(draggedTask); // Move the actual DOM element
                draggedTask.classList.remove('dragging');
            }
        }
        draggedTask = null;
    }

    function saveParsedPlan() {
        localStorage.setItem('studyCraftParsedPlan', JSON.stringify(parsedPlan));
    }

    function loadParsedPlan() {
        const storedPlan = localStorage.getItem('studyCraftParsedPlan');
        if (storedPlan) {
            parsedPlan = JSON.parse(storedPlan);
        } else {
            // If no parsed plan, try to parse from the raw generated text
            if (generatedPlan && generatedPlan !== 'No plan generated yet.') {
                parsedPlan = parsePlanText(generatedPlan);
                saveParsedPlan(); // Save the newly parsed plan
            }
        }
        renderKanbanTasks();
    }

    // "Reshuffle Plan" button logic
    // This is complex and would ideally re-engage the AI via backend.
    reshufflePlanButton.addEventListener('click', async () => {
        alert('Reshuffling plan is a complex AI feature. For a real application, this would send current progress and skipped topics back to a backend for AI to generate a revised plan.');
        // In a real scenario:
        // 1. Collect current completed/skipped tasks from `parsedPlan`.
        // 2. Send this information along with original syllabus/exam date to your backend.
        // 3. Backend calls OpenAI with a prompt like:
        //    "Given the original syllabus and exam date, and the fact that these topics have been completed: [...] and these topics were skipped: [...], generate a revised study plan from today onwards."
        // 4. Update `parsedPlan` with the new AI response and re-render.
    });

    loadParsedPlan(); // Initial load and render of the plan
});