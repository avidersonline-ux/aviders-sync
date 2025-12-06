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

  // ------ NEW IMPORTANT MRP SOURCES -------
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
  // AFFILIATE LINK
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
    price,
    mrp,
    image,
    currency: region === "us" ? "USD" : "INR",
    category: "general",
    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl,
    updated_at: new Date()
  };
}
