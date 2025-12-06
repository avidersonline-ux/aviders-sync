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

await connectDB();

// Search index collection (prevents repeated API calls)
const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`🔍 Searching IN: ${word}`);

  // RULE: Skip if already indexed in last 6 hours
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "IN",
  });

  if (lastRun && Date.now() - lastRun.last_run < 6 * 60 * 60 * 1000) {
    console.log(`⏩ SKIPPED (indexed recently): ${word}`);
    continue;
  }

  // Update timestamp
  await searchIndex.updateOne(
    { keyword: word, region: "IN" },
    { $set: { last_run: Date.now() } },
    { upsert: true }
  );

  // Fetch from SerpAPI
  const results = await searchAmazon(word, "in");

  if (!results || results.length === 0) {
    console.log(`⚠ No results found for keyword: ${word}`);
    continue;
  }

  for (let raw of results) {
    const product = normalizeProduct(raw, "in");

    if (product) {
      console.log("💾 Saving IN:", product.id);
      await saveProduct(product, "in");
    }
  }
}
