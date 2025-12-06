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
      k: keyword,
      api_key: API_KEY,
      gl: region === "us" ? "us" : "in",   // geo location
      hl: region === "us" ? "en" : "en",   // language
    };

    const response = await axios.get(url, { params });

    // Return only the relevant product array
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
