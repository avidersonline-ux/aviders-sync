import Product from "./models/Product.js";

export async function saveProduct(product) {
  await Product.findOneAndUpdate(
    { id: product.id, region: product.region },   // 🔥 Important fix
    product,
    { upsert: true, new: true }
  );
}
