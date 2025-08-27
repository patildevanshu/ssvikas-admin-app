const mongoose = require('mongoose');

const tradeEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  srNo: Number,
  boardNo: String,
  gaadiNo: String,

  bhaav: { type: Number, required: true },      // rate
  lungar: { type: Number, default: 0 },
  weight: { type: Number, required: true },     // in kg
  mandiTax: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  majduri: { type: Number, default: 0 },

  // Relations
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  purchaserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchaser', required: true },

  // Derived totals
  grossAmount: { type: Number, required: true }, // bhaav * weight - lungar?
  totalDeductions: { type: Number, required: true }, // tax+comm+majduri+lungar (as per your rule)
  netAmount: { type: Number, required: true },   // gross - deductions

  remarks: String
}, { timestamps: true });

tradeEntrySchema.index({ date: 1, farmerId: 1 });
tradeEntrySchema.index({ date: 1, purchaserId: 1 });

module.exports = mongoose.model('TradeEntry', tradeEntrySchema);
