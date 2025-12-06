import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProductUS } from "./save_product.js"; // Save into products_us

// Load USA keywords
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_us.json", "utf-8")
);

await connectDB();

const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`Searching US: ${word}`);

  // --------------------------------------------------
  // RULE 5: Prevent repeated API calls (6 hours)
  // --------------------------------------------------
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "US",
  });

  const sixHours = 1000 * 60 * 60 * 6;

  if (lastRun && Date.now() - lastRun.last_run < sixHours) {
    console.log(`⏩ SKIPPED (recently indexed): ${word}`);
    continue;
  }

  // Update timestamp
  await searchIndex.updateOne(
    { keyword: word, region: "US" },
    { $set: { last_run: Date.now() } },
    { upsert: true }
  );

  // --------------------------------------------------
  // Fetch products from SerpAPI
  // --------------------------------------------------
  const results = await searchAmazon(word, "us");

  if (!results || results.length === 0) {
    console.log(`⚠ No results found for US keyword: ${word}`);
    continue;
  }

  // --------------------------------------------------
  // Process & Save Products
  // --------------------------------------------------
  for (let raw of results) {
    const p = normalizeProduct(raw, "us");

    if (p) {
      console.log("Saving US:", p.id);
      await saveProductUS(p); // Saves to products_us
    }
  }
}
