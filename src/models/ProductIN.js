import mongoose from "mongoose";

const ProductINSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
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
    updated_at: Date,
  },
  { collection: "products_in" }
);

export default mongoose.models.ProductIN ||
  mongoose.model("ProductIN", ProductINSchema);

