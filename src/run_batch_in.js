import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProductIN } from "./save_product.js";   // IMPORTANT: save to products_in

// Load India keywords
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_in.json", "utf-8")
);

await connectDB();

const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`Searching IN: ${word}`);

  // --------------------------------------------------
  // RULE 5: Prevent repeated API calls
  // --------------------------------------------------
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "IN",
  });

  if (lastRun && Date.now() - lastRun.last_run < 1000 * 60 * 60 * 6) {
    console.log(`⏩ SKIPPED (recently indexed): ${word}`);
    continue;
  }

  // Update index timestamp
  await searchIndex.updateOne(
    { keyword: word, region: "IN" },
    { $set: { last_run: Date.now() } },
    { upsert: true }
  );

  // --------------------------------------------------
  // Fetch products from SerpAPI
  // --------------------------------------------------
  const results = await searchAmazon(word, "in");

  if (!results || results.length === 0) {
    console.log(`⚠ No results found for IN keyword: ${word}`);
    continue;
  }

  // --------------------------------------------------
  // Process each product
  // --------------------------------------------------
  for (let raw of results) {
    const p = normalizeProduct(raw, "in");

    if (p) {
      console.log("Saving IN:", p.id);
      await saveProductIN(p);
    }
  }
}
