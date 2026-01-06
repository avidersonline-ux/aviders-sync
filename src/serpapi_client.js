import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SDOG_KEY = process.env.SCRAPINGDOG_API_KEY;

// --------------------------------------------------
// 1️⃣ SerpAPI Search
// --------------------------------------------------
async function searchWithSerpAPI(keyword, region = "in") {
  const domain = region === "us" ? "amazon.com" : "amazon.in";

  const url = "https://serpapi.com/search.json";
  const params = {
    engine: "amazon",
    amazon_domain: domain,
    k: keyword,                 // SerpAPI requires `k`
    api_key: SERPAPI_KEY,
    gl: region === "us" ? "us" : "in",
    hl: "en",
  };

  try {
    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data?.organic_results || [];
  } catch (error) {
    console.log("❌ SerpAPI error:", error.message);
    throw error;
  }
}

// --------------------------------------------------
// 2️⃣ ScrapingDog Fallback (CORRECTED)
// --------------------------------------------------
async function searchWithScrapingDog(keyword, region = "in") {
  // According to ScrapingDog docs: domain should be TLD only (e.g., "in", "com")
  const domain = region === "us" ? "com" : "in";
  
  // According to ScrapingDog docs: country is required (ISO code)
  const country = region === "us" ? "us" : "in";

  const url = "https://api.scrapingdog.com/amazon/search";

  const params = {
    api_key: SDOG_KEY,
    domain: domain,        // Just "in" or "com" (NOT "amazon.in")
    query: keyword,
    page: "1",            // REQUIRED: Must be string according to docs
    country: country,     // REQUIRED: ISO country code
  };

  console.log("📤 ScrapingDog request params:", {
    domain: params.domain,
    query: params.query.substring(0, 50) + "...",
    page: params.page,
    country: params.country,
    api_key_length: params.api_key?.length || 0
  });

  try {
    const response = await axios.get(url, { 
      params, 
      timeout: 15000 
    });
    
    console.log("✅ ScrapingDog response received");
    
    // Based on ScrapingDog docs example, response.data is an array of products
    // Let's handle different possible response structures
    if (Array.isArray(response.data)) {
      // Response is already an array of products
      console.log(`📦 Found ${response.data.length} products via ScrapingDog`);
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Response might be an object with a products array
      if (Array.isArray(response.data.products)) {
        console.log(`📦 Found ${response.data.products.length} products via ScrapingDog`);
        return response.data.products;
      } else if (Array.isArray(response.data.results)) {
        console.log(`📦 Found ${response.data.results.length} products via ScrapingDog`);
        return response.data.results;
      } else {
        // Try to extract any array from the response object
        const arrayKeys = Object.keys(response.data).filter(key => Array.isArray(response.data[key]));
        if (arrayKeys.length > 0) {
          console.log(`📦 Found array in key "${arrayKeys[0]}" with ${response.data[arrayKeys[0]].length} items`);
          return response.data[arrayKeys[0]];
        }
      }
    }
    
    console.log("⚠ ScrapingDog returned unexpected structure:", 
      response.data ? typeof response.data : 'no data');
    return [];
    
  } catch (error) {
    console.log("❌ ScrapingDog API error:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
      console.error("Request URL:", error.config?.url);
      console.error("Request params:", JSON.stringify(error.config?.params, null, 2));
    } else if (error.request) {
      console.error("No response received:", error.message);
    } else {
      console.error("Request setup error:", error.message);
    }
    throw error;
  }
}

// --------------------------------------------------
// 3️⃣ Unified Search (SerpAPI → ScrapingDog)
// --------------------------------------------------
export async function searchAmazon(keyword, region = "in") {
  // Validate keyword
  if (!keyword || keyword.trim().length === 0) {
    console.log("❌ Empty keyword provided");
    return [];
  }
  
  const trimmedKeyword = keyword.trim();
  console.log(`\n🔍 Starting search for: "${trimmedKeyword}" (${region.toUpperCase()})`);
  
  // ---------- TRY SERPAPI FIRST ----------
  try {
    console.log(`🔎 Attempting SerpAPI...`);
    const serpResults = await searchWithSerpAPI(trimmedKeyword, region);
    
    if (serpResults && serpResults.length > 0) {
      console.log(`✅ SerpAPI success: ${serpResults.length} products found`);
      return serpResults; // Your normalize_products will handle this
    }
    
    console.log("⚠ SerpAPI returned no results, trying fallback...");
  } catch (error) {
    console.log("❌ SerpAPI failed, switching to ScrapingDog...");
  }

  // ---------- FALLBACK: SCRAPINGDOG ----------
  try {
    console.log(`🔎 Attempting ScrapingDog...`);
    const sdogResults = await searchWithScrapingDog(trimmedKeyword, region);
    
    if (sdogResults && sdogResults.length > 0) {
      console.log(`✅ ScrapingDog success: ${sdogResults.length} products found`);
      return sdogResults; // Your normalize_products will handle this
    }
    
    console.log("⚠ ScrapingDog returned no results");
    return [];
    
  } catch (error) {
    console.log("❌ Both SerpAPI and ScrapingDog failed");
    return [];
  }
}
