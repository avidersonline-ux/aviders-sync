export function normalizeProduct(raw, region = "in") {
  if (!raw || !raw.asin) return null;

  // ------------------------------
  // PRICE
  // ------------------------------
  const price =
    raw.extracted_price ||
    (typeof raw.price === "string"
      ? parseInt(raw.price.replace(/[^0-9]/g, "")) || 0
      : raw.price || 0);

  // ------------------------------
  // MRP (Correct for your JSON)
  // ------------------------------
  const mrp =
    raw.extracted_old_price ||
    (typeof raw.old_price === "string"
      ? parseInt(raw.old_price.replace(/[^0-9]/g, "")) || 0
      : 0);

  // ------------------------------
  // CATEGORY (Smart Guess)
  // ------------------------------
  let category = "general";
  const t = raw.title?.toLowerCase() || "";

  if (t.includes("iphone")) category = "Smartphones";
  else if (t.includes("macbook")) category = "Laptops";
  else if (t.includes("laptop")) category = "Laptops";
  else if (t.includes("earbuds")) category = "Earbuds";
  else if (t.includes("watch")) category = "Watches";

  // ------------------------------
  // BRAND DETECTION
  // ------------------------------
  let brand = raw.brand || "";

  if (!brand) {
    if (t.includes("iphone") || t.includes("apple") || t.includes("macbook"))
      brand = "Apple";
    else if (t.includes("samsung")) brand = "Samsung";
    else if (t.includes("redmi") || t.includes("xiaomi")) brand = "Xiaomi";
    else if (t.includes("boat")) brand = "boAt";
  }

  // ------------------------------
  // RATING + REVIEWS (all possible keys)
  // ------------------------------
  const rating =
    raw.rating ||
    raw.stars ||
    0;

  const reviews =
    raw.reviews ||
    raw.reviews_count ||
    raw.total_reviews ||
    0;

  // ------------------------------
  // IMAGES
  // ------------------------------
  const image =
    raw.thumbnail ||
    (raw.images ? raw.images[0] : null) ||
    raw.image ||
    null;

  const images = raw.images?.slice(0, 5) || (image ? [image] : []);

  // ------------------------------
  // STOCK
  // ------------------------------
  const stock = "in_stock"; // Search results rarely show unavailable

  // ------------------------------
  // VARIANTS
  // ------------------------------
  const variants = raw.variants || {};

  // ------------------------------
  // DELIVERY INFO
  // ------------------------------
  const delivery = raw.delivery || [];

  // ------------------------------
  // AFFILIATE URL
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl = raw.link || raw.product_link || "";
  if (!affiliateUrl)
    affiliateUrl = `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;

  affiliateUrl += affiliateUrl.includes("?") ? `&tag=${tag}` : `?tag=${tag}`;

  // ------------------------------
  // FINAL PRODUCT OBJECT
  // ------------------------------
  return {
    id: raw.asin,
    title: raw.title || "",
    brand,
    price,
    mrp,
    currency: region === "us" ? "USD" : "INR",

    category,
    rating,
    reviews,
    bought_last_month: raw.bought_last_month || "",
    stock,

    image,
    images,
    variants,
    delivery,

    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl,

    updated_at: new Date()
  };
}
