/* =========================================================
   sw.js — offline support for the NkemDozie Blessed web app
   Network first (so edits show immediately), cache fallback.
   ========================================================= */
"use strict";

var SHELL_CACHE = "nkp-shell-v2";
var RUNTIME_CACHE = "nkp-runtime-v2";

var SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/style.css",
  "./assets/vendor/fonts/fonts.css",
  "./assets/vendor/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
  "./assets/vendor/fonts/xMQ9uFFYT72X5wkB_18qmnndmSdSnh2BAfO5mnuyOo1lfiQwV6-x.woff2",
  "./assets/vendor/fontawesome/css/all.min.css",
  "./assets/vendor/fontawesome/webfonts/fa-solid-900.woff2",
  "./js/theme.js",
  "./js/catalog.js",
  "./js/search.js",
  "./js/auth.js",
  "./js/admin.js",
  "./js/pwa.js",
  "./manifest.webmanifest",
  "./assets/download.webp",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon-180.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(function (cache) {
        return cache.addAll(SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== SHELL_CACHE && key !== RUNTIME_CACHE) {
              return caches.delete(key);
            }
            return null;
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;

  if (request.method !== "GET") {
    return;
  }

  var url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(function (response) {
        var copy = response.clone();
        var bucket =
          url.origin === self.location.origin ? SHELL_CACHE : RUNTIME_CACHE;

        caches
          .open(bucket)
          .then(function (cache) {
            return cache.put(request, copy);
          })
          .catch(function () {
            /* A response that cannot be stored is still returned. */
          });

        return response;
      })
      .catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) {
            return cached;
          }
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Response.error();
        });
      })
  );
});
