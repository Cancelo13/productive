class WorkHourManager {
    constructor() {
        this.currentSession = null;
        this.isTimerRunning = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.currentSeconds = 0;
        this.sessions = [];
        this.setupEventListeners();
    }

    async init() {
        await this.loadWorkSessions();
        this.updateDisplay();
        this.restoreActiveSession();
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const stopBtn = document.getElementById('stop-timer');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTimer());
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseTimer());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTimer());
        }
    }

    async loadWorkSessions() {
        try {
            this.sessions = await window.electronAPI.getWorkSessions();
        } catch (error) {
            console.error('Error loading work sessions:', error);
            this.showError('Failed to load work sessions.');
        }
    }

    async restoreActiveSession() {
        // Check if there's an active session from a previous app run
        const today = new Date().toISOString().split('T')[0];
        const activeSession = this.sessions.find(s => 
            s.date === today && 
            s.status === 'active' && 
            !s.endTime
        );

        if (activeSession) {
            this.currentSession = activeSession;
            const now = new Date();
            const startTime = new Date(activeSession.startTime);
            this.currentSeconds = Math.floor((now - startTime) / 1000);
            
            // Resume timer
            this.isTimerRunning = true;
            this.startTimerInterval();
            this.updateTimerControls();
            this.updateSessionStatus('Resumed previous session');
        }
    }

    async startTimer() {
        try {
            if (this.isPaused && this.currentSession) {
                // Resume paused session
                this.isPaused = false;
                this.isTimerRunning = true;
                this.startTimerInterval();
                this.updateTimerControls();
                this.updateSessionStatus('Session resumed');
                return;
            }

            // Start new session
            const sessionData = {
                startTime: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                status: 'active'
            };

            this.currentSession = await window.electronAPI.addWorkSession(sessionData);
            this.sessions.push(this.currentSession);
            
            this.currentSeconds = 0;
            this.isTimerRunning = true;
            this.isPaused = false;
            
            this.startTimerInterval();
            this.updateTimerControls();
            this.updateSessionStatus('Work session started');
            this.updateDisplay();
            
        } catch (error) {
            console.error('Error starting timer:', error);
            this.showError('Failed to start work session.');
        }
    }

    async pauseTimer() {
        if (!this.isTimerRunning || !this.currentSession) return;

        try {
            this.isPaused = true;
            this.isTimerRunning = false;
            this.stopTimerInterval();

            // Update session status
            await window.electronAPI.updateWorkSession(this.currentSession.id, {
                status: 'paused',
                duration: this.currentSeconds
            });

            this.updateTimerControls();
            this.updateSessionStatus('Session paused');
            
        } catch (error) {
            console.error('Error pausing timer:', error);
            this.showError('Failed to pause work session.');
        }
    }

    async stopTimer() {
        if (!this.currentSession) return;

        try {
            this.isTimerRunning = false;
            this.isPaused = false;
            this.stopTimerInterval();

            // Update session with end time
            const updatedSession = await window.electronAPI.updateWorkSession(this.currentSession.id, {
                endTime: new Date().toISOString(),
                duration: this.currentSeconds,
                status: 'completed'
            });

            // Update local session data
            const sessionIndex = this.sessions.findIndex(s => s.id === this.currentSession.id);
            if (sessionIndex !== -1) {
                this.sessions[sessionIndex] = updatedSession;
            }

            this.currentSession = null;
            this.currentSeconds = 0;
            
            this.updateTimerDisplay();
            this.updateTimerControls();
            this.updateSessionStatus('Session completed');
            this.updateDisplay();
            
            this.showSuccess(`Work session completed! Duration: ${this.formatTime(updatedSession.duration)}`);
            
        } catch (error) {
            console.error('Error stopping timer:', error);
            this.showError('Failed to stop work session.');
        }
    }

    startTimerInterval() {
        this.timerInterval = setInterval(() => {
            this.currentSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimerInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.currentSeconds);
        }
    }

    updateTimerControls() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const stopBtn = document.getElementById('stop-timer');

        if (this.isTimerRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Running...';
        } else if (this.isPaused && this.currentSession) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Start Work';
        }
    }

    updateSessionStatus(message) {
        const statusElement = document.getElementById('session-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateDisplay() {
        this.updateDailySummary();
        this.renderWorkSessions();
    }

    updateDailySummary() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.sessions.filter(s => s.date === today && s.status === 'completed');
        
        // Calculate total time for today
        const totalSeconds = todaySessions.reduce((total, session) => total + (session.duration || 0), 0);
        
        // Update display elements
        const dailyTotalElement = document.getElementById('daily-total');
        const sessionCountElement = document.getElementById('session-count');
        const avgSessionElement = document.getElementById('avg-session');

        if (dailyTotalElement) {
            dailyTotalElement.textContent = this.formatTime(totalSeconds);
        }

        if (sessionCountElement) {
            sessionCountElement.textContent = todaySessions.length.toString();
        }

        if (avgSessionElement) {
            const avgSeconds = todaySessions.length > 0 ? Math.floor(totalSeconds / todaySessions.length) : 0;
            avgSessionElement.textContent = this.formatTime(avgSeconds);
        }
    }

    renderWorkSessions() {
        const sessionsList = document.getElementById('work-sessions-list');
        const emptyState = document.getElementById('empty-sessions-state');
        
        if (!sessionsList) return;

        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.sessions
            .filter(s => s.date === today)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        if (todaySessions.length === 0) {
            emptyState.style.display = 'block';
            sessionsList.innerHTML = '<div class="text-center text-muted py-4" id="empty-sessions-state"><i class="fas fa-clock fa-3x mb-3"></i><p class="mb-0">No work sessions recorded today</p></div>';
            return;
        }

        emptyState.style.display = 'none';
        sessionsList.innerHTML = todaySessions.map(session => this.renderSessionItem(session)).join('');
    }

    renderSessionItem(session) {
        const startTime = new Date(session.startTime);
        const endTime = session.endTime ? new Date(session.endTime) : null;
        const duration = session.duration || 0;
        
        const statusBadge = {
            active: '<span class="badge bg-success">Active</span>',
            paused: '<span class="badge bg-warning">Paused</span>',
            completed: '<span class="badge bg-primary">Completed</span>'
        };

        return `
            <div class="work-session-item mb-2 ${session.status === 'active' ? 'border-success' : ''}">
                <div class="card ${session.status === 'active' ? 'border-success' : ''}">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${this.formatTime(duration)}</strong>
                                <small class="text-muted ms-2">
                                    ${this.formatTime12Hour(startTime)} 
                                    ${endTime ? '- ' + this.formatTime12Hour(endTime) : '(ongoing)'}
                                </small>
                            </div>
                            <div>
                                ${statusBadge[session.status] || statusBadge.completed}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatTime12Hour(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    showError(message) {
        if (window.app) {
            window.app.showError(message);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (window.app) {
            window.app.showSuccess(message);
        }
    }
}

// Initialize WorkHourManager and make it globally available
window.workHourManager = new WorkHourManager();
