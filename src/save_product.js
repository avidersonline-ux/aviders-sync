import { ProductIN } from "./models/ProductIN.js";
import { ProductUS } from "./models/ProductUS.js";

export async function saveProduct(p) {
  const Model = p.currency === "INR" ? ProductIN : ProductUS;

  await Model.updateOne(
    { id: p.id },
    { $set: p },
    { upsert: true }
  );

  return true;
}
