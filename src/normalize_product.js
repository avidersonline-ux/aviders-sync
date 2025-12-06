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
  // CATEGORY (IMPROVED DETECTION)
  // ------------------------------
  let category = "general";
  
  // First check explicit category fields
  const possibleCategories = [
    raw.category,
    raw.product_sub_category,
    raw.subcategory,
    raw.category_name,
    raw.breadcrumb_category,
    raw.product_details?.["Category"],
    raw.product_details?.["Department"]
  ];

  for (let c of possibleCategories) {
    if (typeof c === "string" && c.length > 2 && c !== "general") {
      category = c;
      break;
    }
  }

  // Check category_path array
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

  // Fallback: Guess from title keywords
  if (category === "general" && raw.title) {
    const t = raw.title.toLowerCase();
    if (t.includes("iphone") || t.includes("samsung") || t.includes("mobile") || t.includes("smartphone")) 
      category = "Smartphones";
    else if (t.includes("laptop") || t.includes("macbook") || t.includes("notebook")) 
      category = "Laptops";
    else if (t.includes("earbuds") || t.includes("earphones") || t.includes("headphones")) 
      category = "Audio";
    else if (t.includes("watch") || t.includes("smartwatch")) 
      category = "Watches";
    else if (t.includes("book") || t.includes("novel")) 
      category = "Books";
  }

  if (category.length > 40) category = category.substring(0, 40);

  // ------------------------------
  // BRAND (IMPROVED DETECTION)
  // ------------------------------
  let brand = raw.brand || "";
  
  // If brand is empty, try to extract from product_details
  if (!brand && raw.product_details) {
    const brandFields = ["Brand", "Manufacturer", "Product Brand"];
    for (const field of brandFields) {
      if (raw.product_details[field]) {
        brand = raw.product_details[field];
        break;
      }
    }
  }
  
  // If still empty, guess from title
  if (!brand && raw.title) {
    const t = raw.title.toLowerCase();
    if (t.includes("iphone") || t.includes("apple")) brand = "Apple";
    else if (t.includes("samsung")) brand = "Samsung";
    else if (t.includes("xiaomi") || t.includes("redmi") || t.includes("mi ")) brand = "Xiaomi";
    else if (t.includes("oneplus")) brand = "OnePlus";
    else if (t.includes("boat")) brand = "boAt";
    else if (t.includes("dell")) brand = "Dell";
    else if (t.includes("hp ") || t.includes("hewlett")) brand = "HP";
    else if (t.includes("lenovo")) brand = "Lenovo";
    else if (t.includes("amazon basics") || t.includes("amazonbasics")) brand = "Amazon Basics";
  }

  // ------------------------------
  // RATING + REVIEWS (FIXED - MULTIPLE FIELD SOURCES)
  // ------------------------------
  let rating = 0;
  let reviews = 0;
  
  // Check multiple possible rating fields
  const ratingFields = [
    raw.rating,
    raw.average_rating,
    raw.product_rating,
    raw.stars,
    raw.product_details?.["Rating"],
    raw.product_details?.["Average Customer Review"]
  ];
  
  for (const r of ratingFields) {
    if (typeof r === "number' && r > 0) {
      rating = parseFloat(r.toFixed(1));
      break;
    }
    if (typeof r === "string") {
      const num = parseFloat(r.replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) {
        rating = parseFloat(num.toFixed(1));
        break;
      }
    }
  }
  
  // Check multiple possible reviews count fields
  const reviewsFields = [
    raw.reviews_count,
    raw.reviews,
    raw.total_reviews,
    raw.ratings_count,
    raw.review_count,
    raw.product_details?.["Reviews"],
    raw.product_details?.["Customer Reviews"]
  ];
  
  for (const r of reviewsFields) {
    if (typeof r === "number' && r > 0) {
      reviews = r;
      break;
    }
    if (typeof r === "string") {
      const num = parseInt(r.replace(/[^0-9]/g, ""));
      if (num > 0) {
        reviews = num;
        break;
      }
    }
  }

  // ------------------------------
  // STOCK STATUS (IMPROVED)
  // ------------------------------
  let stock = "in_stock";
  
  if (raw.availability) {
    const avail = raw.availability.toLowerCase();
    if (avail.includes("unavailable") || avail.includes("out of stock") || 
        avail.includes("sold out") || avail.includes("currently unavailable")) {
      stock = "out_of_stock";
    } else if (avail.includes("in stock") || avail.includes("available")) {
      stock = "in_stock";
    } else if (avail.includes("preorder") || avail.includes("pre-order")) {
      stock = "preorder";
    }
  }

  // ------------------------------
  // IMAGES (IMPROVED)
  // ------------------------------
  const image = raw.thumbnail || raw.image || 
                (raw.images && raw.images[0]) || 
                raw.main_image || null;

  // Get multiple images - clean up thumbnails if needed
  let images = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    // Filter out thumbnails and get unique images
    const uniqueUrls = new Set();
    raw.images.forEach(img => {
      if (img && !img.includes('._AC_UY218_')) { // Filter out thumbnail pattern
        uniqueUrls.add(img);
      }
    });
    images = Array.from(uniqueUrls).slice(0, 8);
  }
  
  if (images.length === 0 && image) {
    images = [image];
  }

  // ------------------------------
  // AFFILIATE URL
  // ------------------------------
  const tag = region === "us" ? "aviders-20" : "aviders-21";
  let affiliateUrl = raw.link || raw.product_link || raw.url || "";
  
  if (!affiliateUrl) {
    affiliateUrl = `https://amazon.${region === "us" ? "com" : "in"}/dp/${raw.asin}`;
  }
  
  // Add affiliate tag
  affiliateUrl += affiliateUrl.includes("?") ? `&tag=${tag}` : `?tag=${tag}`;

  // ------------------------------
  // ADDITIONAL FIELDS
  // ------------------------------
  const delivery = raw.delivery || raw.shipping || [];
  const variants = raw.variants || {};
  const bought_last_month = raw.bought_last_month || 
                           raw.monthly_sales || 
                           (raw.product_details && raw.product_details["Bought in last month"]) || 
                           0;

  // ------------------------------
  // FINAL PRODUCT OBJECT
  // ------------------------------
  return {
    id: raw.asin,
    title: raw.title || raw.name || "",
    brand,
    price,
    mrp: mrp || price, // If no MRP found, use price as fallback
    currency: region === "us" ? "USD" : "INR",
    category,
    stock,
    rating,
    reviews,
    image,
    images,
    variants,
    delivery,
    bought_last_month: typeof bought_last_month === 'string' 
      ? parseInt(bought_last_month.replace(/[^0-9]/g, "")) || 0 
      : bought_last_month,
    source: region === "us" ? "amazon_us" : "amazon_in",
    affiliateUrl,
    raw_id: raw._id, // Keep reference to original document
    updated_at: new Date()
  };
}
