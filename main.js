const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, getTodos, addTodo, updateTodo, deleteTodo, getWorkSessions, addWorkSession, updateWorkSession } = require('./src/db/db.js');
const express = require(express);
// Initialize database on app start
initDatabase();

let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icon.png'), // Optional: add app icon
        show: false // Don't show until ready
    });

    // Load the app
    mainWindow.loadFile('src/index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers for Todo operations
ipcMain.handle('get-todos', async () => {
    try {
        return await getTodos();
    } catch (error) {
        console.error('Error getting todos:', error);
        throw error;
    }
});

ipcMain.handle('add-todo', async (event, todoData) => {
    try {
        return await addTodo(todoData);
    } catch (error) {
        console.error('Error adding todo:', error);
        throw error;
    }
});

ipcMain.handle('update-todo', async (event, id, updates) => {
    try {
        return await updateTodo(id, updates);
    } catch (error) {
        console.error('Error updating todo:', error);
        throw error;
    }
});

ipcMain.handle('delete-todo', async (event, id) => {
    try {
        return await deleteTodo(id);
    } catch (error) {
        console.error('Error deleting todo:', error);
        throw error;
    }
});

// IPC handlers for Work Hour operations
ipcMain.handle('get-work-sessions', async () => {
    try {
        return await getWorkSessions();
    } catch (error) {
        console.error('Error getting work sessions:', error);
        throw error;
    }
});

ipcMain.handle('add-work-session', async (event, sessionData) => {
    try {
        return await addWorkSession(sessionData);
    } catch (error) {
        console.error('Error adding work session:', error);
        throw error;
    }
});

ipcMain.handle('update-work-session', async (event, id, updates) => {
    try {
        return await updateWorkSession(id, updates);
    } catch (error) {
        console.error('Error updating work session:', error);
        throw error;
    }
});

// IPC handler for navigation
ipcMain.handle('navigate-to-page', async (event, page) => {
    try {
        if (mainWindow) {
            await mainWindow.loadFile(`src/${page}`);
        }
        return true;
    } catch (error) {
        console.error('Error navigating to page:', error);
        throw error;
    }
});

// Handle app quit events gracefully
app.on('before-quit', () => {
    // Ensure any active work sessions are saved before quitting
    if (mainWindow) {
        mainWindow.webContents.send('app-before-quit');
    }
});
