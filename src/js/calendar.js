class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.viewMode = 'month';
        this.todos = [];
        this.workSessions = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateSidebar();
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
        // Navigation buttons
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
            this.updateSidebar();
        });

        // View mode toggles
        document.getElementById('month-view').addEventListener('change', () => {
            this.viewMode = 'month';
            this.renderCalendar();
        });

        document.getElementById('week-view').addEventListener('change', () => {
            this.viewMode = 'week';
            this.renderCalendar();
        });

        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            document.getElementById('task-date').value = this.selectedDate.toISOString().split('T')[0];
            new bootstrap.Modal(document.getElementById('taskModal')).show();
        });

        // Save task button
        document.getElementById('save-task').addEventListener('click', () => {
            this.saveTask();
        });
    }

    renderCalendar() {
        this.updateCurrentMonthDisplay();
        
        if (this.viewMode === 'month') {
            this.renderMonthView();
            document.getElementById('month-calendar').classList.remove('d-none');
            document.getElementById('week-calendar').classList.add('d-none');
        } else {
            this.renderWeekView();
            document.getElementById('month-calendar').classList.add('d-none');
            document.getElementById('week-calendar').classList.remove('d-none');
        }
    }

    updateCurrentMonthDisplay() {
        const monthElement = document.getElementById('current-month');
        if (monthElement) {
            monthElement.textContent = this.currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }
    }

    renderMonthView() {
        const calendarDays = document.getElementById('calendar-days');
        if (!calendarDays) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarDays.innerHTML = days.map(date => this.renderCalendarDay(date, month)).join('');

        // Add click event listeners to calendar days
        calendarDays.querySelectorAll('.calendar-day').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const dateStr = dayElement.getAttribute('data-date');
                this.selectedDate = new Date(dateStr);
                this.updateSelectedDay();
                this.updateSidebar();
            });
        });
    }

    renderCalendarDay(date, currentMonth) {
        const dateStr = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = this.isToday(date);
        const isSelected = this.isSameDate(date, this.selectedDate);
        
        const dayData = this.getDayData(dateStr);
        const hasActivity = dayData.todos.length > 0 || dayData.sessions.length > 0;

        let classes = 'calendar-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (hasActivity) classes += ' has-activity';

        return `
            <div class="${classes}" data-date="${dateStr}">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-indicators">
                    ${dayData.todos.length > 0 ? `<span class="indicator tasks" title="${dayData.todos.length} tasks">${dayData.todos.length}</span>` : ''}
                    ${dayData.workHours > 0 ? `<span class="indicator hours" title="${dayData.workHours}h worked">${dayData.workHours}h</span>` : ''}
                </div>
            </div>
        `;
    }

    renderWeekView() {
        const weekHeader = document.getElementById('week-header');
        const weekBody = document.getElementById('week-body');
        if (!weekHeader || !weekBody) return;

        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            weekDays.push(day);
        }

        // Render week header
        weekHeader.innerHTML = weekDays.map(date => `
            <div class="week-day-header ${this.isToday(date) ? 'today' : ''}">
                <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
        `).join('');

        // Render week body with hourly slots
        const hours = Array.from({ length: 24 }, (_, i) => i);
        weekBody.innerHTML = hours.map(hour => `
            <div class="week-hour-row">
                <div class="hour-label">${this.formatHour(hour)}</div>
                ${weekDays.map(date => {
                    const sessionInHour = this.getSessionInHour(date, hour);
                    return `
                        <div class="week-hour-cell" data-date="${date.toISOString().split('T')[0]}" data-hour="${hour}">
                            ${sessionInHour ? `<div class="session-block">${sessionInHour.duration}m</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');
    }

    getDayData(dateStr) {
        const dayTodos = this.todos.filter(todo => {
            const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
            return todoDate === dateStr;
        });

        const daySessions = this.workSessions.filter(session => {
            const sessionDate = session.date || new Date(session.startTime).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });

        const workHours = Math.round(
            daySessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 3600
        );

        return {
            todos: dayTodos,
            sessions: daySessions,
            workHours
        };
    }

    getSessionInHour(date, hour) {
        const dateStr = date.toISOString().split('T')[0];
        const sessions = this.workSessions.filter(session => {
            const sessionDate = session.date || new Date(session.startTime).toISOString().split('T')[0];
            if (sessionDate !== dateStr) return false;
            
            const sessionHour = new Date(session.startTime).getHours();
            return sessionHour === hour;
        });

        return sessions.length > 0 ? {
            duration: Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60)
        } : null;
    }

    updateSelectedDay() {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
        const selectedElement = document.querySelector(`[data-date="${selectedDateStr}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
    }

    updateSidebar() {
        this.updateSelectedDateInfo();
        this.updateDayTasks();
        this.updateDaySessions();
        this.updateMonthlySummary();
    }

    updateSelectedDateInfo() {
        const selectedDateElement = document.getElementById('selected-date');
        if (selectedDateElement) {
            selectedDateElement.textContent = this.selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }

        const dateStr = this.selectedDate.toISOString().split('T')[0];
        const dayData = this.getDayData(dateStr);

        // Update day statistics
        document.getElementById('day-hours').textContent = dayData.workHours > 0 ? 
            `${dayData.workHours}h ${Math.round(((dayData.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) % 3600) / 60))}m` : '0h 0m';

        const completedTasks = dayData.todos.filter(t => t.completed).length;
        document.getElementById('day-tasks').textContent = `${completedTasks}/${dayData.todos.length}`;

        const efficiency = dayData.todos.length > 0 ? Math.round((completedTasks / dayData.todos.length) * 100) : 0;
        document.getElementById('day-efficiency').textContent = `${efficiency}%`;
    }

    updateDayTasks() {
        const tasksListElement = document.getElementById('day-tasks-list');
        if (!tasksListElement) return;

        const dateStr = this.selectedDate.toISOString().split('T')[0];
        const dayTodos = this.todos.filter(todo => {
            const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
            return todoDate === dateStr;
        });

        if (dayTodos.length === 0) {
            tasksListElement.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-clipboard-list fa-2x mb-2 d-block"></i>
                    <small>No tasks for this day</small>
                </div>
            `;
            return;
        }

        tasksListElement.innerHTML = dayTodos.map(todo => `
            <div class="task-item mb-2 ${todo.completed ? 'completed' : ''}">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-2" ${todo.completed ? 'checked' : ''} 
                           onchange="calendarManager.toggleTodo('${todo.id}')">
                    <span class="flex-grow-1 ${todo.completed ? 'text-decoration-line-through text-muted' : ''}">${todo.text}</span>
                    <span class="badge bg-${this.getPriorityColor(todo.priority)} ms-2">${todo.priority}</span>
                </div>
            </div>
        `).join('');
    }

    updateDaySessions() {
        const sessionsListElement = document.getElementById('day-sessions-list');
        if (!sessionsListElement) return;

        const dateStr = this.selectedDate.toISOString().split('T')[0];
        const daySessions = this.workSessions.filter(session => {
            const sessionDate = session.date || new Date(session.startTime).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });

        if (daySessions.length === 0) {
            sessionsListElement.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-clock fa-2x mb-2 d-block"></i>
                    <small>No work sessions</small>
                </div>
            `;
            return;
        }

        sessionsListElement.innerHTML = daySessions.map(session => `
            <div class="session-item mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${Math.round((session.duration || 0) / 60)} minutes</div>
                        <small class="text-muted">
                            ${new Date(session.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            ${session.endTime ? ' - ' + new Date(session.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                        </small>
                    </div>
                    <span class="badge bg-${this.getStatusColor(session.status)}">${session.status}</span>
                </div>
            </div>
        `).join('');
    }

    updateMonthlySummary() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthSessions = this.workSessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
        });

        const monthTodos = this.todos.filter(todo => {
            const todoDate = new Date(todo.createdAt);
            return todoDate.getFullYear() === year && todoDate.getMonth() === month;
        });

        // Total hours
        const totalSeconds = monthSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        document.getElementById('month-total-hours').textContent = `${hours}h ${minutes}m`;

        // Progress bars (arbitrary targets for demonstration)
        const hoursTarget = 160; // 160 hours per month target
        const hoursProgress = Math.min(100, (totalSeconds / 3600 / hoursTarget) * 100);
        document.getElementById('month-hours-progress').style.width = `${hoursProgress}%`;

        // Completed tasks
        const completedTasks = monthTodos.filter(t => t.completed).length;
        document.getElementById('month-completed-tasks').textContent = completedTasks.toString();
        
        const tasksTarget = 100; // 100 tasks per month target
        const tasksProgress = Math.min(100, (completedTasks / tasksTarget) * 100);
        document.getElementById('month-tasks-progress').style.width = `${tasksProgress}%`;

        // Active days
        const activeDays = new Set(monthSessions.map(s => s.date || new Date(s.startTime).toISOString().split('T')[0])).size;
        document.getElementById('month-active-days').textContent = activeDays.toString();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const activeProgress = (activeDays / daysInMonth) * 100;
        document.getElementById('month-active-progress').style.width = `${activeProgress}%`;
    }

    async toggleTodo(id) {
        try {
            const todo = this.todos.find(t => t.id === id);
            if (!todo) return;

            const updatedTodo = await window.electronAPI.updateTodo(id, {
                completed: !todo.completed
            });

            // Update local copy
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.updateSidebar();
            this.renderCalendar(); // Re-render to update indicators
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    }

    async saveTask() {
        const taskText = document.getElementById('task-text').value.trim();
        const taskPriority = document.getElementById('task-priority').value;
        const taskDate = document.getElementById('task-date').value;

        if (!taskText) {
            alert('Please enter a task description');
            return;
        }

        try {
            const newTodo = await window.electronAPI.addTodo({
                text: taskText,
                priority: taskPriority
            });

            this.todos.push(newTodo);
            
            // Close modal and clear form
            bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
            document.getElementById('task-form').reset();
            
            this.updateSidebar();
            this.renderCalendar();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task');
        }
    }

    // Utility methods
    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = result.getDate() - day; // Monday as first day
        result.setDate(diff);
        return result;
    }

    formatHour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour} ${period}`;
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'secondary';
        }
    }

    getStatusColor(status) {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'completed': return 'primary';
            default: return 'secondary';
        }
    }
}

// Initialize calendar manager
const calendarManager = new CalendarManager();