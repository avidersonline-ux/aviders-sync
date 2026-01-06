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

  const response = await axios.get(url, { params });
  return response.data?.organic_results || [];
}

// --------------------------------------------------
// 2️⃣ ScrapingDog Fallback
// --------------------------------------------------
async function searchWithScrapingDog(keyword, region = "in") {
  const domain = region === "us" ? "amazon.com" : "amazon.in";

  const url = "https://api.scrapingdog.com/amazon/search";

  const params = {
    api_key: SDOG_KEY,
    domain: domain,
    query: keyword,
    page: 1,
  };

  const response = await axios.get(url, { params });
  return response.data?.products || [];
}

// --------------------------------------------------
// 3️⃣ Unified Search (SerpAPI → ScrapingDog)
// --------------------------------------------------
export async function searchAmazon(keyword, region = "in") {
  // ---------- TRY SERPAPI FIRST ----------
  try {
    console.log(`🔎 Searching via SerpAPI: ${keyword}`);
    const serpResults = await searchWithSerpAPI(keyword, region);
    if (serpResults.length > 0) return serpResults;
    console.log("⚠ SerpAPI returned no results, trying fallback...");
  } catch (error) {
    console.log("❌ SerpAPI failed, switching to ScrapingDog...");
  }

  // ---------- FALLBACK: SCRAPINGDOG ----------
  try {
    console.log(`🔎 Searching via ScrapingDog: ${keyword}`);
    const sdogResults = await searchWithScrapingDog(keyword, region);
    return sdogResults;
  } catch (error) {
    console.log("❌ ScrapingDog failed");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    return [];
  }
}
