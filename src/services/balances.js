const TradeEntry = require('../db/models/TradeEntry');
const Farmer = require('../db/models/Farmer');
const Purchaser = require('../db/models/Purchaser');
const PaymentFarmer = require('../db/models/PaymentFarmer');
const PaymentPurchaser = require('../db/models/PaymentPurchaser');

async function recalcFarmerBalance(farmerId) {
  const [aggTrade] = await TradeEntry.aggregate([
    { $match: { farmerId } },
    { $group: { _id: null, totalNet: { $sum: '$netAmount' } } }
  ]);
  const [aggPaid] = await PaymentFarmer.aggregate([
    { $match: { farmerId } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } }
  ]);
  const farmer = await Farmer.findById(farmerId);
  const net = (aggTrade?.totalNet || 0) + (farmer?.openingBalance || 0) - (aggPaid?.totalPaid || 0);
  farmer.currentBalance = net; // positive => we owe farmer
  await farmer.save();
  return net;
}

async function recalcPurchaserBalance(purchaserId) {
  const [aggTrade] = await TradeEntry.aggregate([
    { $match: { purchaserId } },
    { $group: { _id: null, totalGross: { $sum: '$netAmount' } } } // amount purchaser owes
  ]);
  const [aggRecv] = await PaymentPurchaser.aggregate([
    { $match: { purchaserId } },
    { $group: { _id: null, totalRecv: { $sum: '$amount' } } }
  ]);
  const purchaser = await Purchaser.findById(purchaserId);
  const net = (aggTrade?.totalGross || 0) + (purchaser?.openingBalance || 0) - (aggRecv?.totalRecv || 0);
  purchaser.currentBalance = net; // positive => purchaser owes us
  await purchaser.save();
  return net;
}

module.exports = { recalcFarmerBalance, recalcPurchaserBalance };
