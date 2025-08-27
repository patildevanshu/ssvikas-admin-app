const mongoose = require('mongoose');

const paymentPurchaserSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  purchaserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchaser', required: true },
  mode: { type: String, enum: ['cash','bank','upi','cheque'], default: 'bank' },
  amount: { type: Number, required: true }, // money received from purchaser
  reference: String,
  notes: String,
}, { timestamps: true });

paymentPurchaserSchema.index({ purchaserId: 1, date: 1 });

module.exports = mongoose.model('PaymentPurchaser', paymentPurchaserSchema);
