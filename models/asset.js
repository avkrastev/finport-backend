const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const assetSchema = new Schema({
  name: { type: String, required: true },
  asset_id: { type: String, required: false },
  symbol: { type: String, required: false },
  category: { type: String, required: false },
  price: { type: Number, required: true },
  price_usd: { type: Number, required: true },
  currency: { type: String, required: true },
  quantity: { type: Number, required: false },
  weight: { type: String, required: false },
  date: { type: String, required: true },
  type: { type: Number, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

assetSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Asset", assetSchema);
