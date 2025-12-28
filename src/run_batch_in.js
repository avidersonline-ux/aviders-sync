// src/run_batch_in.js

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

// Load India keywords
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_in.json", "utf-8")
);

async function run() {
  console.log("🚀 Starting IN batch sync...");

  await connectDB();

  // Search index collection (prevents repeated API calls)
  const searchIndex = mongoose.connection.collection("search_index");

  for (const word of keywords) {
    console.log(`🔍 Searching IN: ${word}`);

    // ✅ FIX: region must be lowercase "in"
    const lastRun = await searchIndex.findOne({
      keyword: word,
      region: "in",
    });

    // Skip if indexed in last 6 hours
    if (lastRun && Date.now() - lastRun.last_run < 6 * 60 * 60 * 1000) {
      console.log(`⏩ SKIPPED (indexed recently): ${word}`);
      continue;
    }

    // Update timestamp
    await searchIndex.updateOne(
      { keyword: word, region: "in" },
      { $set: { last_run: Date.now() } },
      { upsert: true }
    );

    // Fetch from SerpAPI
    const results = await searchAmazon(word, "in");

    if (!results || results.length === 0) {
      console.log(`⚠ No results found for keyword: ${word}`);
      continue;
    }

    for (const raw of results) {
      const product = normalizeProduct(raw, "in", word);

      if (product) {
        console.log("💾 Saving IN:", product.id);
        await saveProduct(product, "in");
      }
    }
  }

  console.log("✅ IN batch sync completed");

  // 🔴 CRITICAL: Close DB & exit
  await mongoose.connection.close();
  process.exit(0);
}

// Run safely
run().catch(async (err) => {
  console.error("❌ Batch failed:", err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
