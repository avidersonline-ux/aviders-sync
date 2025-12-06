import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  created_at: Date,
  updated_at: Date
}, { collection: "categories" });

export default mongoose.model("Category", categorySchema);
