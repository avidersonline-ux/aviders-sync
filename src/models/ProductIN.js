iimport mongoose from "mongoose";

const productINSchema = new mongoose.Schema(
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

    affiliateUrl: String,
    source: String,

    updated_at: Date,

    /** NEW — Store full raw SerpAPI product object */
    raw: mongoose.Schema.Types.Mixed
  },
  { collection: "products_in" }
);

export default mongoose.model("ProductIN", productINSchema);
