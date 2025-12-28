import mongoose from "mongoose";

const productINSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },

    title: String,
    brand: String,

    price: Number,
    mrp: Number,
    currency: String,
    
    category: String,

    // 🔹 NEW: keyword used to fetch this product (iphone, laptop, earbuds…)
    keywordTag: {
      type: String,
      index: true,
    },

    // 🔹 NEW: curated category shown in shop (editable later)
    shopCategory: {
      type: String,
      index: true,
    },

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

    updated_at: Date,
  },
  { collection: "products_in" }
);

const ProductIN = mongoose.model("ProductIN", productINSchema);
export default ProductIN;

