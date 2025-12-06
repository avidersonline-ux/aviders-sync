import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProductIN } from "./save_product.js"; // Save into products_in

// Load India keywords
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_in.json", "utf-8")
);

await connectDB();

const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`Searching IN: ${word}`);

  // --------------------------------------------------
  // RULE 5: Prevent repeated API calls (6 hours)
  // --------------------------------------------------
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "IN",
  });

  const sixHours = 1000 * 60 * 60 * 6;

  if (lastRun && Date.now() - lastRun.last_run < sixHours) {
    console.log(`⏩ SKIPPED (recently indexed): ${word}`);
    continue;
  }

  // Update timestamp
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
  // Process & Save Products
  // --------------------------------------------------
  for (let raw of results) {
    const p = normalizeProduct(raw, "in");

    if (p) {
      console.log("Saving IN:", p.id);
      await saveProductIN(p); // Saves to products_in
    }
  }
}
