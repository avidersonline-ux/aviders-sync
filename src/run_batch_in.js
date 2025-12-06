import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

const keywords = JSON.parse(fs.readFileSync("./src/keywords_in.json", "utf-8"));

await connectDB();

for (let word of keywords) {
  console.log("Searching IN:", word);

  const results = await searchAmazon(word, "in");

  for (let raw of results) {

    // ✅ TEMP: PRINT ONLY FIRST PRODUCT RAW DATA
    console.log("RAW PRODUCT:", JSON.stringify(raw, null, 2));
    process.exit();  // stop after first item

    const p = normalizeProduct(raw, "in");
    if (p) {
      console.log("Saving IN:", p.id);
      await saveProduct(p);
    }
  }
}


console.log("DONE: India batch sync completed");
