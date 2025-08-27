const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  dbReady: () => ipcRenderer.invoke('db:ready'),

  // CRUD farmers & purchasers
  farmerCreate: (data) => ipcRenderer.invoke('farmer:create', data),
  farmerList: (q) => ipcRenderer.invoke('farmer:list', q || {}),
  purchaserCreate: (data) => ipcRenderer.invoke('purchaser:create', data),
  purchaserList: (q) => ipcRenderer.invoke('purchaser:list', q || {}),

  // Trades
  tradeCreate: (data) => ipcRenderer.invoke('trade:create', data),
  tradeUpdate: (id, data) => ipcRenderer.invoke('trade:update', { id, data }),
  tradeDelete: (id) => ipcRenderer.invoke('trade:delete', id),

  // Payments
  payFarmer: (data) => ipcRenderer.invoke('payment:farmer', data),
  recvPurchaser: (data) => ipcRenderer.invoke('payment:purchaser', data),

  // Reports
  reportDaily: (range) => ipcRenderer.invoke('report:daily', range),
  reportFarmerLedger: (id, range) => ipcRenderer.invoke('report:farmerLedger', { id, range }),
  reportPurchaserLedger: (id, range) => ipcRenderer.invoke('report:purchaserLedger', { id, range }),
  reportFirmCash: (range) => ipcRenderer.invoke('report:firmCash', range),

  // Migration
  migrateLocalJson: (payload) => ipcRenderer.invoke('migrate:localjson', payload),
});
