import mongoose from "mongoose";
import ProductIN from "./models/ProductIN.js";
import ProductUS from "./models/ProductUS.js";

export async function saveProduct(product) {
  const Model = product.currency === "INR" ? ProductIN : ProductUS;

  const existing = await Model.findOne({ id: product.id });

  // IF NOTHING CHANGED → DO NOT SAVE (avoid duplicate writes)
  if (existing &&
      existing.price === product.price &&
      existing.mrp === product.mrp &&
      existing.rating === product.rating &&
      existing.reviews === product.reviews) 
  {
    console.log("Skipping unchanged:", product.id);
    return;
  }

  // Save changes
  await Model.updateOne({ id: product.id }, { $set: product }, { upsert: true });
  console.log("Updated:", product.id);

  // Price history only when price actually changed
  if (!existing || existing.price !== product.price) {
    await mongoose.connection.collection("price_history").insertOne({
      asin: product.id,
      price: product.price,
      mrp: product.mrp,
      source: product.source,
      date: new Date()
    });
    console.log("Price history added:", product.id);
  }
}
