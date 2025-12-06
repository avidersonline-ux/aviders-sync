import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./mongo_client.js";
import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

import keywords from "./keywords_us.json" assert { type: "json" };

await connectDB();

for (let word of keywords) {
  console.log("Searching US:", word);

  const results = await searchAmazon(word, "us");

  for (let raw of results) {
    const p = normalizeProduct(raw, "us");
    if (p) {
      console.log("Saving:", p.id);
      await saveProduct(p);
    }
  }
}

