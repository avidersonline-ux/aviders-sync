import { Product } from "./models/product_model.js";

export async function saveProduct(p) {
  return await Product.findOneAndUpdate(
    { id: p.id },
    { $set: p },
    { upsert: true, new: true }
  );
}
