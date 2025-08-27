const mongoose = require('mongoose');

const paymentFarmerSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  mode: { type: String, enum: ['cash','bank','upi','cheque'], default: 'cash' },
  amount: { type: Number, required: true },
  reference: String, // txn id / cheque no
  notes: String,
}, { timestamps: true });

paymentFarmerSchema.index({ farmerId: 1, date: 1 });

module.exports = mongoose.model('PaymentFarmer', paymentFarmerSchema);
