import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import { registerApiHandlers } from "./api";
import { spawn } from "child_process";

const isDev = process.env.NODE_ENV === "development";

declare const __dirname: string;

function getAppRoot() {
  return isDev ? process.cwd() : app.getAppPath();
}
let serverProcess: any;
const API_PORT = 5000;

function startServer() {
  return new Promise<void>((resolve, reject) => {
    console.log("Skipping HTTP server - using IPC for Electron app");
    resolve();
  });
}

async function createWindow() {
  const appRoot = getAppRoot();
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Productivity Pro',
    frame: false, // Remove toolbar/window frame but keep controls
    titleBarStyle: 'hiddenInset', // Alternative for macOS if needed
    webPreferences: {
      preload: path.join(appRoot, "dist", "electron", "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(appRoot, "dist", "public", "icon.ico"),
  });

  // Always load from the built renderer index.html
  const indexHtml = path.join(appRoot, "dist", "public", "index.html");
  console.log("Loading index.html from:", indexHtml);
  console.log("appRoot:", appRoot);
  console.log("isDev:", isDev);
  
  mainWindow.loadFile(indexHtml).catch((err) => {
    console.error("Failed to load index.html:", err);
    mainWindow.loadFile(path.join(appRoot, "index.html")).catch(() => {
      mainWindow.webContents.loadURL("data:text/html,<h1>Failed to load app</h1>");
    });
  });

  // Listen for webContents ready
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Renderer process error:", errorCode, errorDescription);
  });
  
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    app.quit();
  });
}

app.on("ready", async () => {
  try {
    await startServer();
    registerApiHandlers();
    createWindow();
    createMenu();
  } catch (err) {
    console.error("Failed to start app:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function createMenu() {
  const template: any[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for app info
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-app-path", () => app.getAppPath());

// IPC handlers for window controls
ipcMain.handle("window-minimize", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
});
