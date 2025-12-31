// src/run_batch_us.js

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
// ✅ CHANGE 1: Use the smart hybrid service
import { fetchProducts } from "./product_service.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

// Load US keywords
// Ensure src/keywords_us.json exists!
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_us.json", "utf-8")
);

async function run() {
  console.log("🚀 Starting US batch sync...");

  await connectDB();

  // Search index collection
  const searchIndex = mongoose.connection.collection("search_index");

  for (const word of keywords) {
    console.log(`🔍 Searching US: ${word}`);

    // ✅ Region is "us"
    const lastRun = await searchIndex.findOne({
      keyword: word,
      region: "us",
    });

    // Skip if indexed in last 6 hours
    if (lastRun && Date.now() - lastRun.last_run < 6 * 60 * 60 * 1000) {
      console.log(`⏩ SKIPPED (indexed recently): ${word}`);
      continue;
    }

    // Update timestamp
    await searchIndex.updateOne(
      { keyword: word, region: "us" },
      { $set: { last_run: Date.now() } },
      { upsert: true }
    );

    // ✅ CHANGE 2: Fetch using the smart manager (Amazon First -> SerpApi Fallback)
    const results = await fetchProducts(word, "us");

    if (!results || results.length === 0) {
      console.log(`⚠ No results found for keyword: ${word}`);
      continue;
    }

    for (const raw of results) {
      // ✅ CHANGE 3: Fixed region to "us" (was "in" before)
      const product = normalizeProduct(raw, "us", word);

      if (product) {
        console.log("💾 Saving US:", product.id);
        await saveProduct(product, "us");
      }
    }
  }

  console.log("✅ US batch sync completed");

  // 🔴 CRITICAL: close DB & exit
  await mongoose.connection.close();
  process.exit(0);
}

// Run safely
run().catch(async (err) => {
  console.error("❌ US batch failed:", err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
