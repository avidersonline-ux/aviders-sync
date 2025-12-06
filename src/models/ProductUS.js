import mongoose from "mongoose";

const productUSSchema = new mongoose.Schema(
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
  { collection: "products_us" }
);

const ProductUS = mongoose.model("ProductUS", productUSSchema);
export default ProductUS;
