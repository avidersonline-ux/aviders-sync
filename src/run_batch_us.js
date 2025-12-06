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

await connectDB();

// Search index collection
const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`🔍 Searching US: ${word}`);

  // RULE: Skip if indexed in last 6 hours
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "US",
  });

  if (lastRun && Date.now() - lastRun.last_run < 6 * 60 * 60 * 1000) {
    console.log(`⏩ SKIPPED (indexed recently): ${word}`);
    continue;
  }

  // Update timestamp
  await searchIndex.updateOne(
    { keyword: word, region: "US" },
    { $set: { last_run: Date.now() } },
    { upsert: true }
  );

  // Fetch products
  const results = await searchAmazon(word, "us");

  if (!results || results.length === 0) {
    console.log(`⚠ No results found for keyword: ${word}`);
    continue;
  }

  for (let raw of results) {
    const product = normalizeProduct(raw, "us");

    if (product) {
      console.log("💾 Saving US:", product.id);
      await saveProduct(product, "us");
    }
  }
}
