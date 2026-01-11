// Main renderer process script that coordinates the application
class App {
    constructor() {
        this.todoManager = null;
        this.workHourManager = null;
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Application failed to initialize. Please restart the app.');
        }
    }

    async initializeApp() {
        try {
            // Initialize managers
            this.todoManager = new TodoManager();
            this.workHourManager = new WorkHourManager();

            // Initialize both managers
            await Promise.all([
                this.todoManager.init(),
                this.workHourManager.init()
            ]);

            // Set up tab switching
            this.setupTabSwitching();

            // Set up app quit handler
            this.setupAppQuitHandler();

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load application data. Some features may not work properly.');
        }
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const target = event.target.getAttribute('data-bs-target');
                
                // Refresh data when switching to tabs
                if (target === '#todo-panel' && this.todoManager) {
                    this.todoManager.loadTodos();
                } else if (target === '#workhour-panel' && this.workHourManager) {
                    this.workHourManager.updateDisplay();
                }
            });
        });
    }

    setupAppQuitHandler() {
        if (window.electronAPI && window.electronAPI.onAppBeforeQuit) {
            window.electronAPI.onAppBeforeQuit(() => {
                // Save any active work session before quitting
                if (this.workHourManager && this.workHourManager.isTimerRunning) {
                    this.workHourManager.stopTimer();
                }
            });
        }
    }

    showError(message) {
        // Create and show error toast/modal
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create and show success toast
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// Utility functions
const Utils = {
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    },

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },

    isToday(dateString) {
        const today = new Date().toISOString().split('T')[0];
        const checkDate = new Date(dateString).toISOString().split('T')[0];
        return today === checkDate;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Navigation function for page switching
function navigateToPage(page) {
    if (window.electronAPI && window.electronAPI.navigateToPage) {
        window.electronAPI.navigateToPage(page);
    } else {
        // Fallback for testing
        window.location.href = page;
    }
}

// Make navigation globally available
window.navigateToPage = navigateToPage;

// Initialize app when script loads
const app = new App();

// Make Utils globally available
window.Utils = Utils;
