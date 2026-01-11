const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Todo operations
    getTodos: () => ipcRenderer.invoke('get-todos'),
    addTodo: (todoData) => ipcRenderer.invoke('add-todo', todoData),
    updateTodo: (id, updates) => ipcRenderer.invoke('update-todo', id, updates),
    deleteTodo: (id) => ipcRenderer.invoke('delete-todo', id),

    // Work session operations
    getWorkSessions: () => ipcRenderer.invoke('get-work-sessions'),
    addWorkSession: (sessionData) => ipcRenderer.invoke('add-work-session', sessionData),
    updateWorkSession: (id, updates) => ipcRenderer.invoke('update-work-session', id, updates),

    // App events
    onAppBeforeQuit: (callback) => ipcRenderer.on('app-before-quit', callback),

    // Navigation
    navigateToPage: (page) => ipcRenderer.invoke('navigate-to-page', page)
});

// DOM Content Loaded handler
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded successfully');
});
