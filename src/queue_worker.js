import mongoose from "mongoose";
import { connectDB } from "./mongo_client.js";
// ✅ CHANGE 1: Import the new Manager Service instead of SerpApi directly
import { fetchProducts } from "./product_service.js"; 
import { normalizeProduct } from "./normalize_product.js";
import { saveProduct } from "./save_product.js";

await connectDB();

const queue = mongoose.connection.collection("sync_queue");
const searchIndex = mongoose.connection.collection("search_index");

console.log("🔄 Queue Worker Running…");

setInterval(async () => {
  // Pick the oldest queued job
  const job = await queue.findOneAndDelete({}, { sort: { created_at: 1 } });

  if (!job.value) return;

  const { keyword, region } = job.value;

  console.log(`⚙ Processing: "${keyword}"  [${region}]`);

  // Check last run
  const lastRun = await searchIndex.findOne({ keyword, region });
  const allow =
    !lastRun || Date.now() - lastRun.last_run > 1000 * 60 * 60 * 6;

  if (!allow) {
    console.log("⏩ Skipping (recently indexed)");
    return;
  }

  // Update timestamp
  await searchIndex.updateOne(
    { keyword, region },
    { $set: { last_run: Date.now() } },
    { upsert: true }
  );

  // ✅ CHANGE 2: Call the smart fetcher (Tries Amazon first, then SerpApi)
  const results = await fetchProducts(keyword, region);

  if (!results || results.length === 0) {
    console.log("⚠ No results found (Amazon/SerpAPI)");
    return;
  }

  // Normalize + Save
  for (let raw of results) {
    const p = normalizeProduct(raw, region);
    if (p) await saveProduct(p, region);
  }

  console.log(`✅ Completed: ${keyword}`);

}, 3000);
