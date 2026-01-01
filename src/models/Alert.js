import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  asin: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  region: { type: String, required: true },
  email: { type: String, required: true },
  active: { type: Boolean, default: true }
});

export default mongoose.model("PriceAlert", AlertSchema);
