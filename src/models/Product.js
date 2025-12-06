import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },

    title: String,
    brand: String,

    price: Number,
    mrp: Number,
    currency: String,

    category: String,
    stock: String,

    rating: Number,
    reviews: Number,

    image: String,
    images: [String],

    bought_last_month: String,
    sponsored: Boolean,
    delivery: [String],

    source: String,
    affiliateUrl: String,

    updated_at: Date
  },
  { collection: "products" }   // keep same collection
);

export const Product = mongoose.model("Product", productSchema);
