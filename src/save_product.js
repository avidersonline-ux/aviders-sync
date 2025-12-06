import { Product } from "./models/product_model.js";

export async function saveProduct(p) {
  try {
    await Product.findOneAndUpdate(
      { id: p.id },         // match product by ASIN
      { $set: p },          // set all updated fields
      { upsert: true }      // create if missing
    );
  } catch (err) {
    console.error("Error saving product:", err.message);
  }
}
