/* =========================================================
   admin.js — Admin dashboard: add / edit / delete / import / export
   ========================================================= */
(function () {
  "use strict";

  var PSS = window.PSS;
  var PRODUCTS_KEY = PSS.PRODUCTS_KEY;

  /* Uploads are downscaled and re-encoded before they ever reach storage,
     so a catalog of many products fits comfortably in localStorage. */
  var MAX_SOURCE_BYTES = 12 * 1024 * 1024;
  var MAX_EDGE = 800;
  var MIN_EDGE = 520;
  var TARGET_BYTES = 90 * 1024;
  var KEEP_ORIGINAL_BYTES = 100 * 1024;

  var IMAGE_PLACEHOLDER =
    "data:image/svg+xml;charset=utf-8," +
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E" +
    "%3Crect width='100' height='100' fill='%23e7ebf9'/%3E" +
    "%3Ccircle cx='50' cy='42' r='17' fill='%23c3cdf0'/%3E" +
    "%3Ctext x='50' y='80' font-family='Arial' font-size='11' text-anchor='middle' fill='%23808bb0'%3ENo image%3C/text%3E" +
    "%3C/svg%3E";

  /* ---------- elements ---------- */
  var el = {
    form: document.getElementById("productForm"),
    formTitle: document.getElementById("formTitle"),
    productId: document.getElementById("productId"),
    name: document.getElementById("productName"),
    price: document.getElementById("productPrice"),
    image: document.getElementById("productImage"),
    uploadBox: document.getElementById("uploadBox"),
    previewWrap: document.getElementById("previewWrap"),
    previewImage: document.getElementById("previewImage"),
    removeImage: document.getElementById("removeImage"),
    submitBtn: document.getElementById("submitBtn"),
    cancelEdit: document.getElementById("cancelEdit"),
    rows: document.getElementById("productRows"),
    tableWrap: document.getElementById("tableWrap"),
    emptyState: document.getElementById("emptyState"),
    emptyStateText: document.getElementById("emptyStateText"),
    search: document.getElementById("adminSearch"),
    sort: document.getElementById("sortSelect"),
    totalCount: document.getElementById("totalCount"),
    countPill: document.getElementById("countPill"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    importMode: document.getElementById("importMode"),
    modal: document.getElementById("deleteModal"),
    deleteName: document.getElementById("deleteName"),
    confirmDelete: document.getElementById("confirmDelete"),
  };

  var products = [];
  var editingId = null;
  var pendingImage = "";
  var pendingDeleteId = null;
  var isProcessingImage = false;
  var uploadToken = 0;
  var webpSupport = (function () {
    try {
      var probe = document.createElement("canvas");
      probe.width = probe.height = 1;
      return probe.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (error) {
      return false;
    }
  })();

  /* ---------- storage ---------- */

  function loadProducts() {
    try {
      var raw = localStorage.getItem(PRODUCTS_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? normalizeList(parsed) : [];
    } catch (error) {
      PSS.toast("Saved products could not be read.", "error");
      return [];
    }
  }

  function saveProducts() {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      return true;
    } catch (error) {
      PSS.toast(
        "Could not save: browser storage is full. Delete a few products and try again.",
        "error"
      );
      return false;
    }
  }

  /* ---------- validation ---------- */

  function normalizeList(list) {
    return list
      .filter(function (item) {
        return item && typeof item === "object";
      })
      .map(function (item) {
        return {
          id: item.id ? String(item.id) : PSS.uid(),
          name: String(item.name || "").trim(),
          price: String(item.price == null ? "" : item.price).trim(),
          image: String(item.image || ""),
        };
      })
      .filter(function (item) {
        return item.name;
      });
  }

  function validateInput(name, price, image) {
    if (!name) {
      return { field: "name", message: "Please enter the product name." };
    }
    if (name.length < 2) {
      return { field: "name", message: "Product name is too short." };
    }
    if (price === "" || price === null) {
      return { field: "price", message: "Please enter the product price." };
    }
    var amount = Number(price);
    if (!isFinite(amount) || amount < 0) {
      return { field: "price", message: "Price must be a valid positive number." };
    }
    return null;
  }

  function markInvalid(field) {
    if (field === "name" || field === "price") {
      el[field].classList.add("is-invalid");
    }
  }

  function clearInvalid() {
    el.name.classList.remove("is-invalid");
    el.price.classList.remove("is-invalid");
  }

  /* ---------- preview ---------- */

  function setPreview(src) {
    pendingImage = src || "";
    if (pendingImage) {
      el.previewImage.src = pendingImage;
      el.previewWrap.hidden = false;
      el.uploadBox.classList.add("has-image");
      el.uploadBox.querySelector(".upload-text").textContent =
        "Change image";
    } else {
      el.previewImage.removeAttribute("src");
      el.previewWrap.hidden = true;
      el.uploadBox.classList.remove("has-image");
      el.uploadBox.querySelector(".upload-text").textContent =
        "Click to upload an image";
    }
  }

  /* ---------- render ---------- */

  function visibleProducts() {
    var query = el.search.value.trim().toLowerCase();

    var list = products.filter(function (product) {
      return !query || product.name.toLowerCase().indexOf(query) !== -1;
    });

    var sort = el.sort.value;
    var byName = function (a, b) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    };

    if (sort === "az") {
      list.sort(byName);
    } else if (sort === "za") {
      list.sort(function (a, b) {
        return byName(b, a);
      });
    } else if (sort === "price-asc") {
      list.sort(function (a, b) {
        return Number(a.price) - Number(b.price);
      });
    } else if (sort === "price-desc") {
      list.sort(function (a, b) {
        return Number(b.price) - Number(a.price);
      });
    }
    /* "newest" keeps storage order (newest products are added first). */

    return list;
  }

  function render() {
    var list = visibleProducts();

    el.totalCount.textContent = products.length;
    el.countPill.textContent = list.length;

    if (list.length === 0) {
      el.tableWrap.hidden = true;
      el.emptyState.hidden = false;
      el.emptyStateText.textContent =
        products.length === 0
          ? "Add your first product using the form to start building your catalog."
          : "No products match your search. Try a different keyword.";
      return;
    }

    el.tableWrap.hidden = false;
    el.emptyState.hidden = true;

    var html = list
      .map(function (product) {
        var src = product.image ? product.image : IMAGE_PLACEHOLDER;
        return (
          '<tr data-id="' + PSS.escapeHtml(product.id) + '">' +
            '<td data-label="Product">' +
              '<div class="product-cell">' +
                '<img class="thumb" src="' + PSS.escapeHtml(src) + '" alt="' +
                  PSS.escapeHtml(product.name) + '" loading="lazy" />' +
                '<span class="product-name">' + PSS.escapeHtml(product.name) + "</span>" +
              "</div>" +
            "</td>" +
            '<td data-label="Price">' +
              '<span class="price-tag">' + PSS.escapeHtml(PSS.formatPrice(product.price)) + "</span>" +
            "</td>" +
            '<td class="cell-actions" data-label="Actions">' +
              '<button class="icon-btn" type="button" data-action="edit" title="Edit ' +
                PSS.escapeHtml(product.name) + '" aria-label="Edit ' +
                PSS.escapeHtml(product.name) + '">' +
                '<i class="fa-solid fa-pen" aria-hidden="true"></i></button>' +
              '<button class="icon-btn danger" type="button" data-action="delete" title="Delete ' +
                PSS.escapeHtml(product.name) + '" aria-label="Delete ' +
                PSS.escapeHtml(product.name) + '">' +
                '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
            "</td>" +
          "</tr>"
        );
      })
      .join("");

    el.rows.innerHTML = html;

    Array.prototype.forEach.call(el.rows.querySelectorAll("img.thumb"), function (img) {
      img.addEventListener("error", function () {
        img.src = IMAGE_PLACEHOLDER;
      });
    });
  }

  /* ---------- form state ---------- */

  function resetForm() {
    editingId = null;
    uploadToken += 1; /* drop any image still being optimised */
    setUploadBusy(false);
    el.form.reset();
    el.productId.value = "";
    clearInvalid();
    setPreview("");
    el.formTitle.textContent = "Add product";
    el.submitBtn.innerHTML =
      '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>Add product</span>';
    el.cancelEdit.hidden = true;
    el.image.value = "";
  }

  function startEdit(id) {
    var product = products.find(function (item) {
      return item.id === id;
    });
    if (!product) {
      return;
    }

    editingId = id;
    clearInvalid();
    el.productId.value = id;
    el.name.value = product.name;
    el.price.value = product.price;
    el.image.value = "";
    setPreview(product.image);

    el.formTitle.textContent = "Edit product";
    el.submitBtn.innerHTML =
      '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>Save changes</span>';
    el.cancelEdit.hidden = false;

    el.form.scrollIntoView({ behavior: "smooth", block: "start" });
    el.name.focus({ preventScroll: true });
  }

  /* ---------- add / edit ---------- */

  el.form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (isProcessingImage) {
      PSS.toast("Please wait for the image to finish optimising.", "info");
      return;
    }

    clearInvalid();

    var name = el.name.value.trim();
    var price = el.price.value.trim();
    var problem = validateInput(name, price, pendingImage);

    if (problem) {
      markInvalid(problem.field);
      PSS.toast(problem.message, "error");
      if (problem.field === "name") {
        el.name.focus();
      } else if (problem.field === "price") {
        el.price.focus();
      }
      return;
    }

    if (editingId) {
      var index = products.findIndex(function (item) {
        return item.id === editingId;
      });

      if (index === -1) {
        PSS.toast("That product no longer exists.", "error");
        resetForm();
        render();
        return;
      }

      products[index] = {
        id: editingId,
        name: name,
        price: price,
        image: pendingImage,
      };

      if (saveProducts()) {
        PSS.toast("Product updated successfully.", "success");
        resetForm();
        render();
      }
      return;
    }

    var duplicate = products.some(function (item) {
      return item.name.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
      el.name.classList.add("is-invalid");
      PSS.toast('A product named "' + name + '" already exists.', "warning");
      return;
    }

    products.unshift({
      id: PSS.uid(),
      name: name,
      price: price,
      image: pendingImage,
    });

    if (saveProducts()) {
      PSS.toast('"' + name + '" was added to the catalog.', "success");
      resetForm();
      render();
    }
  });

  el.cancelEdit.addEventListener("click", function () {
    resetForm();
  });

  el.name.addEventListener("input", clearInvalid);
  el.price.addEventListener("input", clearInvalid);

  /* ---------- image optimisation ---------- */

  function formatBytes(bytes) {
    if (!isFinite(bytes) || bytes <= 0) {
      return "0 KB";
    }
    if (bytes < 1024) {
      return bytes + " B";
    }
    if (bytes < 1024 * 1024) {
      return Math.round(bytes / 1024) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function readAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.addEventListener("load", function () {
        resolve(String(reader.result || ""));
      });
      reader.addEventListener("error", function () {
        reject(new Error("That image could not be read. Please try another."));
      });
      reader.readAsDataURL(file);
    });
  }

  function loadImageElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.addEventListener("load", function () {
        URL.revokeObjectURL(url);
        resolve(image);
      });
      image.addEventListener("error", function () {
        URL.revokeObjectURL(url);
        reject(new Error("That image could not be read. Please try another."));
      });
      image.src = url;
    });
  }

  function loadImage(file) {
    if (typeof window.createImageBitmap === "function") {
      return window
        .createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(function () {
          return loadImageElement(file);
        });
    }
    return loadImageElement(file);
  }

  function encodeCanvas(canvas, quality) {
    return webpSupport
      ? canvas.toDataURL("image/webp", quality)
      : canvas.toDataURL("image/jpeg", quality);
  }

  function drawToCanvas(source, width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser cannot optimise images. Try another browser.");
    }

    if (!webpSupport) {
      /* JPEG has no alpha channel, so flatten transparency onto white. */
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);

    return canvas;
  }

  /* Bytes behind a base64 data URL (localStorage stores the string itself). */
  function dataUrlBytes(url) {
    var comma = url.indexOf(",");
    var base64 = comma >= 0 ? url.slice(comma + 1) : "";
    return Math.round((base64.length * 3) / 4);
  }

  function optimiseImage(file) {
    return loadImage(file).then(function (source) {
      var width = source.width || source.naturalWidth || 0;
      var height = source.height || source.naturalHeight || 0;

      if (!width || !height) {
        throw new Error("That image could not be read. Please try another.");
      }

      var scale = Math.min(1, MAX_EDGE / Math.max(width, height));

      /* Small files that already fit the limit keep their original quality. */
      if (scale === 1 && file.size <= KEEP_ORIGINAL_BYTES) {
        return readAsDataUrl(file).then(function (dataUrl) {
          return {
            dataUrl: dataUrl,
            bytes: file.size,
            width: width,
            height: height,
            originalBytes: file.size,
            optimized: false,
          };
        });
      }

      /* Try the full size first, then step the dimensions down if a very
         detailed photo still exceeds the size budget. */
      var qualities = [0.78, 0.66, 0.56, 0.46];
      var edge = MAX_EDGE;
      var lastWidth = 0;
      var lastHeight = 0;
      var best = null;

      while (edge >= MIN_EDGE) {
        var targetScale = Math.min(1, edge / Math.max(width, height));
        var targetWidth = Math.max(1, Math.round(width * targetScale));
        var targetHeight = Math.max(1, Math.round(height * targetScale));

        if (targetWidth === lastWidth && targetHeight === lastHeight) {
          break;
        }
        lastWidth = targetWidth;
        lastHeight = targetHeight;

        var canvas = drawToCanvas(source, targetWidth, targetHeight);
        var dataUrl = "";

        for (var i = 0; i < qualities.length; i += 1) {
          dataUrl = encodeCanvas(canvas, qualities[i]);
          if (dataUrlBytes(dataUrl) <= TARGET_BYTES) {
            break;
          }
        }

        best = {
          dataUrl: dataUrl,
          bytes: dataUrlBytes(dataUrl),
          width: targetWidth,
          height: targetHeight,
          originalBytes: file.size,
          optimized: true,
        };

        if (best.bytes <= TARGET_BYTES) {
          break;
        }

        edge = Math.round(edge * 0.78);
      }

      if (typeof source.close === "function") {
        source.close();
      }

      return best;
    });
  }

  function setUploadBusy(busy) {
    isProcessingImage = busy;
    var icon = el.uploadBox.querySelector("i");
    var text = el.uploadBox.querySelector(".upload-text");

    el.uploadBox.classList.toggle("is-busy", busy);

    if (busy) {
      if (icon) {
        icon.className = "fa-solid fa-circle-notch spin";
      }
      if (text) {
        text.textContent = "Optimising image\u2026";
      }
      return;
    }

    if (icon) {
      icon.className = "fa-solid fa-cloud-arrow-up";
    }
    if (text) {
      text.textContent = pendingImage ? "Change image" : "Click to upload an image";
    }
  }

  /* ---------- image upload ---------- */

  el.image.addEventListener("change", function () {
    var file = el.image.files && el.image.files[0];
    if (!file) {
      return;
    }

    if (!/^image\//.test(file.type)) {
      PSS.toast("Please choose a valid image file.", "error");
      el.image.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      PSS.toast("Image is too large. Choose a file under 12 MB.", "error");
      el.image.value = "";
      return;
    }

    var token = ++uploadToken;
    setUploadBusy(true);

    optimiseImage(file)
      .then(function (result) {
        if (token !== uploadToken) {
          return;
        }

        setPreview(result.dataUrl);
        setUploadBusy(false);

        if (result.optimized) {
          PSS.toast(
            "Image optimised: " +
              formatBytes(result.originalBytes) +
              " \u2192 " +
              formatBytes(result.bytes) +
              " (" +
              result.width +
              "\u00D7" +
              result.height +
              ").",
            "success"
          );
        } else {
          PSS.toast("Image ready. Add or save the product to keep it.", "info");
        }
      })
      .catch(function (error) {
        if (token !== uploadToken) {
          return;
        }
        PSS.toast(error.message || "That image could not be processed.", "error");
        setUploadBusy(false);
      })
      .then(function () {
        if (token === uploadToken) {
          el.image.value = "";
        }
      });
  });

  el.removeImage.addEventListener("click", function () {
    setPreview("");
    el.image.value = "";
    el.name.focus({ preventScroll: true });
  });

  /* ---------- table actions ---------- */

  el.rows.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    var row = button.closest("tr");
    var id = row ? row.getAttribute("data-id") : null;
    if (!id) {
      return;
    }

    if (button.getAttribute("data-action") === "edit") {
      startEdit(id);
      return;
    }

    var product = products.find(function (item) {
      return item.id === id;
    });

    if (product) {
      openDeleteModal(product);
    }
  });

  /* ---------- delete modal ---------- */

  function openDeleteModal(product) {
    pendingDeleteId = product.id;
    el.deleteName.textContent = product.name;
    el.modal.hidden = false;
    document.body.style.overflow = "hidden";
    el.confirmDelete.focus({ preventScroll: true });
  }

  function closeDeleteModal() {
    el.modal.hidden = true;
    pendingDeleteId = null;
    document.body.style.overflow = "";
  }

  el.confirmDelete.addEventListener("click", function () {
    if (!pendingDeleteId) {
      closeDeleteModal();
      return;
    }

    var removed = products.find(function (item) {
      return item.id === pendingDeleteId;
    });

    products = products.filter(function (item) {
      return item.id !== pendingDeleteId;
    });

    closeDeleteModal();

    if (saveProducts()) {
      if (removed && editingId === removed.id) {
        resetForm();
      }
      render();
      PSS.toast(
        removed ? '"' + removed.name + '" was deleted.' : "Product deleted.",
        "success"
      );
    }
  });

  Array.prototype.forEach.call(
    el.modal.querySelectorAll("[data-close-modal]"),
    function (node) {
      node.addEventListener("click", closeDeleteModal);
    }
  );

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !el.modal.hidden) {
      closeDeleteModal();
    }
  });

  /* ---------- search + sort ---------- */

  el.search.addEventListener("input", render);
  el.sort.addEventListener("change", render);

  /* ---------- export ---------- */

  el.exportBtn.addEventListener("click", function () {
    var payload = products.map(function (product) {
      return {
        name: product.name,
        price: product.price,
        image: product.image,
      };
    });

    var blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = "products.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    PSS.toast(
      payload.length + " product" + (payload.length === 1 ? "" : "s") +
        " exported to products.json.",
      "success"
    );
  });

  /* ---------- import ---------- */

  el.importBtn.addEventListener("click", function () {
    el.importFile.click();
  });

  function parseImport(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("The file is not valid JSON.");
    }

    if (data && !Array.isArray(data) && Array.isArray(data.products)) {
      data = data.products;
    }

    if (!Array.isArray(data)) {
      throw new Error("The JSON must contain an array of products.");
    }

    if (data.length === 0) {
      throw new Error("The file does not contain any products.");
    }

    return data.map(function (item, index) {
      var position = "Product " + (index + 1);

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(position + " is not a valid product object.");
      }
      if (typeof item.name !== "string" || !item.name.trim()) {
        throw new Error(position + " is missing a valid \"name\".");
      }
      if (
        item.price === undefined ||
        item.price === null ||
        String(item.price).trim() === "" ||
        !isFinite(Number(item.price))
      ) {
        throw new Error(position + ' is missing a valid "price".');
      }
      return {
        id: PSS.uid(),
        name: item.name.trim().slice(0, 80),
        price: String(item.price).trim(),
        image: typeof item.image === "string" ? item.image.trim() : "",
      };
    });
  }

  el.importFile.addEventListener("change", function () {
    var file = el.importFile.files && el.importFile.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();

    reader.addEventListener("load", function () {
      try {
        var imported = parseImport(String(reader.result || ""));
        var mode = el.importMode.value;

        if (mode === "replace") {
          products = imported;
        } else {
          var existingNames = products.map(function (item) {
            return item.name.toLowerCase();
          });

          var added = imported.filter(function (item) {
            return existingNames.indexOf(item.name.toLowerCase()) === -1;
          });

          products = added.concat(products);

          if (added.length < imported.length) {
            PSS.toast(
              (imported.length - added.length) +
                " duplicate product(s) were skipped.",
              "warning"
            );
          }
        }

        if (saveProducts()) {
          render();
          resetForm();
          PSS.toast(
            imported.length + " product(s) imported successfully.",
            "success"
          );
        }
      } catch (error) {
        PSS.toast("Import failed: " + error.message, "error");
      } finally {
        el.importFile.value = "";
      }
    });

    reader.addEventListener("error", function () {
      PSS.toast("That file could not be read.", "error");
      el.importFile.value = "";
    });

    reader.readAsText(file);
  });

  /* ---------- init ---------- */

  products = loadProducts();
  render();
  resetForm();
})();
