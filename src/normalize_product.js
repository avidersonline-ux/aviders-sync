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
  // MRP (FULL EXPANDED SOURCES)
  // ------------------------------
  let mrp = 0;

  const mrpCandidates = [
    raw.original_price_extracted,
    raw.list_price_extracted,
    raw.mrp,
    raw.original_price,
    raw.list_price,
    raw.price_strikethrough,
    raw.product_details?.["M.R.P."],
    raw.product_details?.["M.R.P"],
    raw.product_details?.["Maximum Retail Price"],
    raw.product_details?.["List Price"],
    raw.product_details?.MRP
  ];

  for (let m of mrpCandidates) {
    if (!m) continue;
    if (typeof m === "number" && m > 0) {
      mrp = m;
      break;
    }
    if (typeof m === "string") {
      const num = parseInt(m.replace(/[^0-9]/g, ""));
      if (num > 0) {
        mrp = num;
        break;
      }
    }
  }

  // ------------------------------
  // CATEGORY (FULL SMART DETECTION)
  // ------------------------------
  let category = "general";

  const possibleCategories = [
    raw.category,
    raw.product_sub_category,
    raw.subcategory,
    raw.category_name,
    raw.breadcrumb_category,
  ];

  for (let c of possibleCategories) {
    if (typeof c === "string" && c.length > 2) {
      category = c;
      break;
    }
  }

  // From category_path[]
  if (category === "general") {
    if (Array.isArray(raw.category_path) && raw.category_path.length > 0) {
      const cp = raw.category_path.find(x => x.name);
      if (cp?.name) category = cp.name;
    }
  }

  // From Best Sellers Rank text
  if (category === "general" && raw.product_details?.["Best Sellers Rank"]) {
    const bsr = raw.product_details["Best Sellers Rank"];
    const match = bsr.match(/in (.*?)\)/i);
    if (match) category = match[1];
  }

  if (category.length > 40) category = "general";

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
