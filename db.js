const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/ssvikas-admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error: ", err);
});

module.exports = mongoose;
