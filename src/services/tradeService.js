const TradeEntry = require('../db/models/TradeEntry');
const { recalcFarmerBalance, recalcPurchaserBalance } = require('./balances');

function deriveTotals({ bhaav, weight, lungar=0, mandiTax=0, commission=0, majduri=0 }) {
  const grossAmount = Math.round((bhaav * weight) * 100) / 100;
  const totalDeductions = Math.round((lungar + mandiTax + commission + majduri) * 100) / 100;
  const netAmount = Math.round((grossAmount - totalDeductions) * 100) / 100;
  return { grossAmount, totalDeductions, netAmount };
}

async function createTrade(payload) {
  const totals = deriveTotals(payload);
  const doc = new TradeEntry({ ...payload, ...totals });
  const saved = await doc.save();
  await Promise.all([
    recalcFarmerBalance(saved.farmerId),
    recalcPurchaserBalance(saved.purchaserId)
  ]);
  return saved;
}

async function updateTrade(id, updates) {
  if (updates.bhaav || updates.weight || updates.lungar || updates.mandiTax || updates.commission || updates.majduri) {
    Object.assign(updates, deriveTotals({ ...updates, bhaav: updates.bhaav ?? 0, weight: updates.weight ?? 0 }));
  }
  const prev = await TradeEntry.findById(id);
  const saved = await TradeEntry.findByIdAndUpdate(id, updates, { new: true });
  await Promise.all([
    recalcFarmerBalance(saved.farmerId),
    recalcPurchaserBalance(saved.purchaserId),
    prev && prev.purchaserId.toString() !== saved.purchaserId.toString() ? recalcPurchaserBalance(prev.purchaserId) : null,
    prev && prev.farmerId.toString() !== saved.farmerId.toString() ? recalcFarmerBalance(prev.farmerId) : null
  ]);
  return saved;
}

async function deleteTrade(id) {
  const doc = await TradeEntry.findByIdAndDelete(id);
  if (doc) {
    await Promise.all([
      recalcFarmerBalance(doc.farmerId),
      recalcPurchaserBalance(doc.purchaserId)
    ]);
  }
  return !!doc;
}

module.exports = { createTrade, updateTrade, deleteTrade };
