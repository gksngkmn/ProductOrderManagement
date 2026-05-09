const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");

let mainWindow = null;
let backendServer = null;

const isDev = !app.isPackaged;

function getBackendServerPath() {
  if (isDev) {
    return path.join(__dirname, "..", "backend", "server.js");
  }

  return path.join(process.resourcesPath, "backend", "server.js");
}

function startBackend() {
  try {
    process.env.ELECTRON_PACKAGED = app.isPackaged ? "true" : "false";

    const backendPath = getBackendServerPath();

    backendServer = require(backendPath);

    console.log("Backend started inside Electron.");
  } catch (error) {
    console.error("Backend start error:", error);

    dialog.showErrorBox(
      "Backend Start Error",
      `Backend could not be started.\n\n${error.message}`
    );
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Product Order Management",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://localhost:3000/index.html").catch((error) => {
    dialog.showErrorBox(
      "Frontend Load Error",
      `Could not load frontend.\n\n${error.message}`
    );
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  startBackend();

  setTimeout(() => {
    createWindow();
  }, 1000);
});

app.on("window-all-closed", () => {
  if (backendServer) {
    backendServer.close(() => {
      console.log("Backend server closed.");
    });
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendServer) {
    backendServer.close(() => {
      console.log("Backend server closed before quit.");
    });
  }
});