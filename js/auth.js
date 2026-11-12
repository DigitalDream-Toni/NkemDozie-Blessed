/* =========================================================
   auth.js — password gate for the admin dashboard

   Client-side only: this keeps casual visitors out of the
   dashboard. It is not real security — the password and the
   session live in the page itself.
   ========================================================= */
(function () {
  "use strict";

  var PASSWORD = "11223300";
  var SESSION_KEY = "pss_admin_session";
  var SESSION_MS = 5 * 60 * 1000; /* 5 minutes */
  var ACTIVITY_MS = 10 * 1000; /* extend the session at most this often */
  var CHECK_MS = 15 * 1000; /* how often to look for an expired session */

  var body = document.body;
  var gate = document.getElementById("adminGate");
  var form = document.getElementById("gateForm");
  var input = document.getElementById("gatePassword");
  var error = document.getElementById("gateError");
  var reveal = document.getElementById("gateReveal");

  if (!gate || !form || !input || !error) {
    return;
  }

  var unlocked = false;
  var lastExtension = 0;

  /* ---------- session storage ---------- */

  function readExpiry() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        return 0;
      }
      var data = JSON.parse(raw);
      var expiresAt = Number(data && data.expiresAt);
      return isFinite(expiresAt) ? expiresAt : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeExpiry(timestamp) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: timestamp }));
    } catch (e) {
      /* storage unavailable — the gate still works for this page view */
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- gate ui ---------- */

  function clearError() {
    error.textContent = "";
    error.hidden = true;
    input.removeAttribute("aria-invalid");
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");

    gate.classList.remove("is-shaking");
    void gate.offsetWidth; /* restart the animation */
    gate.classList.add("is-shaking");
  }

  function showGate(message) {
    unlocked = false;
    body.classList.add("auth-locked");
    gate.hidden = false;
    input.value = "";
    clearError();
    if (message) {
      showError(message);
    }
    window.setTimeout(function () {
      input.focus({ preventScroll: true });
    }, 120);
  }

  function unlock(isRestoring) {
    unlocked = true;
    body.classList.remove("auth-locked");
    gate.hidden = true;
    input.value = "";
    clearError();

    if (!isRestoring && window.PSS && typeof window.PSS.toast === "function") {
      window.PSS.toast(
        "Dashboard unlocked. It locks again after 5 minutes of inactivity.",
        "success"
      );
    }
  }

  /* Every interaction pushes the expiry 5 minutes into the future. */
  function extendSession() {
    var now = Date.now();
    if (!unlocked || now - lastExtension < ACTIVITY_MS) {
      return;
    }
    lastExtension = now;
    writeExpiry(now + SESSION_MS);
  }

  /* ---------- start ---------- */

  if (readExpiry() > Date.now()) {
    unlock(true);
  } else {
    clearSession();
    showGate();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var value = input.value;

    if (!value) {
      showError("Please enter the admin password.");
      input.focus();
      return;
    }

    if (value !== PASSWORD) {
      showError("Incorrect password. Please try again.");
      input.select();
      return;
    }

    lastExtension = Date.now();
    writeExpiry(lastExtension + SESSION_MS);
    unlock(false);
  });

  reveal.addEventListener("click", function () {
    var isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    reveal.innerHTML = isVisible
      ? '<i class="fa-solid fa-eye" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
    reveal.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    input.focus({ preventScroll: true });
  });

  ["pointerdown", "keydown", "touchstart"].forEach(function (type) {
    document.addEventListener(type, extendSession, { passive: true });
  });

  document.addEventListener("scroll", extendSession, {
    passive: true,
    capture: true,
  });

  /* Lock the dashboard if it sits open and idle past the deadline. */
  window.setInterval(function () {
    if (unlocked && readExpiry() <= Date.now()) {
      clearSession();
      showGate("Your session expired. Enter the password again.");
    }
  }, CHECK_MS);
})();
