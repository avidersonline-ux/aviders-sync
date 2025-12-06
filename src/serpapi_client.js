import axios from "axios";

export const searchAmazon = async (keyword, country) => {
  const url = `https://serpapi.com/search.json?engine=amazon&amazon_domain=${
    country === "in" ? "amazon.in" : "amazon.com"
  }&q=${keyword}&api_key=${process.env.SERPAPI_KEY}`;

  const res = await axios.get(url);
  return res.data.organics || res.data.organic_results || [];
};
