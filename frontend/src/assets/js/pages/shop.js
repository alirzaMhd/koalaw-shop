// frontend/src/assets/js/pages/shop.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const productGrid = document.getElementById("shop-product-grid");
    if (!productGrid) return;

    // Init page stuff (guarded)
    try {
      window.AOS &&
        AOS.init({
          duration: 600,
          easing: "ease-out-cubic",
          once: true,
          offset: 40,
        });
    } catch {}
    try {
      window.KUtils?.refreshIcons?.();
      window.KUtils?.buildFooterLinks?.();
    } catch {}

    // ---------- Config ----------
    const API = "/api/products";
    const PER_PAGE = 12;

    // Provided color map (normalize keys to lowercase)
    const colorMap = {
      "#ffeef5": "#ffd7e5", // Blush
      "#e0d9fe": "#eae2ff", // Lavender
      "#c5f4e5": "#dff8ef", // Mint
      "#ffd9b9": "#ffcbb3", // Soft Peach -> Peachy Glow
      "#d1e8ff": "#cce4ff", // Powder Blue -> Sky Blue
      "#f3ead3": "#efe2c9", // Warm Oat -> Toasted Almond
      "#e5e4e2": "#dcdbdd", // Light Stone -> Cloud Gray
    };
    const DEFAULT_BG_2 = "#ffeef5"; // fallback second color
    const DEFAULT_BG_1 = colorMap[DEFAULT_BG_2]; // fallback first color

    // State
    let page = 1;
    let totalPages = 1;
    let sortKey = "newest"; // newest | popular | price-asc | price-desc
    let filters = {
      categories: [], // enum values like ["SKINCARE", "MAKEUP"]
      collectionSlugs: [], // e.g. ["valentines-special"]
      specialOnly: false,
      minPrice: undefined,
      maxPrice: undefined,
    };
    let isLoading = false;

    // ---------- Safe helpers ----------
    const escapeHtml = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const toIRR = (n) => {
      try {
        if (window.KUtils?.toIRR) return window.KUtils.toIRR(n);
      } catch {}
      return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
    };

    const normalizeHex = (hex) => {
      if (!hex || typeof hex !== "string") return null;
      const s = hex.trim().toLowerCase();
      return /^#[0-9a-f]{6}$/.test(s) ? s : null;
    };

    // Adjust hex by percent (-100..100)
    function shadeHex(hex, percent = -6) {
      const h = normalizeHex(hex);
      if (!h) return hex || DEFAULT_BG_2;
      const num = parseInt(h.slice(1), 16);
      let r = (num >> 16) & 0xff;
      let g = (num >> 8) & 0xff;
      let b = num & 0xff;
      const factor = (100 + percent) / 100;
      r = Math.min(255, Math.max(0, Math.round(r * factor)));
      g = Math.min(255, Math.max(0, Math.round(g * factor)));
      b = Math.min(255, Math.max(0, Math.round(b * factor)));
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Choose background pair using colorTheme or variant chips + colorMap
    function deriveCardColors(item) {
      const themeHex = normalizeHex(item?.colorTheme?.hexCode);
      const chipHex = normalizeHex(item?.colorChips?.[0]?.hex);
      const base2 = themeHex || chipHex || DEFAULT_BG_2;
      const mapped1 = colorMap[base2] || colorMap[chipHex || ""] || null;
      const c1 = mapped1 || shadeHex(base2, -8); // slight darken if not mapped
      const c2 = base2;
      return { c1, c2 };
    }

    const iconMap = {
      SKINCARE: "shield",
      MAKEUP: "pen-tool",
      FRAGRANCE: "wind",
      HAIRCARE: "git-branch",
      BODY_BATH: "droplet",
    };
    const labelMap = {
      SKINCARE: "مراقبت از پوست",
      MAKEUP: "آرایش",
      FRAGRANCE: "عطر",
      HAIRCARE: "مراقبت از مو",
      BODY_BATH: "بدن و حمام",
    };

    function swatchesHtml(item) {
      const chips = Array.isArray(item.colorChips)
        ? item.colorChips.slice(0, 5)
        : [];
      if (!chips.length) return "";
      const swatches = chips
        .map((c) => {
          const hex = normalizeHex(c.hex);
          if (!hex) return "";
          return `<span class="swatch" title="${escapeHtml(
            c.name || ""
          )}" style="background-color:${hex}"></span>`;
        })
        .join("");
      return `<div class="card-swatches">${swatches}</div>`;
    }

    function ratingStars(r) {
      const full = Math.floor(r || 0);
      const stars = Array(full)
        .fill(0)
        .map(
          () =>
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
        )
        .join("");
      return `${stars}<span>${(r || 0).toLocaleString("fa-IR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}</span>`;
    }

    function createProductCard(item) {
      const cIcon = iconMap[item.category] || "gift";
      const cLabel = labelMap[item.category] || "محصول";
      const img =
        item.heroImageUrl || "/assets/images/products/placeholder.png";
      const { c1, c2 } = deriveCardColors(item);
      const catCls = `category-${String(item.category || "default")
        .toLowerCase()
        .replace("_", "-")}`;

      const a = document.createElement("a");
      a.href = `/product/${encodeURIComponent(item.slug)}`; // link to product detail if available
      a.className = `product-card-v3 ${catCls}`;
      a.setAttribute("data-aos", "fade-up");
      a.setAttribute("style", `--card-color-1:${c1}; --card-color-2:${c2};`);

      a.innerHTML = `
        <div class="card-bg" style="background: linear-gradient(160deg, var(--card-color-2), #fff 70%);"></div>

        <div class="card-blob">
          <svg viewBox="0 0 200 200" preserveAspectRatio="none">
            <path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z"
              transform="translate(100 100)" style="fill: var(--card-color-2); opacity:.35;"></path>
          </svg>
        </div>

        <div class="card-image-wrapper">
          <img src="${img}" alt="${escapeHtml(item.title)}" class="card-image"/>
        </div>

        <div class="card-content">
          <div class="card-category"><i data-feather="${cIcon}" class="w-3 h-3"></i><span>${cLabel}</span></div>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <div class="card-brand">${escapeHtml(item.brand?.name || "")}</div>
          <div class="card-rating">${ratingStars(item.ratingAvg)}</div>
          ${swatchesHtml(item)}
          <p class="card-price">${toIRR(item.price)}</p>
        </div>
      `;
      return a;
    }

    function writeCount(meta) {
      const countEl = document.getElementById("product-count");
      if (!countEl) return;
      const current = productGrid.children.length;
      countEl.textContent = window.KUtils?.toFa
        ? window.KUtils.toFa(current)
        : String(current);
      const totalSpan =
        countEl.parentElement?.querySelectorAll("span.font-bold")[1];
      if (totalSpan) {
        const total = meta?.total || 0;
        totalSpan.textContent = window.KUtils?.toFa
          ? window.KUtils.toFa(total)
          : String(total);
      }
    }

    // ---------- Fetching ----------
    async function fetchPage() {
      if (isLoading || page > totalPages) return;
      isLoading = true;

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(PER_PAGE));
      params.set("sort", sortKey);
      params.set("includeImages", "true");
      params.set("includeVariants", "true");
      // Show all regardless of isActive flag defaults
      params.set("activeOnly", "false");

      if (filters.categories.length) {
        filters.categories.forEach((c) => params.append("categories", c));
      }
      if (filters.collectionSlugs.length) {
        filters.collectionSlugs.forEach((s) =>
          params.append("collectionSlugs", s)
        );
      }
      if (filters.specialOnly) params.set("specialOnly", "true");
      if (typeof filters.minPrice === "number")
        params.set("minPrice", String(filters.minPrice));
      if (typeof filters.maxPrice === "number")
        params.set("maxPrice", String(filters.maxPrice));

      const reqUrl = `${API}?${params.toString()}`;
      let res;
      try {
        res = await fetch(reqUrl, {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
      } catch (e) {
        console.error("Network error loading products", e);
        isLoading = false;
        return;
      }

      if (!res.ok) {
        console.error("Failed to load products", res.status, await res.text());
        isLoading = false;
        return;
      }

      let json;
      try {
        json = await res.json();
      } catch (e) {
        console.error("Invalid JSON from /api/products", e);
        isLoading = false;
        return;
      }

      console.log(
        "Products response:",
        json?.data?.items?.length ?? 0,
        "items"
      );
      handleProductsResponse(json);
      isLoading = false;
    }

    function handleProductsResponse(json) {
      const items = json?.data?.items || [];
      const meta = json?.data?.meta || { totalPages: 1 };

      const frag = document.createDocumentFragment();
      for (const item of items) {
        try {
          const card = createProductCard(item);
          frag.appendChild(card);
        } catch (e) {
          console.error("Card render failed for item:", item, e);
        }
      }
      productGrid.appendChild(frag);

      // update counters
      totalPages = meta.totalPages || 1;
      writeCount(meta);

      try {
        window.KUtils?.refreshIcons?.();
        window.AOS && AOS.refreshHard();
      } catch {}
      page += 1;
    }

    function resetGrid() {
      productGrid.innerHTML = "";
      page = 1;
      totalPages = 1;
    }

    // ---------- Sort UI ----------
    const sortWrap = document.getElementById("sortSelect");
    const sortTrigger = sortWrap?.querySelector(".sort-select--button");
    const sortCurrent = sortWrap?.querySelector(".sort-current");
    const sortItems = sortWrap
      ? Array.from(sortWrap.querySelectorAll(".sort-item"))
      : [];

    function openSort() {
      sortWrap?.classList.add("is-open");
      sortTrigger?.setAttribute("aria-expanded", "true");
    }
    function closeSort() {
      sortWrap?.classList.remove("is-open");
      sortTrigger?.setAttribute("aria-expanded", "false");
    }
    function updateSortUI(key) {
      sortItems.forEach((btn) =>
        btn.setAttribute("aria-selected", String(btn.dataset.sort === key))
      );
      const activeText =
        sortItems.find((b) => b.dataset.sort === key)?.querySelector("span")
          ?.textContent || "جدیدترین";
      sortCurrent && (sortCurrent.textContent = "مرتب‌سازی: " + activeText);
      try {
        window.KUtils?.refreshIcons?.();
      } catch {}
    }
    function applySort(key = "newest") {
      sortKey = key;
      updateSortUI(key);
      resetGrid();
      fetchPage();
      closeSort();
    }
    sortTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      sortWrap?.classList.contains("is-open") ? closeSort() : openSort();
    });
    sortItems.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        applySort(btn.dataset.sort);
      })
    );
    document.addEventListener("click", closeSort);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSort();
    });

    // ---------- Infinite scroll ----------
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && page <= totalPages && !isLoading) {
            loadingIndicator.style.opacity = "1";
            setTimeout(async () => {
              await fetchPage();
              loadingIndicator.style.opacity = "0";
            }, 500);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(loadingIndicator);
    }

    // ---------- Filter sidebar (mobile toggle) ----------
    const openFilterBtn = document.getElementById("open-filter-btn");
    const closeFilterBtn = document.getElementById("close-filter-btn");
    const shopSidebar = document.getElementById("shop-sidebar");

    // Reuse the global overlay already in DOM (fallback to create if missing)
    let filterOverlay = document.getElementById("mobile-menu-overlay");
    if (!filterOverlay) {
      filterOverlay = document.createElement("div");
      filterOverlay.id = "mobile-menu-overlay";
      filterOverlay.className = "mobile-menu-overlay";
      document.body.appendChild(filterOverlay);
    }

    // Footer bar (اعمال فیلتر container) — sticky inside sidebar on mobile
    const applyFiltersBtnEl = document.getElementById("apply-filters-btn");
    const filterFooter = applyFiltersBtnEl?.parentElement || null;

    // Move sidebar to <body> on mobile so it sits in the root stacking context
    const mq = window.matchMedia("(max-width: 1024px)");
    const originalParent = shopSidebar?.parentNode || null;
    const placeholder = document.createComment("shop-sidebar-placeholder");

    function adjustMobileUI(isMobile) {
      if (shopSidebar) {
        // Remove border radius on mobile filter menu
        shopSidebar.style.borderRadius = isMobile ? "0" : "";
      }
      // Make sure the sticky footer has no extra bottom spacing; the sidebar gets just enough padding
      syncStickyFooterPadding();
    }

    function moveSidebar(e) {
      if (!shopSidebar || !originalParent) return;
      const isMobile = e?.matches ?? mq.matches;

      if (isMobile) {
        // Mobile: portal into <body>
        if (shopSidebar.parentNode === originalParent) {
          originalParent.insertBefore(placeholder, shopSidebar);
          document.body.appendChild(shopSidebar);
        }
      } else {
        // Desktop: move back where it was
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(shopSidebar, placeholder);
          placeholder.remove();
        }
      }

      adjustMobileUI(isMobile);
    }
    moveSidebar(mq);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", moveSidebar);
    } else if (typeof mq.addListener === "function") {
      // Safari < 14 fallback
      mq.addListener(moveSidebar);
    }

    function openFilterMenu() {
      shopSidebar?.classList.add("is-active");
      filterOverlay?.classList.add("is-active");
      document.body.classList.add("filter-menu-open");
      // Ensure sticky footer + padding are correct on open
      syncStickyFooterPadding();
    }

    function closeFilterMenu() {
      shopSidebar?.classList.remove("is-active");
      document.body.classList.remove("filter-menu-open");

      // If mobile menu isn't open, we can safely hide the overlay
      const mobileMenu = document.getElementById("mobile-menu");
      if (!mobileMenu || !mobileMenu.classList.contains("is-active")) {
        filterOverlay?.classList.remove("is-active");
      }
    }

    function toggleFilterMenu() {
      if (shopSidebar?.classList.contains("is-active")) {
        closeFilterMenu();
      } else {
        openFilterMenu();
      }
    }

    openFilterBtn?.addEventListener("click", toggleFilterMenu);
    closeFilterBtn?.addEventListener("click", toggleFilterMenu);
    filterOverlay?.addEventListener("click", () => {
      if (shopSidebar?.classList.contains("is-active")) {
        closeFilterMenu();
      }
    });

    // Ensure the sticky footer really sticks without huge bottom gap:
    // Set sidebar's padding-bottom equal to footer's height (instead of pb-24)
    function syncStickyFooterPadding() {
      if (!mq.matches || !shopSidebar || !filterFooter) {
        if (shopSidebar) shopSidebar.style.paddingBottom = "";
        return;
      }
      // Defer to after layout to get correct heights
      requestAnimationFrame(() => {
        const h = filterFooter.offsetHeight || 0;
        // Add a tiny breathing space; avoid big bottom padding (replaces pb-24)
        const extra = 8; // px
        shopSidebar.style.paddingBottom = `30px`;
      });
    }

    // Keep padding in sync on resize/orientation/content changes
    window.addEventListener("resize", syncStickyFooterPadding);
    // Also recalc after icons (feather) render might change footer height
    setTimeout(syncStickyFooterPadding, 0);

    // ---------- Price range UI ----------
    const rangeInputs = document.querySelectorAll(".range-input input");
    const progress = document.querySelector(".price-range-slider .progress");
    const minDisp = document.getElementById("price-min-display");
    const maxDisp = document.getElementById("price-max-display");
    if (rangeInputs.length && progress && minDisp && maxDisp) {
      const minMaxGap = 100000;
      function updateUI() {
        let minVal = parseInt(rangeInputs[0].value);
        let maxVal = parseInt(rangeInputs[1].value);
        progress.style.right = (minVal / rangeInputs[0].max) * 100 + "%";
        progress.style.left = 100 - (maxVal / rangeInputs[1].max) * 100 + "%";
        minDisp.textContent =
          (window.KUtils?.toFa ? KUtils.toFa(minVal) : String(minVal)) +
          " تومان";
        maxDisp.textContent =
          (window.KUtils?.toFa ? KUtils.toFa(maxVal) : String(maxVal)) +
          " تومان";
      }
      rangeInputs.forEach((input) =>
        input.addEventListener("input", (e) => {
          let minVal = parseInt(rangeInputs[0].value);
          let maxVal = parseInt(rangeInputs[1].value);
          if (maxVal - minVal < minMaxGap) {
            if (e.target.classList.contains("range-min"))
              rangeInputs[0].value = maxVal - minMaxGap;
            else rangeInputs[1].value = minVal + minMaxGap;
          } else updateUI();
        })
      );
      updateUI();
    }

    // ---------- Apply filters (server-side) ----------
    const applyFiltersBtn = document.getElementById("apply-filters-btn");
    function getCheckedValues(name) {
      return Array.from(
        document.querySelectorAll(`input[name="${name}"]:checked`)
      ).map((el) => el.value);
    }
    function applyFilters() {
      const cats = getCheckedValues("category"); // ['skincare', 'makeup', ...]
      const catEnums = cats.map((c) => c.toUpperCase().replace("-", "_")); // ['SKINCARE', 'MAKEUP', ...]

      const collectionsMap = {
        valentine: "valentines-special",
        spring: "spring-collection",
        summer: "summer-essentials",
      };
      const colVals = getCheckedValues("collection")
        .map((v) => collectionsMap[v])
        .filter(Boolean);

      const specialChecked = getCheckedValues("special").includes("discount");

      const minVal = parseInt(document.querySelector(".range-min")?.value || 0);
      const maxVal = parseInt(
        document.querySelector(".range-max")?.value || Number.MAX_SAFE_INTEGER
      );

      filters.categories = catEnums;
      filters.collectionSlugs = colVals;
      filters.specialOnly = specialChecked;
      filters.minPrice = minVal;
      filters.maxPrice = maxVal;

      resetGrid();
      fetchPage();

      if (shopSidebar?.classList.contains("is-active")) {
        closeFilterMenu();
      }
    }
    applyFiltersBtn && applyFiltersBtn.addEventListener("click", applyFilters);

    // ---------- Initial load ----------
    applySort("newest"); // triggers fetchPage()
  });
})();
