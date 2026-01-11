class ReportsManager {
    constructor() {
        this.currentPeriod = 7;
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderReports();
    }

    async loadData() {
        try {
            this.todos = await window.electronAPI.getTodos();
            this.workSessions = await window.electronAPI.getWorkSessions();
        } catch (error) {
            console.error('Error loading data:', error);
            this.todos = [];
            this.workSessions = [];
        }
    }

    setupEventListeners() {
        // Period selector buttons
        const periodButtons = document.querySelectorAll('[data-period]');
        periodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                periodButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = parseInt(e.target.getAttribute('data-period'));
                this.renderReports();
            });
        });

        // Export report button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    renderReports() {
        this.updateSummaryCards();
        this.renderHoursChart();
        this.renderPriorityChart();
        this.updateWeeklyStats();
        this.updateGoalsProgress();
        this.renderActivityTimeline();
    }

    getFilteredData() {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (this.currentPeriod * 24 * 60 * 60 * 1000));

        const filteredTodos = this.todos.filter(todo => {
            const todoDate = new Date(todo.createdAt);
            return todoDate >= startDate && todoDate <= endDate;
        });

        const filteredSessions = this.workSessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= startDate && sessionDate <= endDate;
        });

        return { todos: filteredTodos, sessions: filteredSessions };
    }

    updateSummaryCards() {
        const { todos, sessions } = this.getFilteredData();

        // Total work hours
        const totalSeconds = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        document.getElementById('total-hours').textContent = `${hours}h ${minutes}m`;

        // Completed tasks
        const completedTasks = todos.filter(todo => todo.completed).length;
        document.getElementById('completed-tasks').textContent = completedTasks.toString();

        // Work sessions count
        document.getElementById('work-sessions').textContent = sessions.length.toString();

        // Average session duration
        const avgDuration = sessions.length > 0 ? Math.floor(totalSeconds / sessions.length / 60) : 0;
        document.getElementById('avg-session').textContent = `Avg: ${avgDuration}min`;

        // Productivity score (based on completed tasks vs total tasks)
        const productivityScore = todos.length > 0 ? Math.round((completedTasks / todos.length) * 100) : 0;
        document.getElementById('productivity-score').textContent = `${productivityScore}%`;
    }

    renderHoursChart() {
        const ctx = document.getElementById('hoursChart');
        if (!ctx) return;

        if (this.charts.hours) {
            this.charts.hours.destroy();
        }

        const { sessions } = this.getFilteredData();
        const dailyHours = this.getDailyHours(sessions);

        this.charts.hours = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyHours.map(d => d.date),
                datasets: [{
                    label: 'Work Hours',
                    data: dailyHours.map(d => d.hours),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        if (this.charts.priority) {
            this.charts.priority.destroy();
        }

        const { todos } = this.getFilteredData();
        const priorityCounts = {
            high: todos.filter(t => t.priority === 'high').length,
            medium: todos.filter(t => t.priority === 'medium').length,
            low: todos.filter(t => t.priority === 'low').length
        };

        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                    backgroundColor: ['#dc3545', '#ffc107', '#198754']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getDailyHours(sessions) {
        const dailyData = {};
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (this.currentPeriod * 24 * 60 * 60 * 1000));

        // Initialize all days with 0 hours
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = 0;
        }

        // Add session data
        sessions.forEach(session => {
            const dateStr = session.date || new Date(session.startTime).toISOString().split('T')[0];
            if (dailyData.hasOwnProperty(dateStr)) {
                dailyData[dateStr] += (session.duration || 0) / 3600; // Convert to hours
            }
        });

        return Object.entries(dailyData).map(([date, hours]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hours: Math.round(hours * 100) / 100
        }));
    }

    updateWeeklyStats() {
        const { todos, sessions } = this.getFilteredData();
        const weeklyStatsElement = document.getElementById('weekly-stats');
        if (!weeklyStatsElement) return;

        const weeklyData = this.getWeeklyData(todos, sessions);
        
        weeklyStatsElement.innerHTML = weeklyData.map(day => `
            <tr>
                <td>${day.name}</td>
                <td>${day.hours}h</td>
                <td>${day.tasks}</td>
                <td>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" style="width: ${day.efficiency}%"></div>
                    </div>
                    <small>${day.efficiency}%</small>
                </td>
            </tr>
        `).join('');
    }

    getWeeklyData(todos, sessions) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weekData = days.map(name => ({ name, hours: 0, tasks: 0, efficiency: 0 }));

        // Calculate daily data
        sessions.forEach(session => {
            const dayIndex = new Date(session.startTime).getDay();
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Adjust for Monday start
            weekData[adjustedIndex].hours += (session.duration || 0) / 3600;
        });

        todos.forEach(todo => {
            const dayIndex = new Date(todo.createdAt).getDay();
            const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            weekData[adjustedIndex].tasks++;
        });

        // Calculate efficiency (arbitrary formula: tasks/hour * 10, capped at 100)
        weekData.forEach(day => {
            day.hours = Math.round(day.hours * 10) / 10;
            day.efficiency = day.hours > 0 ? Math.min(100, Math.round((day.tasks / day.hours) * 10)) : 0;
        });

        return weekData;
    }

    updateGoalsProgress() {
        // Mock goal progress - in a real app, this would come from a goals system
        const hourGoalProgress = document.getElementById('hour-goal-progress');
        const taskCompletionProgress = document.getElementById('task-completion-progress');
        const consistencyStreak = document.getElementById('consistency-streak');

        if (hourGoalProgress) {
            const { sessions } = this.getFilteredData();
            const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
            const dailyGoal = 8; // 8 hours per day
            const targetHours = dailyGoal * this.currentPeriod;
            const progress = Math.min(100, Math.round((totalHours / targetHours) * 100));
            hourGoalProgress.textContent = `${progress}%`;
            hourGoalProgress.parentElement.querySelector('.progress-bar').style.width = `${progress}%`;
        }

        if (taskCompletionProgress) {
            const { todos } = this.getFilteredData();
            const completed = todos.filter(t => t.completed).length;
            const total = todos.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            taskCompletionProgress.textContent = `${progress}%`;
            taskCompletionProgress.parentElement.querySelector('.progress-bar').style.width = `${progress}%`;
        }

        if (consistencyStreak) {
            const streak = this.calculateConsistencyStreak();
            consistencyStreak.textContent = `${streak} days`;
        }
    }

    calculateConsistencyStreak() {
        const { sessions } = this.getFilteredData();
        if (sessions.length === 0) return 0;

        const dailyActivity = {};
        sessions.forEach(session => {
            const date = session.date || new Date(session.startTime).toISOString().split('T')[0];
            dailyActivity[date] = true;
        });

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < this.currentPeriod; i++) {
            const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = checkDate.toISOString().split('T')[0];
            if (dailyActivity[dateStr]) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    renderActivityTimeline() {
        const timelineElement = document.getElementById('activity-timeline');
        if (!timelineElement) return;

        const { todos, sessions } = this.getFilteredData();
        const activities = [];

        // Add todo activities
        todos.forEach(todo => {
            activities.push({
                type: 'todo',
                action: todo.completed ? 'completed' : 'created',
                text: todo.text,
                time: new Date(todo.completed ? todo.updatedAt : todo.createdAt),
                priority: todo.priority
            });
        });

        // Add session activities
        sessions.forEach(session => {
            if (session.endTime) {
                activities.push({
                    type: 'session',
                    action: 'completed',
                    text: `Work session (${Math.round((session.duration || 0) / 60)} minutes)`,
                    time: new Date(session.endTime)
                });
            }
        });

        // Sort by time (most recent first)
        activities.sort((a, b) => b.time - a.time);

        // Take only the most recent 10 activities
        const recentActivities = activities.slice(0, 10);

        timelineElement.innerHTML = recentActivities.length > 0 ? 
            recentActivities.map(activity => this.renderActivityItem(activity)).join('') :
            '<div class="text-center text-muted py-3"><i class="fas fa-history fa-2x mb-2 d-block"></i><small>No recent activity</small></div>';
    }

    renderActivityItem(activity) {
        const iconClass = activity.type === 'todo' ? 
            (activity.action === 'completed' ? 'fa-check-circle text-success' : 'fa-plus-circle text-primary') :
            'fa-clock text-info';

        const timeAgo = this.getTimeAgo(activity.time);

        return `
            <div class="d-flex align-items-start mb-3">
                <div class="flex-shrink-0">
                    <i class="fas ${iconClass} fa-lg"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <div class="fw-bold small">
                        ${activity.action === 'completed' ? 'Completed' : 
                          activity.action === 'created' ? 'Created' : 'Finished'} 
                        ${activity.type === 'todo' ? 'task' : 'work session'}
                    </div>
                    <div class="text-muted small">${activity.text}</div>
                    <div class="text-muted small">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    exportReport() {
        const { todos, sessions } = this.getFilteredData();
        
        const reportData = {
            period: `Last ${this.currentPeriod} days`,
            generatedAt: new Date().toISOString(),
            summary: {
                totalHours: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600,
                completedTasks: todos.filter(t => t.completed).length,
                totalTasks: todos.length,
                workSessions: sessions.length
            },
            todos: todos,
            workSessions: sessions
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize reports manager
const reportsManager = new ReportsManager();