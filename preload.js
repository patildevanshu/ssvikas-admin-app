const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveData: (fileName, data) => ipcRenderer.invoke('save-data', fileName, data),
  loadData: (fileName) => ipcRenderer.invoke('load-data', fileName),
  exportToFile: (data, fileName) => ipcRenderer.invoke('export-to-file', data, fileName),
  createBackup: (data) => ipcRenderer.invoke('create-backup', data),

  // Menu actions listener
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', callback);
  },
  
  // Navigation listener
  onNavigateTo: (callback) => {
    ipcRenderer.on('navigate-to', callback);
  },

  // Import/Export listeners
  onImportData: (callback) => {
    ipcRenderer.on('import-data', callback);
  },
  
  onExportExcel: (callback) => {
    ipcRenderer.on('export-excel', callback);
  },
  
  onRestoreData: (callback) => {
    ipcRenderer.on('restore-data', callback);
  },

  // Show shortcuts listener
  onShowShortcuts: (callback) => {
    ipcRenderer.on('show-shortcuts', callback);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Also expose some utility functions
contextBridge.exposeInMainWorld('utils', {
  // Platform detection
  platform: process.platform,
  
  // Version info
  versions: process.versions
});