import Product from "./product_model.js";

export const saveProduct = async (product) => {
  await Product.updateOne(
    { id: product.id },
    { $set: product },
    { upsert: true }
  );
};
