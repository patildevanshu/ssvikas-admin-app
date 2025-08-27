const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectMongo() {
  if (isConnected) return mongoose.connection;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssvikas_admin';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'ssvikas_admin' });
  isConnected = true;
  return mongoose.connection;
}

module.exports = { connectMongo };
