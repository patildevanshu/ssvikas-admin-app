const { ipcMain } = require('electron');
const { connectMongo } = require('../db/connection');
const Farmer = require('../db/models/Farmer');
const Purchaser = require('../db/models/Purchaser');
const { createTrade, updateTrade, deleteTrade } = require('../services/tradeService');
const { payFarmer, receiveFromPurchaser } = require('../services/paymentService');
const { dailySummary, farmerLedger, purchaserLedger, firmCashFlow } = require('../services/reports');

function registerIpc() {
  ipcMain.handle('db:ready', async () => { await connectMongo(); return true; });

  // Farmers
  ipcMain.handle('farmer:create', async (_e, data) => (await Farmer.create(data)));
  ipcMain.handle('farmer:list', async (_e, q) => (await Farmer.find(q || {}).sort({ name:1 })));

  // Purchasers
  ipcMain.handle('purchaser:create', async (_e, data) => (await Purchaser.create(data)));
  ipcMain.handle('purchaser:list', async (_e, q) => (await Purchaser.find(q || {}).sort({ companyName:1 })));

  // Trades
  ipcMain.handle('trade:create', async (_e, data) => (await createTrade(data)));
  ipcMain.handle('trade:update', async (_e, { id, data }) => (await updateTrade(id, data)));
  ipcMain.handle('trade:delete', async (_e, id) => (await deleteTrade(id)));

  // Payments
  ipcMain.handle('payment:farmer', async (_e, data) => (await payFarmer(data)));
  ipcMain.handle('payment:purchaser', async (_e, data) => (await receiveFromPurchaser(data)));

  // Reports
  ipcMain.handle('report:daily', async (_e, range) => (await dailySummary(range || {})));
  ipcMain.handle('report:farmerLedger', async (_e, { id, range }) => (await farmerLedger(id, range || {})));
  ipcMain.handle('report:purchaserLedger', async (_e, { id, range }) => (await purchaserLedger(id, range || {})));
  ipcMain.handle('report:firmCash', async (_e, range) => (await firmCashFlow(range || {})));

  // Migration
  ipcMain.handle('migrate:localjson', async (_e, payload) => {
    // payload = { farmers:[], purchasers:[], trades:[], paymentsFarmer:[], paymentsPurchaser:[] }
    const Farmer = require('../db/models/Farmer');
    const Purchaser = require('../db/models/Purchaser');
    const TradeEntry = require('../db/models/TradeEntry');
    const PaymentFarmer = require('../db/models/PaymentFarmer');
    const PaymentPurchaser = require('../db/models/PaymentPurchaser');
    await connectMongo();

    const createdFarmers = await Farmer.insertMany(payload.farmers || [], { ordered:false }).catch(()=>[]);
    const createdPurchasers = await Purchaser.insertMany(payload.purchasers || [], { ordered:false }).catch(()=>[]);
    const createdTrades = await TradeEntry.insertMany(payload.trades || [], { ordered:false }).catch(()=>[]);
    const createdPF = await PaymentFarmer.insertMany(payload.paymentsFarmer || [], { ordered:false }).catch(()=>[]);
    const createdPP = await PaymentPurchaser.insertMany(payload.paymentsPurchaser || [], { ordered:false }).catch(()=>[]);
    return {
      farmers: createdFarmers.length || 0,
      purchasers: createdPurchasers.length || 0,
      trades: createdTrades.length || 0,
      paymentsFarmer: createdPF.length || 0,
      paymentsPurchaser: createdPP.length || 0
    };
  });
}

module.exports = { registerIpc };
