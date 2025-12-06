import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true },
  region: { type: String, required: true },   // 🔥 NEW
  title: String,
  brand: String,
  price: Number,
  mrp: Number,
  currency: String,
  category: String,
  rating: Number,
  reviews: Number,
  stock: String,
  image: String,
  images: [String],
  affiliateUrl: String,
  source: String,
  updated_at: Date
});

// Compound index → prevents overwriting
ProductSchema.index({ id: 1, region: 1 }, { unique: true });

export default mongoose.model("Product", ProductSchema);
