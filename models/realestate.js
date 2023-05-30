const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const realEstateSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, required: false },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

realEstateSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("RealEstate", realEstateSchema);
