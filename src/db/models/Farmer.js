const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  bankName: String,
  accountHolder: String,
  accountNumber: String,
  ifsc: String,
  branch: String,
}, {_id:false});

const addressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  village: String,
  taluka: String,
  district: String,
  state: String,
  pincode: String,
}, {_id:false});

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, index: true },
  altMobile: String,
  email: String,
  address: addressSchema,
  bank: bankSchema,
  notes: String,
  openingBalance: { type: Number, default: 0 }, // positive => we owe farmer
  currentBalance: { type: Number, default: 0 }, // recalculated
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

farmerSchema.index({ name: 1 });

module.exports = mongoose.model('Farmer', farmerSchema);
