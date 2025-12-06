import { cleanCategory } from "./category_manager.js";

export function cleanCategory(name = "", title = "") {
  if (!name) name = "general";

  let c = name.toLowerCase().trim();

  if (title.toLowerCase().includes("iphone")) c = "smartphones";
  if (title.toLowerCase().includes("macbook")) c = "laptops";
  if (title.toLowerCase().includes("watch")) c = "watches";
  if (title.toLowerCase().includes("earbud") || title.toLowerCase().includes("buds"))
    c = "earbuds";

  return c;
}

  // ------------------------------
  // PRICE
  // ------------------------------
  let price = 0;

  if (raw.extracted_price) {
    price = raw.extracted_price;
  } else if (typeof raw.price === "string") {
    price = parseInt(raw.price.replace(/[^0-9]/g, "")) || 0;
  } else if (typeof raw.price === "number") {
    price = raw.price;
  }

  // ------------------------------
  // MRP (Compare Price)
  // ------------------------------
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

  // ------------------------------
  // RATING & REVIEWS
  // ------------------------------
  const rating =
    typeof raw.rating === "number" ? raw.rating : 0;

  const reviews =
    typeof raw.reviews === "number" || typeof raw.reviews_count === "number"
      ? raw.reviews || raw.reviews_count
      : 0;

  // ------------------------------
  // STOCK STATUS
  // ------------------------------
  let stock = "in_stock";

  if (raw.availability && raw.availability.toLowerCase().includes("unavailable")) {
    stock = "out_of_stock";
  }

  // ------------------------------
  // IMAGES
  // ------------------------------
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

  // ------------------------------
  // CATEGORY DETECTION (Hybrid Logic)
  // ------------------------------
  let rawCategory = "general";

  if (raw.category) {
    rawCategory = raw.category;
  } else if (raw.category_path?.length > 0) {
    rawCategory = raw.category_path[0].name || "general";
  }

  const category = cleanCategory(rawCategory, raw.title);

  // ------------------------------
  // AFFILIATE URL
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";
  let affiliateUrl =
    raw.link ||
    raw.link_clean ||
    raw.product_link ||
    `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;

  affiliateUrl += affiliateUrl.includes("?")
    ? `&tag=${tag}`
    : `?tag=${tag}`;

  // ------------------------------
  // FINAL STRUCTURED PRODUCT
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

    updated_at: new Date(),
  };
}
