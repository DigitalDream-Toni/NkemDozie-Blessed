/* =========================================================
   theme.js
   Theme switching (persisted in localStorage) plus a few
   shared UI helpers used by search.js and admin.js.
   ========================================================= */
(function () {
  "use strict";

  var THEME_KEY = "pss_theme";
  var PRODUCTS_KEY = "pss_products";

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------- helpers ---------- */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var currency;
  try {
    currency = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    currency = null;
  }

  function formatPrice(value) {
    var amount = Number(value);
    if (value === "" || value === null || value === undefined || !isFinite(amount)) {
      return String(value == null ? "" : value);
    }
    if (currency) {
      return currency.format(amount);
    }
    return "\u20A6" + amount.toLocaleString();
  }

  function uid() {
    return (
      "p_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  var TOAST_ICONS = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info",
  };

  function toast(message, type) {
    var kind = TOAST_ICONS[type] ? type : "success";
    var host = document.getElementById("toastContainer");

    if (!host) {
      host = document.createElement("div");
      host.id = "toastContainer";
      host.className = "toast-container";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }

    var el = document.createElement("div");
    el.className = "toast toast-" + kind;
    el.setAttribute("role", "status");
    el.innerHTML =
      '<i class="fa-solid ' +
      TOAST_ICONS[kind] +
      '" aria-hidden="true"></i><span>' +
      escapeHtml(message) +
      "</span>";

    host.appendChild(el);

    /* Keep the stack short so notifications never cover the page. */
    while (host.children.length > 3) {
      host.removeChild(host.firstElementChild);
    }

    window.setTimeout(function () {
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 320);
    }, 3400);
  }

  /* ---------- theme ---------- */

  function getTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function syncButtons(theme) {
    var label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    var buttons = document.querySelectorAll("[data-theme-toggle]");

    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function applyTheme(theme, persist) {
    var next = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", next);

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        /* storage may be unavailable (private mode) — theme still applies */
      }
    }

    syncButtons(next);
  }

  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark", true);
  }

  /* Apply the saved theme before first paint to avoid a flash. */
  var stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (error) {
    stored = null;
  }

  if (stored === "dark" || stored === "light") {
    applyTheme(stored, false);
  } else {
    applyTheme(media.matches ? "dark" : "light", false);
  }

  /* Follow the OS preference until the visitor picks a theme. */
  var onMediaChange = function (event) {
    var saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (error) {
      saved = null;
    }
    if (saved !== "dark" && saved !== "light") {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onMediaChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(onMediaChange);
  }

  /* ---------- init on DOM ready ---------- */

  function init() {
    var buttons = document.querySelectorAll("[data-theme-toggle]");

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener("click", toggleTheme);
    });

    syncButtons(getTheme());

    var years = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(years, function (node) {
      node.textContent = year;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Expose shared helpers. */
  window.PSS = Object.freeze({
    THEME_KEY: THEME_KEY,
    PRODUCTS_KEY: PRODUCTS_KEY,
    getTheme: getTheme,
    setTheme: function (theme) {
      applyTheme(theme, true);
    },
    toggleTheme: toggleTheme,
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    uid: uid,
    toast: toast,
  });
})();
