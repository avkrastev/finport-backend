const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const p2pSchema = new Schema({
  name: { type: String, required: true },
  apr: { type: Number, required: true },
  currency: { type: String, required: false },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

p2pSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("P2p", p2pSchema);
