// src/save_product.js

import mongoose from "mongoose";
import ProductIN from "./models/ProductIN.js";
import ProductUS from "./models/ProductUS.js";
import { ensureCategoryExists } from "./category_manager.js";

export async function saveProduct(product, region = "in") {
  // Select correct model
  const Model = region === "us" ? ProductUS : ProductIN;

  // Ensure category exists
  await ensureCategoryExists(product.category);

  // Check existing
  const existing = await Model.findOne({ id: product.id });

  // Skip unchanged
  if (
    existing &&
    existing.price === product.price &&
    existing.mrp === product.mrp &&
    existing.rating === product.rating &&
    existing.reviews === product.reviews &&
    existing.stock === product.stock &&
    existing.category === product.category
  ) {
    console.log("⏩ Skipping unchanged:", product.id);
    return;
  }

  // Upsert (insert or update)
  await Model.updateOne(
    { id: product.id },
    { $set: product },
    { upsert: true }
  );

  console.log("✅ Updated:", product.id);

  // Price history logging
  if (!existing || existing.price !== product.price) {
    await mongoose.connection.collection("price_history").insertOne({
      asin: product.id,
      price: product.price,
      mrp: product.mrp,
      region,
      source: product.source,
      date: new Date(),
    });

    console.log("📈 Price history added:", product.id);
  }
}
