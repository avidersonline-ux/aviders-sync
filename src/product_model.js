import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  brand: String,
  image: String,
  price: Number,
  mrp: Number,
  currency: String,
  category: String,
  source: String,
  affiliateUrl: String,
  updated_at: Date
});

export default mongoose.model("Product", ProductSchema);
