// -----------------------------------------------------
// Category Cleaner (heuristic – safe, overridable later)
// -----------------------------------------------------
function cleanCategory(name = "", title = "") {
  if (!name) name = "general";

  let c = name.toLowerCase().trim();
  const t = title?.toLowerCase() || "";

  // Simple keyword heuristics (can grow later)
  if (t.includes("iphone")) c = "smartphones";
  else if (t.includes("macbook")) c = "laptops";
  else if (t.includes("laptop")) c = "laptops";
  else if (t.includes("watch")) c = "watches";
  else if (t.includes("earbud") || t.includes("buds")) c = "earbuds";
  else if (t.includes("headphone")) c = "headphones";

  return c || "general";
}

// -----------------------------------------------------
// MAIN NORMALIZER
// -----------------------------------------------------
export function normalizeProduct(raw, region = "in", keyword = "") {
  if (!raw || !raw.asin) return null;

  // ---------------------------------------------------
  // PRICE
  // ---------------------------------------------------
  let price = 0;
  if (raw.extracted_price) {
    price = raw.extracted_price;
  } else if (typeof raw.price === "string") {
    price = parseInt(raw.price.replace(/[^0-9]/g, "")) || 0;
  } else if (typeof raw.price === "number") {
    price = raw.price;
  }

  // ---------------------------------------------------
  // MRP
  // ---------------------------------------------------
  let mrp = 0;
  if (raw.extracted_old_price) {
    mrp = raw.extracted_old_price;
  } else if (raw.old_price) {
    mrp = parseInt(raw.old_price.replace(/[^0-9]/g, "")) || 0;
  } else if (raw.original_price_extracted) {
    mrp = raw.original_price_extracted;
  } else if (raw.list_price_extracted) {
    mrp = raw.list_price_extracted;
  }

  // ---------------------------------------------------
  // RATING & REVIEWS
  // ---------------------------------------------------
  const rating = typeof raw.rating === "number" ? raw.rating : 0;
  const reviews =
    typeof raw.reviews === "number"
      ? raw.reviews
      : typeof raw.reviews_count === "number"
      ? raw.reviews_count
      : 0;

  // ---------------------------------------------------
  // STOCK
  // ---------------------------------------------------
  let stock = "in_stock";
  if (
    raw.availability &&
    raw.availability.toLowerCase().includes("unavailable")
  ) {
    stock = "out_of_stock";
  }

  // ---------------------------------------------------
  // IMAGES
  // ---------------------------------------------------
  const primaryImage =
    raw.thumbnail ||
    raw.image ||
    (Array.isArray(raw.images) ? raw.images[0] : null) ||
    null;

  const images =
    Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images.slice(0, 5)
      : primaryImage
      ? [primaryImage]
      : [];

  // ---------------------------------------------------
  // CATEGORY (derived, NOT final truth)
  // ---------------------------------------------------
  let rawCategory = "general";
  if (raw.category) {
    rawCategory = raw.category;
  } else if (raw.category_path?.length > 0) {
    rawCategory = raw.category_path[0]?.name || "general";
  }

  const category = cleanCategory(rawCategory, raw.title);

  // ---------------------------------------------------
  // 🔑 KEYWORD INTENT (THIS IS THE IMPORTANT PART)
  // ---------------------------------------------------
  const keywordTag = keyword ? keyword.toLowerCase().trim() : null;

  // This becomes your SHOP category (editable later)
  const shopCategory = keywordTag || category;

  // ---------------------------------------------------
  // AFFILIATE URL
  // ---------------------------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl =
    raw.link ||
    raw.link_clean ||
    raw.product_link ||
    `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;

  affiliateUrl += affiliateUrl.includes("?")
    ? `&tag=${tag}`
    : `?tag=${tag}`;

  // ---------------------------------------------------
  // FINAL STRUCTURED PRODUCT (SINGLE SOURCE OF TRUTH)
  // ---------------------------------------------------
  return {
    id: raw.asin,

    title: raw.title || "",
    brand: raw.brand || "",

    price,
    mrp,
    currency: region === "us" ? "USD" : "INR",

    // 🔹 categories
    category,          // derived (auto)
    shopCategory,      // intent-based (YOU control this later)
    keywordTag,        // why this product exists in DB

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

    updated_at: new Date(),
  };
}
