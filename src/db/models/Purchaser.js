const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  line1: String, line2: String, city: String, state: String, pincode: String,
}, {_id:false});

const purchaserSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: String,
  mobile: { type: String, index: true },
  email: String,
  address: addressSchema,
  gstNumber: { type: String, index: true, sparse: true },
  creditLimit: { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 }, // positive => purchaser owes us
  currentBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

purchaserSchema.index({ companyName: 1 });

module.exports = mongoose.model('Purchaser', purchaserSchema);
