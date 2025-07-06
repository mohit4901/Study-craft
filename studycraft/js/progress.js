document.addEventListener('DOMContentLoaded', () => {
    const totalTasksStat = document.getElementById('total-tasks-stat');
    const completedTasksStat = document.getElementById('completed-tasks-stat');
    const completionRateStat = document.getElementById('completion-rate-stat');
    const tasksCompletionChartCanvas = document.getElementById('tasksCompletionChart').getContext('2d');
    const studyPlanProgressChartCanvas = document.getElementById('studyPlanProgressChart').getContext('2d');

    // 1. Get data from localStorage
    const tasks = JSON.parse(localStorage.getItem('studyCraftTasks')) || [];
    const parsedPlan = JSON.parse(localStorage.getItem('studyCraftParsedPlan')) || [];

    // --- Update Statistics ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    totalTasksStat.textContent = totalTasks;
    completedTasksStat.textContent = completedTasks;
    completionRateStat.textContent = `${completionRate}%`;

    // --- Chart 1: Tasks Completion Over Time (Basic Example) ---
    // This would require storing task completion dates for accuracy.
    // For simplicity, let's just create some dummy data based on current tasks.
    const tasksByDate = {}; // { 'YYYY-MM-DD': count }
    tasks.forEach(task => {
        if (task.completed && task.completedDate) { // Assuming tasks also store a completion date
            const date = new Date(task.completedDate).toISOString().split('T')[0];
            tasksByDate[date] = (tasksByDate[date] || 0) + 1;
        }
    });

    // Dummy data if no actual dates are available (for initial display)
    if (Object.keys(tasksByDate).length === 0 && completedTasks > 0) {
        const today = new Date();
        for (let i = 0; i < completedTasks; i++) {
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - (completedTasks - 1 - i)); // Distribute them
            const dateStr = pastDate.toISOString().split('T')[0];
            tasksByDate[dateStr] = (tasksByDate[dateStr] || 0) + 1;
        }
    }


    const dates = Object.keys(tasksByDate).sort();
    const completedCounts = dates.map(date => tasksByDate[date]);

    new Chart(tasksCompletionChartCanvas, {
        type: 'line',
        data: {
            labels: dates.length > 0 ? dates : ['No Data'],
            datasets: [{
                label: 'Tasks Completed',
                data: completedCounts.length > 0 ? completedCounts : [0],
                borderColor: 'rgba(0, 123, 255, 1)',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tasks'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    // --- Chart 2: Study Plan Progress (e.g., Kanban Column Distribution) ---
    const todoCount = parsedPlan.filter(task => task.status === 'todo').length;
    const inProgressCount = parsedPlan.filter(task => task.status === 'inprogress').length;
    const doneCount = parsedPlan.filter(task => task.status === 'done').length;

    new Chart(studyPlanProgressChartCanvas, {
        type: 'pie',
        data: {
            labels: ['To Do', 'In Progress', 'Done'],
            datasets: [{
                data: [todoCount, inProgressCount, doneCount],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',  // Yellow for To Do
                    'rgba(0, 123, 255, 0.8)', // Blue for In Progress
                    'rgba(40, 167, 69, 0.8)'  // Green for Done
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(0, 123, 255, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                                if (totalTasks > 0) { // Add percentage if there are tasks
                                     const percentage = ((context.parsed / parsedPlan.length) * 100).toFixed(1);
                                     label += ` (${percentage}%)`;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
});