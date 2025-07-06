document.addEventListener('DOMContentLoaded', () => {
    const preferredStudyTimeInput = document.getElementById('preferred-study-time');
    const themeSelect = document.getElementById('theme-select');
    const enableRemindersCheckbox = document.getElementById('enable-reminders');
    const reminderFrequencyInput = document.getElementById('reminder-frequency');
    const clearDataButton = document.getElementById('clear-data-button');
    const saveSettingsButton = document.getElementById('save-settings-button');

    // Load settings from Local Storage
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('studyCraftSettings')) || {};

        preferredStudyTimeInput.value = settings.preferredStudyTime || 3;
        themeSelect.value = settings.theme || 'light';
        enableRemindersCheckbox.checked = settings.enableReminders || false;
        reminderFrequencyInput.value = settings.reminderFrequency || 60;

        applyTheme(themeSelect.value); // Apply theme on load
    }

    // Save settings to Local Storage
    function saveSettings() {
        const settings = {
            preferredStudyTime: parseInt(preferredStudyTimeInput.value),
            theme: themeSelect.value,
            enableReminders: enableRemindersCheckbox.checked,
            reminderFrequency: parseInt(reminderFrequencyInput.value)
        };
        localStorage.setItem('studyCraftSettings', JSON.stringify(settings));
        alert('Settings saved successfully!');
        applyTheme(settings.theme); // Apply theme immediately
    }

    // Apply theme to the document body
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
    }

    // Event Listeners
    saveSettingsButton.addEventListener('click', saveSettings);

    themeSelect.addEventListener('change', () => {
        applyTheme(themeSelect.value);
    });

    clearDataButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL your local StudyCraft data (tasks, plans, settings)? This cannot be undone.')) {
            localStorage.clear();
            alert('All local data cleared!');
            // Optionally, reload the page or reset UI
            window.location.reload();
        }
    });

    // Initial load
    loadSettings();
});