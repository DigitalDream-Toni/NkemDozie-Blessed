/* Regenerate products.json from the catalog in js/catalog.js.
   Run after editing that list:  node tools/build-products-json.mjs */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const catalog = require(path.join(root, "js/catalog.js"));

if (!Array.isArray(catalog) || catalog.length === 0) {
  throw new Error("js/catalog.js did not export a catalog.");
}

const products = catalog.map((item) => ({
  name: item.name,
  price: item.price,
  image: "assets/download.webp",
}));

writeFileSync(
  path.join(root, "products.json"),
  JSON.stringify(products, null, 2) + "\n"
);

console.log(`products.json written: ${products.length} products`);
