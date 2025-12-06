export const normalizeProduct = (raw, country) => {
  if (!raw.asin) return null;

  return {
    id: raw.asin,
    title: raw.title || "",
    brand: raw.brand || "",
    image: raw.thumbnail || raw.image || "",
    price: raw.price?.value || 0,
    mrp: raw.price?.raw || raw.price?.value || 0,
    currency: country === "in" ? "INR" : "USD",
    category: "general",
    source: country === "in" ? "amazon_in" : "amazon_us",
    affiliateUrl:
      raw.link +
      (country === "in"
        ? "?tag=aviders-21"
        : "?tag=aviders-20"),
    updated_at: new Date(),
  };
};
