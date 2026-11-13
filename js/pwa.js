/* =========================================================
   pwa.js — install prompt + service worker registration
   ========================================================= */
(function () {
  "use strict";

  var button = document.getElementById("installApp");
  var installEvent = null;

  /* file:// cannot register a service worker; http(s) can. */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* Offline support is a bonus; never block the shop. */
      });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installEvent = event;
    if (button) {
      button.hidden = false;
    }
  });

  window.addEventListener("appinstalled", function () {
    installEvent = null;
    if (button) {
      button.hidden = true;
    }
  });

  if (button) {
    button.addEventListener("click", function () {
      if (!installEvent) {
        button.hidden = true;
        return;
      }

      installEvent.prompt();
      installEvent.userChoice.then(function () {
        installEvent = null;
        button.hidden = true;
      });
    });
  }
})();
