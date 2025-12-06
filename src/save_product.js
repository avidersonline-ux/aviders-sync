import { getProductModel } from "./models/product_model.js";

export async function saveProduct(product, region) {
  const Product = getProductModel(region);

  await Product.updateOne(
    { id: product.id },
    { $set: product },
    { upsert: true }
  );
}
