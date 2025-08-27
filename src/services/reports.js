const TradeEntry = require('../db/models/TradeEntry');
const PaymentFarmer = require('../db/models/PaymentFarmer');
const PaymentPurchaser = require('../db/models/PaymentPurchaser');
const FirmTransaction = require('../db/models/FirmTransaction');

function dateRangeFilter({ from, to }) {
  const q = {};
  if (from || to) q.date = {};
  if (from) q.date.$gte = new Date(from);
  if (to) q.date.$lte = new Date(to);
  return q;
}

async function dailySummary({ from, to }) {
  const match = dateRangeFilter({ from, to });
  const trades = await TradeEntry.aggregate([
    { $match: match },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      gross: { $sum: '$grossAmount' },
      deductions: { $sum: '$totalDeductions' },
      net: { $sum: '$netAmount' },
      weight: { $sum: '$weight' }
    }},
    { $sort: { '_id': 1 } }
  ]);
  return trades;
}

async function farmerLedger(farmerId, { from, to }) {
  const trades = await TradeEntry.find({ farmerId, ...dateRangeFilter({ from, to }) }).sort({ date: 1 });
  const payments = await PaymentFarmer.find({ farmerId, ...dateRangeFilter({ from, to }) }).sort({ date: 1 });
  return { trades, payments };
}

async function purchaserLedger(purchaserId, { from, to }) {
  const trades = await TradeEntry.find({ purchaserId, ...dateRangeFilter({ from, to }) }).sort({ date: 1 });
  const receipts = await PaymentPurchaser.find({ purchaserId, ...dateRangeFilter({ from, to }) }).sort({ date: 1 });
  return { trades, receipts };
}

async function firmCashFlow({ from, to }) {
  const tx = await FirmTransaction.find(dateRangeFilter({ from, to })).sort({ date: 1 });
  const totals = await FirmTransaction.aggregate([
    { $match: dateRangeFilter({ from, to }) },
    { $group: {
      _id: '$type',
      total: { $sum: '$amount' }
    }}
  ]);
  const income = totals.find(t => t._id === 'income')?.total || 0;
  const expense = totals.find(t => t._id === 'expense')?.total || 0;
  return { tx, income, expense, profit: income - expense };
}

module.exports = { dailySummary, farmerLedger, purchaserLedger, firmCashFlow };
