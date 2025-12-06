import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: String,  // ASIN
  title: String,
  brand: String,
  price: Number,
  mrp: Number,
  currency: String,
  category: String,
  stock: String, // in_stock / out_of_stock

  image: String,   // main image
  images: [String], // gallery images

  rating: Number,
  reviews: Number,

  affiliateUrl: String,
  source: String,  // amazon_in, amazon_us, internal

  updated_at: Date,
});

export default mongoose.model("Product", ProductSchema);
