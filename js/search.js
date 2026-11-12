/* =========================================================
   search.js — Home page product search
   ========================================================= */
(function () {
  "use strict";

  var PSS = window.PSS;
  var PRODUCTS_KEY = PSS.PRODUCTS_KEY;

  var IMAGE_PLACEHOLDER =
    "data:image/svg+xml;charset=utf-8," +
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E" +
    "%3Crect width='400' height='300' fill='%23e7ebf9'/%3E" +
    "%3Ccircle cx='200' cy='132' r='46' fill='%23c3cdf0'/%3E" +
    "%3Ctext x='200' y='235' font-family='Arial' font-size='20' text-anchor='middle' fill='%23808bb0'%3ENo image%3C/text%3E" +
    "%3C/svg%3E";

  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var meta = document.getElementById("searchMeta");
  var results = document.getElementById("results");
  var resultsLabel = document.getElementById("resultsLabel");
  var notFoundQuery = document.getElementById("notFoundQuery");

  var states = {
    idle: document.getElementById("stateIdle"),
    loading: document.getElementById("stateLoading"),
    empty: document.getElementById("stateEmpty"),
    notFound: document.getElementById("stateNotFound"),
  };

  var searchTimer = null;

  /* ---------- data ---------- */

  function loadProducts() {
    try {
      var raw = localStorage.getItem(PRODUCTS_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(function (item) {
        return item && typeof item === "object" && item.name;
      });
    } catch (error) {
      return [];
    }
  }

  /* ---------- ui ---------- */

  function showState(name) {
    Object.keys(states).forEach(function (key) {
      states[key].hidden = key !== name;
    });
    results.hidden = true;
    results.innerHTML = "";
    if (resultsLabel) {
      resultsLabel.hidden = true;
    }
  }

  function showResults() {
    Object.keys(states).forEach(function (key) {
      states[key].hidden = true;
    });
    results.hidden = false;
  }

  function updateMeta() {
    var total = loadProducts().length;

    if (total === 0) {
      meta.innerHTML =
        '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>' +
        "No products in the catalog yet.";
      return;
    }

    meta.innerHTML =
      '<i class="fa-solid fa-database" aria-hidden="true"></i>' +
      total +
      (total === 1 ? " product" : " products") +
      " available in your catalog.";
  }

  /* Split "₦10,000" so the currency mark can be styled separately. */
  function splitPrice(value) {
    var formatted = PSS.formatPrice(value);
    var match = formatted.match(/^([^0-9]+)\s*(.+)$/);
    if (!match) {
      return { symbol: "", amount: formatted };
    }
    return { symbol: match[1].trim(), amount: match[2] };
  }

  function productCard(product) {
    var card = document.createElement("article");
    card.className = "product-card";

    var media = document.createElement("div");
    media.className = "product-media";

    var img = document.createElement("img");
    img.src = product.image ? product.image : IMAGE_PLACEHOLDER;
    img.alt = product.name;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      img.src = IMAGE_PLACEHOLDER;
    });

    media.appendChild(img);

    var body = document.createElement("div");
    body.className = "product-body";

    var name = document.createElement("h2");
    name.className = "product-name";
    name.textContent = product.name;

    var price = document.createElement("p");
    price.className = "product-price";

    var priceLabel = document.createElement("span");
    priceLabel.className = "product-price-label";
    priceLabel.textContent = "Price";

    var priceValue = document.createElement("span");
    priceValue.className = "product-price-value";

    var parts = splitPrice(product.price);
    if (parts.symbol) {
      var symbol = document.createElement("span");
      symbol.className = "currency";
      symbol.textContent = parts.symbol;
      priceValue.appendChild(symbol);
    }
    priceValue.appendChild(document.createTextNode(parts.amount));

    price.appendChild(priceLabel);
    price.appendChild(priceValue);

    body.appendChild(name);
    body.appendChild(price);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function renderResults(matches, term) {
    results.innerHTML = "";
    var fragment = document.createDocumentFragment();

    matches.forEach(function (product) {
      fragment.appendChild(productCard(product));
    });

    results.appendChild(fragment);
    showResults();

    if (resultsLabel) {
      resultsLabel.innerHTML =
        matches.length +
        (matches.length === 1 ? " product" : " products") +
        " found for <strong></strong>";
      resultsLabel.querySelector("strong").textContent =
        "\u201C" + term + "\u201D";
      resultsLabel.hidden = false;
    }
  }

  /* ---------- search ---------- */

  function runSearch(query) {
    var term = String(query || "").trim();

    if (!term) {
      PSS.toast("Please enter a product name to search.", "warning");
      input.focus();
      return;
    }

    var products = loadProducts();

    if (products.length === 0) {
      showState("empty");
      return;
    }

    showState("loading");

    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      var needle = term.toLowerCase();
      var matches = products.filter(function (product) {
        return String(product.name).toLowerCase().indexOf(needle) !== -1;
      });

      /* Prefer an exact (case-insensitive) name match first. */
      matches.sort(function (a, b) {
        var aExact = String(a.name).toLowerCase() === needle ? 0 : 1;
        var bExact = String(b.name).toLowerCase() === needle ? 0 : 1;
        return aExact - bExact;
      });

      if (matches.length === 0) {
        notFoundQuery.textContent = "\u201C" + term + "\u201D";
        showState("notFound");
        return;
      }

      renderResults(matches, term);
    }, 550);
  }

  /* ---------- events ---------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch(input.value);
  });

  input.addEventListener("input", function () {
    if (!input.value.trim()) {
      window.clearTimeout(searchTimer);
      updateMeta();
      showState(loadProducts().length === 0 ? "empty" : "idle");
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key === PRODUCTS_KEY) {
      updateMeta();
      showState(loadProducts().length === 0 ? "empty" : "idle");
    }
  });

  /* ---------- init ---------- */

  updateMeta();
  showState(loadProducts().length === 0 ? "empty" : "idle");
})();
