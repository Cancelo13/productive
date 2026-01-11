class TodoManager {
    constructor() {
        this.todos = [];
        this.setupEventListeners();
    }

    async init() {
        await this.loadTodos();
    }

    setupEventListeners() {
        // Todo form submission
        const todoForm = document.getElementById('todo-form');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
        }
    }

    async loadTodos() {
        try {
            this.todos = await window.electronAPI.getTodos();
            this.renderTodos();
            this.updateTodoCount();
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('Failed to load tasks. Please try again.');
        }
    }

    async handleAddTodo(event) {
        event.preventDefault();
        
        const todoInput = document.getElementById('todo-input');
        const prioritySelect = document.getElementById('todo-priority');
        
        const text = todoInput.value.trim();
        const priority = prioritySelect.value;

        if (!text) {
            this.showError('Please enter a task description.');
            return;
        }

        try {
            const newTodo = await window.electronAPI.addTodo({
                text: text,
                priority: priority
            });

            this.todos.push(newTodo);
            this.renderTodos();
            this.updateTodoCount();
            
            // Clear form
            todoInput.value = '';
            prioritySelect.value = 'medium';
            
            this.showSuccess('Task added successfully!');
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showError('Failed to add task. Please try again.');
        }
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
            
            this.renderTodos();
            this.updateTodoCount();
        } catch (error) {
            console.error('Error toggling todo:', error);
            this.showError('Failed to update task status.');
        }
    }

    async updateTodoText(id, newText) {
        if (!newText.trim()) {
            this.showError('Task description cannot be empty.');
            return;
        }

        try {
            const updatedTodo = await window.electronAPI.updateTodo(id, {
                text: newText.trim()
            });

            // Update local copy
            const index = this.todos.findIndex(t => t.id === id);
            this.todos[index] = updatedTodo;
            
            this.renderTodos();
            this.showSuccess('Task updated successfully!');
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showError('Failed to update task.');
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await window.electronAPI.deleteTodo(id);
            
            // Remove from local copy
            this.todos = this.todos.filter(t => t.id !== id);
            
            this.renderTodos();
            this.updateTodoCount();
            this.showSuccess('Task deleted successfully!');
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('Failed to delete task.');
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todo-list');
        const emptyState = document.getElementById('empty-todo-state');
        
        if (!todoList) return;

        if (this.todos.length === 0) {
            emptyState.style.display = 'block';
            todoList.innerHTML = '<div class="text-center text-muted py-4" id="empty-todo-state"><i class="fas fa-clipboard-list fa-3x mb-3"></i><p class="mb-0">No tasks yet. Add your first task above!</p></div>';
            return;
        }

        emptyState.style.display = 'none';

        // Sort todos: incomplete first, then by priority, then by creation date
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }
            
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        todoList.innerHTML = sortedTodos.map(todo => this.renderTodoItem(todo)).join('');
    }

    renderTodoItem(todo) {
        const priorityClasses = {
            high: 'border-danger',
            medium: 'border-warning',
            low: 'border-success'
        };

        const priorityIcons = {
            high: 'fas fa-exclamation-triangle text-danger',
            medium: 'fas fa-minus-circle text-warning',
            low: 'fas fa-info-circle text-success'
        };

        return `
            <div class="todo-item mb-3 ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="card ${priorityClasses[todo.priority]} border-start border-3">
                    <div class="card-body py-2">
                        <div class="d-flex align-items-center">
                            <div class="form-check me-3">
                                <input class="form-check-input" type="checkbox" ${todo.completed ? 'checked' : ''} 
                                       onchange="window.todoManager.toggleTodo('${todo.id}')">
                            </div>
                            <div class="flex-grow-1">
                                <div class="todo-text ${todo.completed ? 'text-decoration-line-through text-muted' : ''}" 
                                     ondblclick="this.nextElementSibling.style.display='block'; this.style.display='none'; this.nextElementSibling.querySelector('input').focus();">
                                    ${this.escapeHtml(todo.text)}
                                </div>
                                <div class="todo-edit" style="display: none;">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="${this.escapeHtml(todo.text)}" 
                                               onblur="this.parentElement.parentElement.style.display='none'; this.parentElement.parentElement.previousElementSibling.style.display='block';"
                                               onkeydown="if(event.key==='Enter'){window.todoManager.updateTodoText('${todo.id}', this.value);} else if(event.key==='Escape'){this.blur();}">
                                        <button class="btn btn-outline-primary btn-sm" type="button" 
                                                onclick="window.todoManager.updateTodoText('${todo.id}', this.previousElementSibling.value);">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="${priorityIcons[todo.priority]} me-2" title="${todo.priority} priority"></i>
                                <small class="text-muted me-3">${this.formatRelativeTime(todo.createdAt)}</small>
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="window.todoManager.deleteTodo('${todo.id}')"
                                        title="Delete task">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateTodoCount() {
        const todoCount = document.getElementById('todo-count');
        if (todoCount) {
            const total = this.todos.length;
            const completed = this.todos.filter(t => t.completed).length;
            const pending = total - completed;
            
            if (total === 0) {
                todoCount.textContent = '0 tasks';
            } else {
                todoCount.textContent = `${pending} pending, ${completed} completed`;
            }
        }
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

// Initialize TodoManager and make it globally available
window.todoManager = new TodoManager();
