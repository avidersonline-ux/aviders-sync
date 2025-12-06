import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
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
  { timestamps: false }
);

// ⭐ DYNAMIC COLLECTION NAME ⭐
// India → products_in
// US → products_us
export function getProductModel(region) {
  const collection = region === "us" ? "products_us" : "products_in";
  return (
    mongoose.models[collection] ||
    mongoose.model(collection, productSchema, collection)
  );
}
