import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.SERPAPI_KEY;

export async function searchAmazon(keyword, region = "in") {
  try {
    const domain = region === "us" ? "amazon.com" : "amazon.in";

    const url = "https://serpapi.com/search.json";

    const params = {
      engine: "amazon",
      amazon_domain: domain,

      // FIX: SerpAPI now requires "k" (NOT "q")
      k: keyword,

      api_key: API_KEY,
      gl: region === "us" ? "us" : "in",
      hl: "en",
    };

    const response = await axios.get(url, { params });

    return response.data?.organic_results || [];

  } catch (error) {
    console.log("--------------- SERPAPI ERROR ---------------");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }

    console.log("------------------------------------------------");
    return [];
  }
}
