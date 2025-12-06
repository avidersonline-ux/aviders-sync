// src/category_manager.js

import mongoose from "mongoose";

const Categories = mongoose.connection.collection("categories");

/**
 * Ensures category exists in MongoDB
 * If not, inserts automatically
 */
export async function ensureCategoryExists(name) {
  if (!name || typeof name !== "string") return;

  const existing = await Categories.findOne({ name: name.toLowerCase() });

  if (!existing) {
    await Categories.insertOne({
      name: name.toLowerCase(),
      created_at: new Date(),
    });

    console.log("📂 Category created:", name);
  }
}
