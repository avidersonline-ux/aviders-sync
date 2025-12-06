export function normalizeProduct(raw, region = "in") {
  if (!raw || !raw.asin) return null;

  // --- PRICE EXTRACTION ---
  let price = 0;

  if (raw.extracted_price) price = raw.extracted_price;
  else if (raw.price && typeof raw.price === "number") price = raw.price;
  else if (raw.price && typeof raw.price === "string") {
    price = parseInt(raw.price.replace(/[^0-9]/g, "")) || 0;
  }

  // --- MRP EXTRACTION ---
  let mrp = 0;

  if (raw.extracted_mrp) mrp = raw.extracted_mrp;
  else if (raw.mrp && typeof raw.mrp === "string") {
    mrp = parseInt(raw.mrp.replace(/[^0-9]/g, "")) || 0;
  }

  // --- AFFILIATE TAG ---
  const tag = region === "us" ? "aviders-20" : "aviders-21";

  let affiliateUrl = raw.link || raw.product_link || "";
  if (affiliateUrl.includes("?")) {
    affiliateUrl += `&tag=${tag}`;
  } else {
    affiliateUrl += `?tag=${tag}`;
  }

  // --- IMAGE FIELD ---
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
