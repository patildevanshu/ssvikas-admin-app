const PaymentFarmer = require('../db/models/PaymentFarmer');
const PaymentPurchaser = require('../db/models/PaymentPurchaser');
const FirmTransaction = require('../db/models/FirmTransaction');
const { recalcFarmerBalance, recalcPurchaserBalance } = require('./balances');

async function payFarmer({ farmerId, amount, mode='cash', reference, notes, date=new Date() }) {
  const p = await PaymentFarmer.create({ farmerId, amount, mode, reference, notes, date });
  await FirmTransaction.create({
    date, type: 'expense', account: mode === 'cash' ? 'cash' : 'bank',
    category: 'farmer_payment', amount, counterpartyType: 'farmer', counterpartyId: farmerId, notes: reference
  });
  await recalcFarmerBalance(farmerId);
  return p;
}

async function receiveFromPurchaser({ purchaserId, amount, mode='bank', reference, notes, date=new Date() }) {
  const p = await PaymentPurchaser.create({ purchaserId, amount, mode, reference, notes, date });
  await FirmTransaction.create({
    date, type: 'income', account: mode === 'cash' ? 'cash' : 'bank',
    category: 'purchaser_receipt', amount, counterpartyType: 'purchaser', counterpartyId: purchaserId, notes: reference
  });
  await recalcPurchaserBalance(purchaserId);
  return p;
}

module.exports = { payFarmer, receiveFromPurchaser };
