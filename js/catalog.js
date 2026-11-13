/* =========================================================
   catalog.js — default product catalog (single source)

   The list below is merged into the shop's saved catalog. A name
   is only ever delivered once, so products the owner deletes stay
   deleted, even when this list grows.

   products.json is generated from this file:
     node tools/build-products-json.mjs
   ========================================================= */
(function () {
  "use strict";

  var PRODUCTS_KEY = "pss_products";
  var SEEN_KEY = "pss_catalog_seen";
  var PRODUCT_IMAGE = "assets/download.webp";

  var CATALOG = [
    { name: "Tasty Cube Chicken Powdered 1kg", price: "6000" },
    { name: "Tasty Cube Chicken Powdered 250g", price: "2000" },
    { name: "Tasty Cube Chicken Powdered 400g", price: "4500" },
    { name: "Maggi Chicken Powdered", price: "2000" },
    { name: "Maggi Beef Powdered", price: "2000" },
    { name: "Knorr Chicken Powdered", price: "2000" },
    { name: "Knorr Beef", price: "2200" },
    { name: "Knorr Chicken", price: "2500" },
    { name: "Royco", price: "1500" },
    { name: "Terra Chicken Cube", price: "1800" },
    { name: "Terra Gold Cube", price: "1800" },
    { name: "Terra Crayfish Cube", price: "1800" },
    { name: "Star Maggi Cube", price: "1600" },
    { name: "Onga Cube Shrimps", price: "6000" },
    { name: "Benny", price: "7000" },
    { name: "Emma Coconut", price: "1200" },
    { name: "Native Coconut Spices (pkt)", price: "2000" },
    { name: "Toothpick (pkt)", price: "1200" },
    { name: "Euroma Bayleaf 125g", price: "2000" },
    { name: "White Onions & Shallot", price: "3000" },
    { name: "Euroma Bayleaf 50g", price: "1000" },
    { name: "Maruico Bayleaf 125g", price: "2000" },
    { name: "Nutmeg (pkt)", price: "8000" },
    { name: "Salt 1kg", price: "500" },
    { name: "Salt 500g", price: "250" },
    { name: "Salt 250g", price: "150" },
    { name: "Ochra Chicken", price: "800" },
    { name: "Semas Butter", price: "1200" },
    { name: "Kings Butter", price: "1000" },
    { name: "Sona 1kg Sachet", price: "2500" },
    { name: "Sona Roll", price: "800" },
    { name: "Gyma", price: "800" },
    { name: "Super Jollof Spice (Big)", price: "2000" },
    { name: "Super Jollof Spice (Small)", price: "1000" },
    { name: "Native Mix (Big)", price: "2000" },
    { name: "Native Mix (Small)", price: "1000" },
    { name: "Spaghetti", price: "1000" },
    { name: "Moringa Seed", price: "1000" },
    { name: "Golden Terra Oil", price: "30000" },
    { name: "Sea Salt (Big Container)", price: "3000" },
    { name: "Sea Salt (Small Container)", price: "1500" },
    { name: "Sesame Oil Big Amoys", price: "6000" },
    { name: "Sesame Oil (Big – Amoy)", price: "5500" },
    { name: "Sesame Oil (Small)", price: "2000" },
    { name: "Oyster (Small)", price: "1500" },
    { name: "Basmati Rice (5kg)", price: "23000" },
    { name: "Dark Soy Sauce (Small)", price: "1500" },
    { name: "Dark Soy Sauce (Big)", price: "5000" },
    { name: "Light Soy Sauce (Small)", price: "1500" },
    { name: "Light Soy Sauce (Big)", price: "5000" },
    { name: "Sweet Chilli (Small)", price: "1300" },
    { name: "Oyster (Big)", price: "5500" },
    { name: "Powdered Turmeric (Big Plate)", price: "2000" },
    { name: "Powdered Turmeric (Small Plate)", price: "1000" },
    { name: "Powdered Ginger (Big Plate)", price: "2000" },
    { name: "Powdered Ginger (Small Plate)", price: "1000" },
    { name: "Pepper Soup Mix (Big Plate)", price: "2000" },
    { name: "Pepper Soup Mix (Small Plate)", price: "1000" },
    { name: "Almond Nut (Packet)", price: "5000" },
    { name: "White Vinegar (Bottle)", price: "1200" },
    { name: "Heinz Apple Cider Vinegar (Bottle)", price: "15000" },
    { name: "Black Pepper (Ground)", price: "3500" },
    { name: "Sunflower Seed (Packet)", price: "4000" },
    { name: "Sesame Seed (1 Packet)", price: "3000" },
    { name: "Pumpkin Seed (1 Packet)", price: "4000" },
    { name: "Servitte", price: "250" },
    { name: "Clove (Plate)", price: "2000" },
    { name: "Chia Seed (Plate)", price: "2000" },
    { name: "Flat Seed (Plate)", price: "2500" },
    { name: "Cinnamon Stick", price: "1000" },
    { name: "Mi Una (Roll)", price: "1300" },
    { name: "Kitchen Glory Beef (Roll)", price: "1500" },
    { name: "Kitchen Glory Chicken (Roll)", price: "1500" },
    { name: "Gino Curry (Roll)", price: "600" },
    { name: "Super Delicious Oil (25 Litres)", price: "70000" },
    { name: "Kings Oil (25 Litres)", price: "75000" },
    { name: "Palm Oil (150cl)", price: "2500" },
    { name: "Fenugreek (Plate)", price: "5000" },
    { name: "Baked Beans", price: "1500" },
    { name: "Sweet Corn", price: "1200" },
    { name: "Super Gold Tomatoes (Pot)", price: "5000" },
    { name: "Ric-Giko Tomatoes (Pot)", price: "5000" },
    { name: "Super Delicious (Pot)", price: "5000" },
    { name: "Clappa Tomatoes (Pot)", price: "5500" },
    { name: "Soupy Tomatoes (Pot)", price: "6000" },
    { name: "St. Rita Tomatoes (Pot)", price: "10000" },
    { name: "St. Rita Round", price: "950" },
    { name: "St. Rita Long", price: "1800" },
    { name: "Gino Long", price: "1200" },
    { name: "Super Gold Round", price: "700" },
    { name: "Fried Shallot (Biggest)", price: "6000" },
    { name: "Fried Shallot (Bigger)", price: "2500" },
    { name: "Fried Shallot (Big)", price: "1500" },
    { name: "Sachet Fried Shallot", price: "800" },
    { name: "Tiger Curry (100g)", price: "1000" },
    { name: "Tiger Thyme (50g)", price: "1000" },
    { name: "Ama Wonda Thyme (50g)", price: "900" },
    { name: "Tiger Rosemary (250g)", price: "5000" },
    { name: "Marvico Rosemary (250g)", price: "3000" },
    { name: "Ama Wonda Curry (100g)", price: "900" },
    { name: "Ama Wonda Jollof", price: "800" },
    { name: "Badia", price: "8000" },
    { name: "Badia Curry", price: "7000" },
    { name: "Marvico Thyme (250g)", price: "3000" },
    { name: "Sarama Chicken Seasoning", price: "800" },
    { name: "Kitchen Glory Beef", price: "1200" },
    { name: "Kitchen Glory Chicken", price: "1200" },
    { name: "Larsor Beef", price: "800" },
    { name: "Larsor Chicken", price: "900" },
    { name: "Larsor Fish", price: "800" },
    { name: "Spicity Stew & Jollof", price: "800" },
    { name: "All Purpose Paramount", price: "1000" },
    { name: "All Purpose Ochra", price: "800" },
    { name: "Tasty in Chicken Seasoning", price: "800" },
    { name: "Mivina", price: "1000" },
    { name: "Paramount Chicken", price: "800" },
    { name: "Super Delicious Chicken Seasoning", price: "800" },
    { name: "Ahubadia Shrimps", price: "800" },
    { name: "Onga Classic", price: "200" },
    { name: "Onga Stew", price: "200" },
    { name: "Super Delicacy Condensed Milk", price: "2500" },
    { name: "Heinz Ketchup", price: "7000" },
    { name: "Laziz Tomatoes Ketchup", price: "2500" },
    { name: "Munro Corn Flour", price: "1800" },
    { name: "Rich Gold Corn Flour", price: "1200" },
    { name: "Morning Fresh", price: "3000" },
    { name: "Mama Lemon", price: "2500" },
    { name: "Ajino moto (30g)", price: "2000" },
    { name: "Ajino moto (100g)", price: "700" },
    { name: "Ducros Curry (Cup)", price: "800" },
    { name: "Ducros Curry (1kg)", price: "18000" },
    { name: "Ducros Curry (250g)", price: "5000" },
    { name: "Masala Curry (250g)", price: "2300" },
    { name: "Ama Wanda Curry (500g)", price: "4000" },
    { name: "Supreme Curry", price: "6000" },
    { name: "Gel Curry", price: "8000" },
    { name: "Supreme Thyme", price: "6000" },
    { name: "Onga Chicken Cube", price: "5000" },
    { name: "Tasty Cube Chicken", price: "3500" },
    { name: "Tasty Cube Crayfish", price: "3000" },
    { name: "Maggi Chicken Cube", price: "3500" },
    { name: "Golden Terra Oil (5 Litres)", price: "18000" },
    { name: "Laziz Oil (5 Litres)", price: "18500" },
    { name: "Laziz Oil (3 Litres)", price: "13500" },
    { name: "Royal Sunflower Oil (5 Litres)", price: "25000" },
    { name: "Laziz Premium Oil (5 Litres)", price: "19000" },
    { name: "Olive Oil (Chinese, 5 Litres)", price: "35000" },
    { name: "Real Fresh Olive Oil (4 Litres)", price: "45000" },
    { name: "Royal Olive Oil (4 Litres)", price: "50000" },
    { name: "Real Fresh Olive Oil (1 Litre)", price: "20000" },
    { name: "Scudieri Olive Oil (2 Litres)", price: "35000" },
    { name: "Whippy Mayonnaise (Big)", price: "2800" },
    { name: "Bama (Big)", price: "4500" },
    { name: "Bama (Medium)", price: "2500" },
    { name: "Bama (Small)", price: "1700" },
    { name: "Jago (Big)", price: "3000" },
    { name: "Sunripe Green Peas (Big)", price: "2000" },
    { name: "Sunripe Green Peas (Small)", price: "1300" },
    { name: "Mushroom", price: "1800" },
    { name: "Farrow's (Small)", price: "1800" },
    { name: "Hot Dog", price: "3000" },
    { name: "Coconut Milk", price: "1800" },
  ];

  /* tools/build-products-json.mjs imports this list. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CATALOG;
  }

  /* In Node there is no browser storage, so stop here. */
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  function nameKey(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  function readSeen() {
    try {
      var raw = localStorage.getItem(SEEN_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function seed() {
    try {
      var raw = localStorage.getItem(PRODUCTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) {
        list = [];
      }

      var byName = {};
      list.forEach(function (item) {
        if (item && typeof item === "object" && item.name) {
          byName[nameKey(item.name)] = item;
        }
      });

      var seen = readSeen();
      var delivered = {};

      if (seen) {
        seen.forEach(function (key) {
          delivered[key] = true;
        });
      } else if (localStorage.getItem("pss_catalog_seeded_v8")) {
        /* Upgrading from the old flag: this visitor already has the whole
           list, so only fill in missing photos — never re-add deletions. */
        CATALOG.forEach(function (item) {
          delivered[nameKey(item.name)] = true;
        });
      }

      var stamp = Date.now().toString(36);
      var changed = false;

      CATALOG.forEach(function (item, index) {
        var key = nameKey(item.name);
        var saved = byName[key];

        if (saved && !saved.image) {
          saved.image = PRODUCT_IMAGE;
          changed = true;
        }

        if (delivered[key]) {
          return;
        }

        if (!saved) {
          list.push({
            id: "p_" + stamp + "_" + index.toString(36),
            name: item.name,
            price: item.price,
            image: PRODUCT_IMAGE,
          });
          changed = true;
        }

        delivered[key] = true;
      });

      if (!changed && seen) {
        return;
      }

      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
      localStorage.setItem(SEEN_KEY, JSON.stringify(Object.keys(delivered)));
    } catch (error) {
      /* Storage may be unavailable or full; the page still works. */
    }
  }

  seed();
})();
