document.addEventListener('DOMContentLoaded', () => {
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');

    // Load tasks from Local Storage
    let tasks = JSON.parse(localStorage.getItem('studyCraftTasks')) || [];

    function saveTasks() {
        localStorage.setItem('studyCraftTasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = ''; // Clear current list
        tasks.forEach((task, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            if (task.completed) {
                listItem.classList.add('completed');
            }

            listItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                <span>${task.text}</span>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            taskList.appendChild(listItem);
        });
    }

    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText !== '') {
            tasks.push({ text: taskText, completed: false });
            newTaskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }

    function toggleTaskCompletion(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    // Event Listeners
    addTaskButton.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    taskList.addEventListener('click', (event) => {
        if (event.target.type === 'checkbox') {
            const index = parseInt(event.target.dataset.index);
            toggleTaskCompletion(index);
        } else if (event.target.classList.contains('delete-btn')) {
            const index = parseInt(event.target.dataset.index);
            deleteTask(index);
        }
    });

    // Initial render
    renderTasks();
});