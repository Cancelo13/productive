class GoalsManager {
    constructor() {
        this.goals = [];
        this.habits = [];
        this.habitLogs = [];
        this.currentStreakMonth = new Date();
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderGoals();
        this.renderHabits();
        this.renderStreakCalendar();
        this.updateAchievements();
        this.updateProgressOverview();
    }

    async loadData() {
        try {
            // Load from localStorage for now (could be moved to database later)
            const savedGoals = localStorage.getItem('goals');
            this.goals = savedGoals ? JSON.parse(savedGoals) : [];

            const savedHabits = localStorage.getItem('habits');
            this.habits = savedHabits ? JSON.parse(savedHabits) : [];

            const savedHabitLogs = localStorage.getItem('habit-logs');
            this.habitLogs = savedHabitLogs ? JSON.parse(savedHabitLogs) : [];
        } catch (error) {
            console.error('Error loading goals data:', error);
            this.goals = [];
            this.habits = [];
            this.habitLogs = [];
        }
    }

    setupEventListeners() {
        // Goal modal save button
        document.getElementById('save-goal').addEventListener('click', () => {
            this.saveGoal();
        });

        // Habit modal save button
        document.getElementById('save-habit').addEventListener('click', () => {
            this.saveHabit();
        });

        // Streak calendar navigation
        document.getElementById('prev-streak-month').addEventListener('click', () => {
            this.currentStreakMonth.setMonth(this.currentStreakMonth.getMonth() - 1);
            this.renderStreakCalendar();
        });

        document.getElementById('next-streak-month').addEventListener('click', () => {
            this.currentStreakMonth.setMonth(this.currentStreakMonth.getMonth() + 1);
            this.renderStreakCalendar();
        });
    }

    renderGoals() {
        const goalsContainer = document.getElementById('goals-container');
        if (!goalsContainer) return;

        if (this.goals.length === 0) {
            goalsContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-bullseye fa-3x mb-3 d-block"></i>
                        <p>No goals set yet. Create your first goal to get started!</p>
                    </div>
                </div>
            `;
            return;
        }

        goalsContainer.innerHTML = this.goals.map(goal => this.renderGoalCard(goal)).join('');
    }

    renderGoalCard(goal) {
        const progress = this.calculateGoalProgress(goal);
        const isOverdue = new Date(goal.deadline) < new Date() && progress < 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 ${isOverdue ? 'border-danger' : ''}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="card-title mb-0">${goal.title}</h6>
                        <span class="badge bg-${this.getCategoryColor(goal.category)}">${goal.category}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-muted small">${goal.description}</p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Progress</small>
                                <small>${progress}%</small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-${isOverdue ? 'danger' : 'primary'}" 
                                     style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                Target: ${goal.target} ${goal.unit}
                            </small>
                            <small class="${isOverdue ? 'text-danger' : daysLeft <= 7 ? 'text-warning' : 'text-muted'}">
                                ${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                            </small>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="goalsManager.updateGoal('${goal.id}')">
                                <i class="fas fa-plus"></i> Update
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="goalsManager.editGoal('${goal.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="goalsManager.deleteGoal('${goal.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHabits() {
        const habitsContainer = document.getElementById('habits-container');
        if (!habitsContainer) return;

        if (this.habits.length === 0) {
            habitsContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-repeat fa-3x mb-3 d-block"></i>
                        <p>No habits tracked yet. Add a habit to start building consistency!</p>
                    </div>
                </div>
            `;
            return;
        }

        habitsContainer.innerHTML = this.habits.map(habit => this.renderHabitCard(habit)).join('');
    }

    renderHabitCard(habit) {
        const todayLog = this.getTodayHabitLog(habit.id);
        const streak = this.calculateHabitStreak(habit.id);
        const weekProgress = this.getWeekHabitProgress(habit.id);

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="card-title mb-0">${habit.name}</h6>
                        <span class="badge bg-${this.getCategoryColor(habit.category)}">${habit.category}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-muted small">${habit.description}</p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>This Week</small>
                                <small>${weekProgress.completed}/${weekProgress.target}</small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" 
                                     style="width: ${(weekProgress.completed / weekProgress.target) * 100}%"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <small class="text-muted d-block">Current Streak</small>
                                <span class="fw-bold text-warning">${streak} days</span>
                            </div>
                            <div>
                                <small class="text-muted d-block">Today</small>
                                <span class="fw-bold ${todayLog ? 'text-success' : 'text-muted'}">
                                    ${todayLog ? todayLog.completed + '/' + habit.target : '0/' + habit.target}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-success btn-sm" onclick="goalsManager.logHabit('${habit.id}', 1)">
                                <i class="fas fa-plus"></i> +1
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="goalsManager.logHabit('${habit.id}', -1)">
                                <i class="fas fa-minus"></i> -1
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="goalsManager.deleteHabit('${habit.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStreakCalendar() {
        const streakCalendar = document.getElementById('streak-calendar');
        const streakMonth = document.getElementById('streak-month');
        
        if (!streakCalendar || !streakMonth) return;

        streakMonth.textContent = this.currentStreakMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        const year = this.currentStreakMonth.getFullYear();
        const month = this.currentStreakMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        streakCalendar.innerHTML = `
            <div class="streak-grid">
                <div class="streak-weekdays">
                    <div class="streak-weekday">S</div>
                    <div class="streak-weekday">M</div>
                    <div class="streak-weekday">T</div>
                    <div class="streak-weekday">W</div>
                    <div class="streak-weekday">T</div>
                    <div class="streak-weekday">F</div>
                    <div class="streak-weekday">S</div>
                </div>
                <div class="streak-days">
                    ${days.map(date => this.renderStreakDay(date, month)).join('')}
                </div>
            </div>
        `;
    }

    renderStreakDay(date, currentMonth) {
        const dateStr = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === currentMonth;
        const dayCompletion = this.getDayHabitCompletion(dateStr);
        
        let classes = 'streak-day';
        if (!isCurrentMonth) classes += ' other-month';
        
        let bgClass = 'bg-light text-dark';
        if (dayCompletion.percentage >= 100) bgClass = 'bg-success text-white';
        else if (dayCompletion.percentage >= 50) bgClass = 'bg-warning text-dark';

        return `
            <div class="${classes}">
                <span class="badge ${bgClass}" title="${dayCompletion.completed}/${dayCompletion.total} habits completed">
                    ${date.getDate()}
                </span>
            </div>
        `;
    }

    updateAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;

        const achievements = this.calculateAchievements();
        
        if (achievements.length === 0) {
            achievementsList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-trophy fa-2x mb-2 d-block"></i>
                    <small>Complete goals and maintain habits to earn achievements!</small>
                </div>
            `;
            return;
        }

        achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement-item mb-2">
                <div class="d-flex align-items-center">
                    <i class="fas fa-${achievement.icon} text-${achievement.color} me-2"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold small">${achievement.name}</div>
                        <div class="text-muted small">${achievement.description}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateProgressOverview() {
        this.updateGoalProgress();
        this.updateHabitConsistency();
    }

    updateGoalProgress() {
        const goalProgressList = document.getElementById('goal-progress-list');
        if (!goalProgressList) return;

        if (this.goals.length === 0) {
            goalProgressList.innerHTML = '<p class="text-muted small">No goals to track</p>';
            return;
        }

        goalProgressList.innerHTML = this.goals.map(goal => {
            const progress = this.calculateGoalProgress(goal);
            return `
                <div class="mb-2">
                    <div class="d-flex justify-content-between mb-1">
                        <small>${goal.title}</small>
                        <small>${progress}%</small>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-primary" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateHabitConsistency() {
        const habitConsistencyList = document.getElementById('habit-consistency-list');
        if (!habitConsistencyList) return;

        if (this.habits.length === 0) {
            habitConsistencyList.innerHTML = '<p class="text-muted small">No habits to track</p>';
            return;
        }

        habitConsistencyList.innerHTML = this.habits.map(habit => {
            const weekProgress = this.getWeekHabitProgress(habit.id);
            const consistency = Math.round((weekProgress.completed / weekProgress.target) * 100);
            return `
                <div class="mb-2">
                    <div class="d-flex justify-content-between mb-1">
                        <small>${habit.name}</small>
                        <small>${consistency}%</small>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-success" style="width: ${consistency}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async saveGoal() {
        const title = document.getElementById('goal-title').value.trim();
        const description = document.getElementById('goal-description').value.trim();
        const target = parseInt(document.getElementById('goal-target').value);
        const unit = document.getElementById('goal-unit').value;
        const category = document.getElementById('goal-category').value;
        const deadline = document.getElementById('goal-deadline').value;

        if (!title || !target || !deadline) {
            alert('Please fill in all required fields');
            return;
        }

        const newGoal = {
            id: this.generateId(),
            title,
            description,
            target,
            unit,
            category,
            deadline,
            currentValue: 0,
            createdAt: new Date().toISOString()
        };

        this.goals.push(newGoal);
        await this.saveData();
        
        bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
        document.getElementById('goal-form').reset();
        
        this.renderGoals();
        this.updateProgressOverview();
    }

    async saveHabit() {
        const name = document.getElementById('habit-name').value.trim();
        const description = document.getElementById('habit-description').value.trim();
        const frequency = document.getElementById('habit-frequency').value;
        const target = parseInt(document.getElementById('habit-target').value);
        const category = document.getElementById('habit-category').value;
        const reminder = document.getElementById('habit-reminder').value;

        if (!name || !target) {
            alert('Please fill in all required fields');
            return;
        }

        const newHabit = {
            id: this.generateId(),
            name,
            description,
            frequency,
            target,
            category,
            reminder,
            createdAt: new Date().toISOString()
        };

        this.habits.push(newHabit);
        await this.saveData();
        
        bootstrap.Modal.getInstance(document.getElementById('habitModal')).hide();
        document.getElementById('habit-form').reset();
        
        this.renderHabits();
        this.updateProgressOverview();
    }

    async logHabit(habitId, change) {
        const today = new Date().toISOString().split('T')[0];
        let log = this.habitLogs.find(l => l.habitId === habitId && l.date === today);
        
        if (!log) {
            log = {
                id: this.generateId(),
                habitId,
                date: today,
                completed: 0,
                target: this.habits.find(h => h.id === habitId).target
            };
            this.habitLogs.push(log);
        }

        log.completed = Math.max(0, Math.min(log.target, log.completed + change));
        
        await this.saveData();
        this.renderHabits();
        this.renderStreakCalendar();
        this.updateProgressOverview();
    }

    async deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            await this.saveData();
            this.renderGoals();
            this.updateProgressOverview();
        }
    }

    async deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.habitLogs = this.habitLogs.filter(l => l.habitId !== habitId);
            await this.saveData();
            this.renderHabits();
            this.renderStreakCalendar();
            this.updateProgressOverview();
        }
    }

    async saveData() {
        try {
            localStorage.setItem('goals', JSON.stringify(this.goals));
            localStorage.setItem('habits', JSON.stringify(this.habits));
            localStorage.setItem('habit-logs', JSON.stringify(this.habitLogs));
        } catch (error) {
            console.error('Error saving goals data:', error);
        }
    }

    // Utility methods
    calculateGoalProgress(goal) {
        // This would integrate with actual todo/work session data
        // For now, using mock progress based on time elapsed
        const now = new Date();
        const created = new Date(goal.createdAt);
        const deadline = new Date(goal.deadline);
        const totalTime = deadline - created;
        const elapsedTime = now - created;
        const timeProgress = Math.min(100, (elapsedTime / totalTime) * 100);
        
        // Mock progress - in real app, this would track actual completion
        return Math.min(100, Math.round(timeProgress * 0.8));
    }

    getTodayHabitLog(habitId) {
        const today = new Date().toISOString().split('T')[0];
        return this.habitLogs.find(l => l.habitId === habitId && l.date === today);
    }

    calculateHabitStreak(habitId) {
        const logs = this.habitLogs
            .filter(l => l.habitId === habitId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        let streak = 0;
        let currentDate = new Date();
        
        for (const log of logs) {
            const logDate = new Date(log.date);
            const daysDiff = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak && log.completed >= log.target) {
                streak++;
                currentDate = logDate;
            } else {
                break;
            }
        }

        return streak;
    }

    getWeekHabitProgress(habitId) {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekLogs = this.habitLogs.filter(l => {
            const logDate = new Date(l.date);
            return l.habitId === habitId && logDate >= weekStart && logDate <= weekEnd;
        });

        const habit = this.habits.find(h => h.id === habitId);
        const completed = weekLogs.reduce((sum, log) => sum + (log.completed >= log.target ? 1 : 0), 0);
        
        return {
            completed,
            target: 7 // Daily habits have 7 targets per week
        };
    }

    getDayHabitCompletion(dateStr) {
        const dayLogs = this.habitLogs.filter(l => l.date === dateStr);
        const completed = dayLogs.filter(l => l.completed >= l.target).length;
        const total = this.habits.length;
        
        return {
            completed,
            total,
            percentage: total > 0 ? (completed / total) * 100 : 0
        };
    }

    calculateAchievements() {
        const achievements = [];
        
        // Goal completion achievements
        const completedGoals = this.goals.filter(g => this.calculateGoalProgress(g) >= 100);
        if (completedGoals.length >= 1) {
            achievements.push({
                name: 'Goal Achiever',
                description: 'Completed your first goal',
                icon: 'trophy',
                color: 'warning'
            });
        }

        // Habit streak achievements
        const maxStreak = Math.max(...this.habits.map(h => this.calculateHabitStreak(h.id)), 0);
        if (maxStreak >= 7) {
            achievements.push({
                name: 'Week Warrior',
                description: '7-day habit streak',
                icon: 'fire',
                color: 'danger'
            });
        }

        return achievements;
    }

    getCategoryColor(category) {
        const colors = {
            productivity: 'primary',
            health: 'success',
            learning: 'info',
            personal: 'warning'
        };
        return colors[category] || 'secondary';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize goals manager
const goalsManager = new GoalsManager();