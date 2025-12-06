import mongoose from "mongoose";
import Category from "./models/Category.js";

// ----------------------
// Normalize category names
// ----------------------
export function cleanCategory(rawCategory, title = "") {
  if (!rawCategory) rawCategory = "";

  rawCategory = rawCategory.toLowerCase().trim();

  // 1) SERPAPI category cleaning
  if (rawCategory.includes("phone")) return "smartphones";
  if (rawCategory.includes("mobile")) return "smartphones";
  if (rawCategory.includes("smartphone")) return "smartphones";

  if (rawCategory.includes("laptop")) return "laptops";
  if (rawCategory.includes("macbook")) return "laptops";

  if (rawCategory.includes("earbud")) return "earbuds";
  if (rawCategory.includes("earphone")) return "earbuds";
  if (rawCategory.includes("headphone")) return "audio";

  if (rawCategory.includes("watch")) return "watches";
  if (rawCategory.includes("smartwatch")) return "watches";

  // 2) Keyword-based fallback using product title
  let t = title.toLowerCase();

  if (t.includes("iphone") || t.includes("mobile")) return "smartphones";
  if (t.includes("macbook") || t.includes("notebook")) return "laptops";
  if (t.includes("earbuds") || t.includes("airpods")) return "earbuds";
  if (t.includes("watch")) return "watches";

  // 3) Default fallback
  return "general";
}

// ----------------------
// Create category if missing
// ----------------------
export async function ensureCategoryExists(categoryName) {
  if (!categoryName) return;

  const slug = categoryName.toLowerCase().replace(/\s+/g, "_");

  const existing = await Category.findOne({ slug });

  if (existing) return existing;

  const newCat = new Category({
    name: categoryName,
    slug,
    created_at: new Date(),
    updated_at: new Date()
  });

  await newCat.save();
  return newCat;
}
