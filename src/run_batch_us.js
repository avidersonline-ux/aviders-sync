// src/run_batch_us.js

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

// Load US keywords
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

    // ✅ FIX: region must be lowercase "us"
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

    // Fetch products from SerpAPI
    const results = await searchAmazon(word, "us");

    if (!results || results.length === 0) {
      console.log(`⚠ No results found for keyword: ${word}`);
      continue;
    }

    for (const raw of results) {
      const product = normalizeProduct(raw, "us");

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
