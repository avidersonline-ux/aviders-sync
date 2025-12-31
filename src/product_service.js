// product_service.js
import { searchOfficialAmazon } from "./amazon_client.js";
import { searchAmazon as searchSerpApi } from "./serpapi_client.js"; // Renaming import for clarity

export async function fetchProducts(keyword, region = "in") {
  console.log(`\n🔍 [ProductService] Request: "${keyword}"`);

  // --- STRATEGY 1: AMAZON OFFICIAL ---
  try {
    const amazonResults = await searchOfficialAmazon(keyword, region);
    
    if (amazonResults.length > 0) {
      console.log(`✅ [ProductService] Served via Amazon Official API (${amazonResults.length} items)`);
      return amazonResults;
    }
  } catch (error) {
    // Log the error but don't stop!
    console.warn(`⚠️ [ProductService] Amazon API skipped/failed: ${error.message}`);
    // Common errors: "TooManyRequests" (No sales yet), "InvalidClientToken" (Bad keys)
  }

  // --- STRATEGY 2: SERPAPI FALLBACK ---
  console.log("🔄 [ProductService] Falling back to SerpApi...");
  try {
    const serpResults = await searchSerpApi(keyword, region);
    console.log(`✅ [ProductService] Served via SerpApi (${serpResults.length} items)`);
    return serpResults;
  } catch (error) {
    console.error(`❌ [ProductService] FATAL: All providers failed.`);
    return [];
  }
}
