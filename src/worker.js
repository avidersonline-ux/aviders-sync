import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { searchAmazon } from "./serpapi_client.js";
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

async function startWorker() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🚀 Sync worker connected to MongoDB");

  const queue = mongoose.connection.collection("sync_queue");

  while (true) {
    const job = await queue.findOneAndDelete({}, { sort: { created_at: 1 } });

    if (!job.value) {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    const { keyword, region } = job.value;
    console.log(`🔄 Processing keyword: "${keyword}" (${region})`);

    const raw = await searchAmazon(keyword, region);

    for (const item of raw) {
      const p = normalizeProduct(item, region);
      await saveProduct(p, region);
    }

    console.log(`✅ Completed index for "${keyword}"`);
  }
}

startWorker().catch(console.error);
