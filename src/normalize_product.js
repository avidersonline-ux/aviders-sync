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
  // MRP (REAL MRP)
  // ------------------------------
  let mrp = 0;

  if (raw.extracted_old_price) mrp = raw.extracted_old_price; // BEST FIELD
  else if (raw.old_price)
    mrp = parseInt(raw.old_price.replace(/[^0-9]/g, "")) || 0;
  else if (raw.original_price_extracted) mrp = raw.original_price_extracted;
  else if (raw.list_price_extracted) mrp = raw.list_price_extracted;

  // ------------------------------
  // RATING & REVIEWS
  // ------------------------------
  const rating = typeof raw.rating === "number" ? raw.rating : 0;
  const reviews = typeof raw.reviews === "number" ? raw.reviews : 0;

  // ------------------------------
  // STOCK
  // ------------------------------
  const stock =
    raw.availability?.toLowerCase().includes("unavailable")
      ? "out_of_stock"
      : "in_stock";

  // ------------------------------
  // IMAGES
  // ------------------------------
  const primaryImage =
    raw.thumbnail ||
    raw.image ||
    (raw.images ? raw.images[0] : null) ||
    null;

  const images = raw.images?.slice(0, 5) || (primaryImage ? [primaryImage] : []);

  // ------------------------------
  // CATEGORY
  // ------------------------------
  let category = "general";

  if (raw.category) category = raw.category;
  else if (raw.category_path?.length > 0)
    category = raw.category_path[0]?.name || "general";

  // ------------------------------
  // AFFILIATE URL
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl =
    raw.link ||
    raw.link_clean ||
    raw.product_link ||
    `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;

  affiliateUrl += affiliateUrl.includes("?") ? `&tag=${tag}` : `?tag=${tag}`;

  // ------------------------------
  // RETURN FINAL PRODUCT STRUCTURE
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

    image: primaryImage,
    images,

    bought_last_month: raw.bought_last_month || null,
    sponsored: raw.sponsored || false,
    delivery: raw.delivery || [],

    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl,

    updated_at: new Date()
  };
}
