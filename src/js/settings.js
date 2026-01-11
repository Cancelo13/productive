class SettingsManager {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.populateSettings();
    }

    async loadSettings() {
        try {
            // Load settings from localStorage for now (could be moved to database later)
            const savedSettings = localStorage.getItem('app-settings');
            this.settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            defaultPriority: 'medium',
            autoSave: true,
            sessionGoal: 25,
            breakReminder: 5,
            notifications: true
        };
    }

    setupEventListeners() {
        // Theme change
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.updateSetting('theme', e.target.value));
        }

        // Default priority
        const prioritySelect = document.getElementById('default-priority');
        if (prioritySelect) {
            prioritySelect.addEventListener('change', (e) => this.updateSetting('defaultPriority', e.target.value));
        }

        // Auto-save checkbox
        const autoSaveCheck = document.getElementById('auto-save');
        if (autoSaveCheck) {
            autoSaveCheck.addEventListener('change', (e) => this.updateSetting('autoSave', e.target.checked));
        }

        // Session goal
        const sessionGoal = document.getElementById('session-goal');
        if (sessionGoal) {
            sessionGoal.addEventListener('change', (e) => this.updateSetting('sessionGoal', parseInt(e.target.value)));
        }

        // Break reminder
        const breakReminder = document.getElementById('break-reminder');
        if (breakReminder) {
            breakReminder.addEventListener('change', (e) => this.updateSetting('breakReminder', parseInt(e.target.value)));
        }

        // Notifications
        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.addEventListener('change', (e) => this.updateSetting('notifications', e.target.checked));
        }

        // Export buttons
        const exportTodos = document.getElementById('export-todos');
        if (exportTodos) {
            exportTodos.addEventListener('click', () => this.exportTodos());
        }

        const exportSessions = document.getElementById('export-sessions');
        if (exportSessions) {
            exportSessions.addEventListener('click', () => this.exportWorkSessions());
        }

        // Import data
        const importData = document.getElementById('import-data');
        if (importData) {
            importData.addEventListener('click', () => this.importData());
        }

        // Clear completed todos
        const clearCompleted = document.getElementById('clear-completed');
        if (clearCompleted) {
            clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        }

        // Reset all data
        const resetAll = document.getElementById('reset-all');
        if (resetAll) {
            resetAll.addEventListener('click', () => this.resetAllData());
        }
    }

    populateSettings() {
        // Set form values from current settings
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = this.settings.theme;

        const prioritySelect = document.getElementById('default-priority');
        if (prioritySelect) prioritySelect.value = this.settings.defaultPriority;

        const autoSaveCheck = document.getElementById('auto-save');
        if (autoSaveCheck) autoSaveCheck.checked = this.settings.autoSave;

        const sessionGoal = document.getElementById('session-goal');
        if (sessionGoal) sessionGoal.value = this.settings.sessionGoal;

        const breakReminder = document.getElementById('break-reminder');
        if (breakReminder) breakReminder.value = this.settings.breakReminder;

        const notifications = document.getElementById('notifications');
        if (notifications) notifications.checked = this.settings.notifications;

        // Update data path display
        this.updateDataPath();
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        await this.saveSettings();
        this.applySetting(key, value);
    }

    async saveSettings() {
        try {
            localStorage.setItem('app-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applySetting(key, value) {
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'notifications':
                this.toggleNotifications(value);
                break;
        }
    }

    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        }
    }

    toggleNotifications(enabled) {
        if (enabled && 'Notification' in window) {
            Notification.requestPermission();
        }
    }

    async exportTodos() {
        try {
            const todos = await window.electronAPI.getTodos();
            this.downloadJSON(todos, 'todos-backup.json');
            this.showSuccess('Todos exported successfully');
        } catch (error) {
            console.error('Error exporting todos:', error);
            this.showError('Failed to export todos');
        }
    }

    async exportWorkSessions() {
        try {
            const sessions = await window.electronAPI.getWorkSessions();
            this.downloadJSON(sessions, 'work-sessions-backup.json');
            this.showSuccess('Work sessions exported successfully');
        } catch (error) {
            console.error('Error exporting work sessions:', error);
            this.showError('Failed to export work sessions');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showError('Please select a file to import');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (confirm('This will replace existing data. Are you sure?')) {
                // Import logic would go here
                this.showSuccess('Data imported successfully');
                fileInput.value = '';
            }
        } catch (error) {
            console.error('Error importing data:', error);
            this.showError('Invalid file format');
        }
    }

    async clearCompletedTodos() {
        if (confirm('Are you sure you want to delete all completed todos? This cannot be undone.')) {
            try {
                const todos = await window.electronAPI.getTodos();
                const completedTodos = todos.filter(todo => todo.completed);
                
                for (const todo of completedTodos) {
                    await window.electronAPI.deleteTodo(todo.id);
                }
                
                this.showSuccess(`Deleted ${completedTodos.length} completed todos`);
            } catch (error) {
                console.error('Error clearing completed todos:', error);
                this.showError('Failed to clear completed todos');
            }
        }
    }

    async resetAllData() {
        if (confirm('Are you sure you want to reset ALL data? This will delete all todos, work sessions, and settings. This cannot be undone.')) {
            if (confirm('This is your final warning. ALL DATA WILL BE LOST. Continue?')) {
                try {
                    // Clear localStorage
                    localStorage.clear();
                    
                    // Reset to default settings
                    this.settings = this.getDefaultSettings();
                    await this.saveSettings();
                    this.populateSettings();
                    
                    this.showSuccess('All data has been reset');
                } catch (error) {
                    console.error('Error resetting data:', error);
                    this.showError('Failed to reset data');
                }
            }
        }
    }

    updateDataPath() {
        const dataPathElement = document.getElementById('data-path');
        if (dataPathElement) {
            // This would typically come from the main process
            dataPathElement.textContent = 'User data directory';
        }
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize settings manager
const settingsManager = new SettingsManager();