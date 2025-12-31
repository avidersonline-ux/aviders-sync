// amazon_client.js
import AmazonPaapi from "amazon-paapi";
import dotenv from "dotenv";
dotenv.config();

// Amazon Credentials from .env
const commonParams = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: process.env.AMAZON_PARTNER_TAG,
  PartnerType: "Associates",
  Marketplace: "www.amazon.in", // Default to India, change logic if needed
};

export async function searchOfficialAmazon(keyword, region = "in") {
  // 1. Safety Check: If keys aren't in Railway yet, fail immediately so fallback runs
  if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY) {
    throw new Error("Missing Amazon Credentials");
  }

  // Update marketplace based on region
  commonParams.Marketplace = region === "us" ? "www.amazon.com" : "www.amazon.in";

  const requestParameters = {
    Keywords: keyword,
    SearchIndex: "All",
    ItemCount: 10,
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "Offers.Listings.Price",
      "ItemInfo.ExternalIds", 
      "ItemInfo.ProductInfo"
    ],
  };

  try {
    console.log("🌟 [AmazonClient] Calling PA-API...");
    const data = await AmazonPaapi.SearchItems(commonParams, requestParameters);

    if (!data.SearchResult || !data.SearchResult.Items) {
      return [];
    }

    // MAPPER: Convert Amazon Data -> SerpApi Format
    // This ensures your database logic doesn't break.
    return data.SearchResult.Items.map((item) => ({
      title: item.ItemInfo?.Title?.DisplayValue || "Unknown Title",
      asin: item.ASIN,
      link: item.DetailPageURL,
      thumbnail: item.Images?.Primary?.Large?.URL || "",
      price: {
        current_price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        currency: item.Offers?.Listings?.[0]?.Price?.Currency || (region === "us" ? "USD" : "INR"),
      },
      // Flatten price for simple DB storage
      price_flat: item.Offers?.Listings?.[0]?.Price?.Amount || 0, 
    }));

  } catch (error) {
    // Throw error so the parent service knows to switch to fallback
    throw error; 
  }
}
