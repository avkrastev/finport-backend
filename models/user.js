const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  email_verified: { type: Boolean, default: false },
  password: { type: String, required: true, minlength: 8 },
  image: { type: String, required: false },
  stocks_api_key: { type: String, required: false },
  currency: { type: String, required: false },
  categories: { type: Array },
  assets: [{ type: mongoose.Types.ObjectId, required: true, ref: "Asset" }],
  p2p: [{ type: mongoose.Types.ObjectId, required: true, ref: "P2p" }],
  history: [{ type: mongoose.Types.ObjectId, required: true, ref: "History" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
