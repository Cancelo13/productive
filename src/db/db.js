const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const { app } = require('electron');

// Database file path
const dbPath = path.join(app.getPath('userData'), 'productivity-tracker.json');

// Database instance
let db;

// Default data structure
const defaultData = {
    todos: [],
    workSessions: []
};

async function initDatabase() {
    try {
        // Create adapter and database instance
        const adapter = new JSONFile(dbPath);
        db = new Low(adapter, defaultData);

        // Read data from JSON file, this will set db.data content
        await db.read();

        // Ensure required collections exist
        if (!db.data.todos) {
            db.data.todos = [];
        }
        if (!db.data.workSessions) {
            db.data.workSessions = [];
        }

        await db.write();
        console.log('Database initialized successfully at:', dbPath);
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

// Todo operations
async function getTodos() {
    if (!db) throw new Error('Database not initialized');
    await db.read();
    return db.data.todos || [];
}

async function addTodo(todoData) {
    if (!db) throw new Error('Database not initialized');

    const newTodo = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        text: todoData.text,
        priority: todoData.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await db.read();
    db.data.todos.push(newTodo);
    await db.write();

    return newTodo;
}

async function updateTodo(id, updates) {
    if (!db) throw new Error('Database not initialized');

    await db.read();
    const todoIndex = db.data.todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
        throw new Error('Todo not found');
    }

    // Update the todo
    db.data.todos[todoIndex] = {
        ...db.data.todos[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await db.write();
    return db.data.todos[todoIndex];
}

async function deleteTodo(id) {
    if (!db) throw new Error('Database not initialized');

    await db.read();
    const todoIndex = db.data.todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
        throw new Error('Todo not found');
    }

    const deletedTodo = db.data.todos.splice(todoIndex, 1)[0];
    await db.write();

    return deletedTodo;
}

// Work session operations
async function getWorkSessions() {
    if (!db) throw new Error('Database not initialized');
    await db.read();
    return db.data.workSessions || [];
}

async function addWorkSession(sessionData) {
    if (!db) throw new Error('Database not initialized');

    const newSession = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        startTime: sessionData.startTime,
        endTime: sessionData.endTime || null,
        duration: sessionData.duration || 0,
        date: sessionData.date || new Date().toISOString().split('T')[0],
        status: sessionData.status || 'active', // active, paused, completed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await db.read();
    db.data.workSessions.push(newSession);
    await db.write();

    return newSession;
}

async function updateWorkSession(id, updates) {
    if (!db) throw new Error('Database not initialized');

    await db.read();
    const sessionIndex = db.data.workSessions.findIndex(session => session.id === id);

    if (sessionIndex === -1) {
        throw new Error('Work session not found');
    }

    // Update the session
    db.data.workSessions[sessionIndex] = {
        ...db.data.workSessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await db.write();
    return db.data.workSessions[sessionIndex];
}

// Utility functions
async function getTodayWorkSessions() {
    const sessions = await getWorkSessions();
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(session => session.date === today);
}

async function getTodayTodos() {
    const todos = await getTodos();
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(todo => {
        const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
        return todoDate === today;
    });
}

module.exports = {
    initDatabase,
    getTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    getWorkSessions,
    addWorkSession,
    updateWorkSession,
    getTodayWorkSessions,
    getTodayTodos
};
