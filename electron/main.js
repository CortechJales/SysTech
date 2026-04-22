const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

// Desativação agressiva de GPU para processadores Intel 4ª Gen
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('ignore-gpu-blocklist'); 
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Se o servidor demorar a subir, tenta recarregar
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL('http://localhost:3000');
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Inicia seu servidor
    const { startServer } = require('../server');
    await startServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox('Erro ao iniciar servidor', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});