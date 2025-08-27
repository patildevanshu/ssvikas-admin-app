const mongoose = require('mongoose');

const firmTxnSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['income','expense','transfer'], required: true },
  account: { type: String, enum: ['cash','bank'], default: 'bank' },
  category: { type: String, default: 'general' }, // e.g., diesel, rent, interest
  amount: { type: Number, required: true },
  counterpartyType: { type: String, enum: ['farmer','purchaser','other'], default: 'other' },
  counterpartyId: { type: mongoose.Schema.Types.ObjectId, refPath: 'counterpartyType' },
  notes: String,
}, { timestamps: true });

firmTxnSchema.index({ date: 1, account: 1 });

module.exports = mongoose.model('FirmTransaction', firmTxnSchema);
