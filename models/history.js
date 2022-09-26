const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const historySchema = new Schema({
  category: { type: String, required: true },
  balance: { type: Number, required: true },
  total: { type: Number, required: true },
  currency: { type: String, required: false },
  date: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

historySchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("History", historySchema);
