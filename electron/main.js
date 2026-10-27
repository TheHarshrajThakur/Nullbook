const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { startPythonBackend, stopPythonBackend, waitForBackend } = require('./pythonManager');

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function checkUrlAvailable(url) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 680,
    title: 'Nullbook AI — Offline Intelligent Notepad and Code Generator',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Security headers & CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' http://127.0.0.1:8765 http://127.0.0.1:5173 data: blob:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        ],
      },
    });
  });

  // Start Python backend
  try {
    await startPythonBackend();
    await waitForBackend();
    console.log('[Main] Python backend ready.');
  } catch (err) {
    console.error('[Main] Python backend failed to initialize:', err);
  }

  // Smart URL selection: if Vite dev server is running on 5173, attach to it. Otherwise load built dist.
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';
  const isViteLive = isDev && (await checkUrlAvailable(devUrl));

  if (isViteLive) {
    console.log(`[Main] Attaching to live Vite development server at ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    const distPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    console.log(`[Main] Loading local application build from ${distPath}`);
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-external', async (event, url) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    await shell.openExternal(url);
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopPythonBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
