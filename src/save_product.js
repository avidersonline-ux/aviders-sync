// src/save_product.js

import mongoose from "mongoose";
import ProductIN from "./models/ProductIN.js";
import ProductUS from "./models/ProductUS.js";
import { ensureCategoryExists } from "./category_manager.js";

export async function saveProduct(product, region = "in") {
  // ------------------------------
  // SELECT MODEL BASED ON REGION
  // ------------------------------
  const Model = region === "us" ? ProductUS : ProductIN;

  // ------------------------------
  AUTO CREATE CATEGORY IF NEEDED
  // ------------------------------
  await ensureCategoryExists(product.category);

  // ------------------------------
  // CHECK EXISTING PRODUCT
  // ------------------------------
  const existing = await Model.findOne({ id: product.id });

  // ------------------------------
  // SKIP SAVING IF NO DATA CHANGED
  // ------------------------------
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

  // ------------------------------
  // UPSERT PRODUCT (insert or update)
  // ------------------------------
  await Model.updateOne(
    { id: product.id },
    { $set: product },
    { upsert: true }
  );

  console.log("✅ Updated:", product.id);

  // ------------------------------
  // PRICE HISTORY (ONLY IF PRICE CHANGED)
  // ------------------------------
  if (!existing || existing.price !== product.price) {
    await mongoose.connection.collection("price_history").insertOne({
      asin: product.id,
      price: product.price,
      mrp: product.mrp,
      source: product.source,
      region,
      date: new Date(),
    });

    console.log("📈 Price history added:", product.id);
  }
}
