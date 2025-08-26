
console.log("Electron main process starting...");

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err);
});

process.on('unhandledRejection', (reason) => {
  console.error("Unhandled Rejection:", reason);
});


const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');


const isDev = process.argv.includes('--dev');

// Keep a global reference of the window object
let mainWindow;

// Data directories
const dataDir = path.join(__dirname, 'src/data');
const backupDir = path.join(__dirname, 'backups');

// Ensure data directories exist
function ensureDirectories() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'build/icon.ico'),
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  ensureDirectories();
  createWindow();
  createMenu();
});

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

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Trade Entry',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-trade');
          }
        },
        { type: 'separator' },
        {
          label: 'Import Data',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'JSON Files', extensions: ['json'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('import-data', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Export Data',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Backup Data',
          click: () => {
            mainWindow.webContents.send('menu-action', 'backup-data');
          }
        },
        {
          label: 'Restore Data',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'Backup Files', extensions: ['json'] }],
              defaultPath: backupDir
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('restore-data', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'dashboard');
          }
        },
        {
          label: 'Trade Ledger',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'ledger');
          }
        },
        {
          label: 'Farmers',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'farmers');
          }
        },
        {
          label: 'Purchasers',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'purchasers');
          }
        },
        {
          label: 'Reports',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'reports');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Generate Sample Data',
          click: () => {
            mainWindow.webContents.send('menu-action', 'generate-sample');
          }
        },
        {
          label: 'Clear All Data',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Clear All Data',
              message: 'Are you sure you want to clear all data? This action cannot be undone.',
              buttons: ['Cancel', 'Clear All Data'],
              defaultId: 0,
              cancelId: 0
            });
            
            if (result.response === 1) {
              mainWindow.webContents.send('menu-action', 'clear-all-data');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'settings');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SSVikas Admin',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About SSVikas Admin',
              message: 'SSVikas Kela Agency - Admin Application',
              detail: 'Version 1.0.0\nBanana Crop Trading Management System\n\nBuilt Devanshu Patil'
            });
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow.webContents.send('show-shortcuts');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for file operations
ipcMain.handle('save-data', async (event, fileName, data) => {
  try {
    const filePath = path.join(dataDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-data', async (event, fileName) => {
  try {
    const filePath = path.join(dataDir, fileName);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-to-file', async (event, data, fileName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileName,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled) {
      if (result.filePath.endsWith('.xlsx')) {
        // Handle Excel export (you'll implement this in the renderer)
        mainWindow.webContents.send('export-excel', { data, filePath: result.filePath });
      } else {
        fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      }
      return { success: true };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-backup', async (event, data) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFile);
    
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    return { success: true, fileName: backupFile };
  } catch (error) {
    return { success: false, error: error.message };
  }
});