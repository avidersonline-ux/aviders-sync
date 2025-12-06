export function normalizeProduct(raw, region = "in") {
  if (!raw || !raw.asin) return null;

  // ------------------------------
  // PRICE EXTRACTION
  // ------------------------------
  let price = 0;

  // extracted price (best value)
  if (raw.extracted_price) price = raw.extracted_price;

  // price string → convert
  else if (raw.price && typeof raw.price === "string") {
    price = parseInt(raw.price.replace(/[^0-9]/g, "")) || 0;
  }

  // fallback numeric price
  else if (typeof raw.price === "number") {
    price = raw.price;
  }

  // ------------------------------
  // MRP EXTRACTION (ORIGINAL PRICE)
  // ------------------------------
  let mrp = 0;

  // SerpAPI mostly returns original_price_extracted
  if (raw.original_price_extracted) mrp = raw.original_price_extracted;

  // Sometimes list_price_extracted exists
  else if (raw.list_price_extracted) mrp = raw.list_price_extracted;

  // If string format exists
  else if (raw.original_price && typeof raw.original_price === "string") {
    mrp = parseInt(raw.original_price.replace(/[^0-9]/g, "")) || 0;
  }

  // fallback
  else if (raw.list_price && typeof raw.list_price === "string") {
    mrp = parseInt(raw.list_price.replace(/[^0-9]/g, "")) || 0;
  }

  // ------------------------------
  // AFFILIATE TAG
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl = raw.link || raw.product_link || "";

  if (affiliateUrl.includes("?"))
    affiliateUrl += `&tag=${tag}`;
  else
    affiliateUrl += `?tag=${tag}`;

  // ------------------------------
  // IMAGE
  // ------------------------------
  const image =
    raw.thumbnail ||
    raw.image ||
    (raw.images ? raw.images[0] : null) ||
    null;

  return {
    id: raw.asin,
    title: raw.title || "",
    brand: raw.brand || "",
    price: price,
    mrp: mrp,
    image: image,
    currency: region === "us" ? "USD" : "INR",
    category: "general",
    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl: affiliateUrl,
    updated_at: new Date()
  };
}
