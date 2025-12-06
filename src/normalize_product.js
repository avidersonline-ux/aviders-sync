export function normalizeProduct(raw, region = "in") {
  if (!raw || !raw.asin) return null;

  // ------------------------------
  // PRICE
  // ------------------------------
  let price = 0;

  if (raw.extracted_price) price = raw.extracted_price;
  else if (raw.price && typeof raw.price === "string")
    price = parseInt(raw.price.replace(/[^0-9]/g, "")) || 0;
  else if (typeof raw.price === "number") price = raw.price;

  // ------------------------------
  // MRP (MULTIPLE SOURCES)
  // ------------------------------
  let mrp = 0;

  if (raw.original_price_extracted) mrp = raw.original_price_extracted;
  else if (raw.list_price_extracted) mrp = raw.list_price_extracted;
  else if (raw.original_price)
    mrp = parseInt(raw.original_price.replace(/[^0-9]/g, "")) || 0;
  else if (raw.list_price)
    mrp = parseInt(raw.list_price.replace(/[^0-9]/g, "")) || 0;

  // Additional MRP sources
  if (mrp === 0 && raw.product_details) {
    const pd = raw.product_details;
    let possible = [
      pd["M.R.P."],
      pd["M.R.P"],
      pd["List Price"],
      pd["Maximum Retail Price"],
      pd["MRP"]
    ];
    for (let v of possible) {
      if (typeof v === "string") {
        const num = parseInt(v.replace(/[^0-9]/g, ""));
        if (num > 0) {
          mrp = num;
          break;
        }
      }
    }
  }

  // ------------------------------
  // CATEGORY AUTO DETECTION
  // ------------------------------
  let category = "general";

  if (raw.category) category = raw.category;
  else if (raw.category_path && raw.category_path.length > 0)
    category = raw.category_path[0].name || "general";
  else if (raw.product_details && raw.product_details["Best Sellers Rank"]) {
    const bsr = raw.product_details["Best Sellers Rank"];
    const match = bsr.match(/in (.*?)\)/i);
    if (match) category = match[1];
  }

  // ------------------------------
  // RATING + REVIEWS
  // ------------------------------
  const rating = raw.rating || 0;
  const reviews = raw.reviews_count || 0;

  // ------------------------------
  // STOCK STATUS
  // ------------------------------
  const stock =
    raw.availability?.toLowerCase().includes("unavailable")
      ? "out_of_stock"
      : "in_stock";

  // ------------------------------
  // IMAGES
  // ------------------------------
  const image =
    raw.thumbnail ||
    raw.image ||
    (raw.images ? raw.images[0] : null) ||
    null;

  const images = raw.images?.slice(0, 5) || (image ? [image] : []);

  // ------------------------------
  // AFFILIATE URL
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl = raw.link || raw.product_link || "";
  if (!affiliateUrl) affiliateUrl = `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;
  affiliateUrl += affiliateUrl.includes("?") ? `&tag=${tag}` : `?tag=${tag}`;

  // ------------------------------
  // FINAL PRODUCT OBJECT
  // ------------------------------
  return {
    id: raw.asin,
    title: raw.title || "",
    brand: raw.brand || "",
    price,
    mrp,
    currency: region === "us" ? "USD" : "INR",

    category,
    stock,
    rating,
    reviews,

    image,
    images,

    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl,

    updated_at: new Date()
  };
}
