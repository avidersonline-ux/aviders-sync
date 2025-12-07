import mongoose from "mongoose";

const Categories = mongoose.connection.collection("categories");

/**
 * Ensures category exists in MongoDB
 * Automatically groups by region (IN / US)
 */
export async function ensureCategoryExists(name, region = "in") {
  if (!name || typeof name !== "string") return;

  // Normalize & create slug
  const normalized = name.trim().toLowerCase();
  const slug = normalized.replace(/\s+/g, "-");

  const existing = await Categories.findOne({ slug, region });

  if (!existing) {
    await Categories.insertOne({
      name: normalized,
      slug,
      region,              // << IMPORTANT
      parent: null,        // reserved for future
      created_at: new Date(),
    });

    console.log(`📂 Category created [${region}]:`, name);
  }
}
