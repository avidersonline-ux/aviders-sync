iimport dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProductUS } from "./save_product.js";   // IMPORTANT: save to products_us

// Load USA keywords
const keywords = JSON.parse(
  fs.readFileSync("./src/keywords_us.json", "utf-8")
);

await connectDB();

const searchIndex = mongoose.connection.collection("search_index");

for (let word of keywords) {
  console.log(`Searching US: ${word}`);

  // --------------------------------------------------
  // RULE 5: Prevent repeated API calls
  // --------------------------------------------------
  const lastRun = await searchIndex.findOne({
    keyword: word,
    region: "US",
  });

  if (lastRun && Date.now() - lastRun.last_run < 1000 * 60 * 60 * 6) {
    console.log(`⏩ SKIPPED (recently indexed): ${word}`);
    continue;
  }

  // Update index timestamp
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
  // Process each product
  // --------------------------------------------------
  for (let raw of results) {
    const p = normalizeProduct(raw, "us");

    if (p) {
      console.log("Saving US:", p.id);
      await saveProductUS(p);
    }
  }
}
