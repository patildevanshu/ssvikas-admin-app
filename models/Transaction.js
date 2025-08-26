const mongoose = require("../db");

const transactionSchema = new mongoose.Schema({
  srNo: Number,
  date: Date,
  boardNo: String,
  gaadiNo: String,
  farmerName: String,
  purchaserName: String,
  bhaav: Number,
  lungar: String,
  weight: Number,
  mandiTax: Number,
  commission: Number,
  majdoori: Number,
  totalAmount: Number,
  netAmount: Number
});

module.exports = mongoose.model("Transaction", transactionSchema);
