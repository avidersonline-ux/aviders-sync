import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.SERPAPI_KEY;

export async function searchAmazon(keyword, region = "in") {
  try {
    const domain =
      region === "us" ? "amazon.com" : "amazon.in";

    const url = "https://serpapi.com/search.json";

    const params = {
      engine: "amazon",
      amazon_domain: domain,
      q: keyword,
      api_key: API_KEY,
    };

    const response = await axios.get(url, { params });

    // Only return useful product objects
    return response.data?.organic_results || [];

  } catch (error) {
    console.error("SerpAPI error:", error.message);
    return [];
  }
}
