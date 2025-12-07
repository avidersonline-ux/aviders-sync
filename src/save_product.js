// src/save_product.js

import mongoose from "mongoose";
import ProductIN from "./models/ProductIN.js";
import ProductUS from "./models/ProductUS.js";
import { ensureCategoryExists } from "./category_manager.js";

/**
 * Save or update product in the correct region collection
 * Also auto-creates category, updates price history, and avoids unnecessary writes
 */
export async function saveProduct(product, region = "in") {
  try {
    // Select correct model
    const Model = region === "us" ? ProductUS : ProductIN;

    // Normalize empty category
    const categoryName = product.category?.trim() || "general";

    // Ensure category exists for this region
    await ensureCategoryExists(categoryName, region);

    // Check existing product
    const existing = await Model.findOne({ id: product.id });

    // Skip if unchanged
    if (
      existing &&
      existing.price === product.price &&
      existing.mrp === product.mrp &&
      existing.rating === product.rating &&
      existing.reviews === product.reviews &&
      existing.stock === product.stock &&
      existing.category === product.category
    ) {
      console.log(`⏩ Skipping unchanged product: ${product.id}`);
      return;
    }

    // Prepare updated product object (ensure region tagging)
    const updatedProduct = {
      ...product,
      region,
      category: categoryName
    };

    // Insert or update product
    await Model.updateOne(
      { id: product.id },
      { $set: updatedProduct },
      { upsert: true }
    );

    console.log(`✅ Updated product (${region}):`, product.id);

    // Record price history when price changes
    if (!existing || existing.price !== product.price) {
      await mongoose.connection.collection("price_history").insertOne({
        asin: product.id,
        price: product.price,
        mrp: product.mrp,
        region,
        source: product.source,
        date: new Date(),
      });

      console.log(`📈 Price history added: ${product.id}`);
    }

  } catch (err) {
    console.error("❌ Error in saveProduct:", err.message);
  }
}
