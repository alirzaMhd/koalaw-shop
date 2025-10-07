// frontend/src/assets/js/pages/shop.js
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const productGrid = document.getElementById("shop-product-grid");
    if (!productGrid) return;

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
    const API_FILTERS = `${API}/filters`;
    const PER_PAGE = 12;

    const CATEGORY_SLUGS = [
      "skincare",
      "makeup",
      "fragrance",
      "haircare",
      "body-bath",
    ];
    const CATEGORY_SET = new Set(CATEGORY_SLUGS);

    // ---------- State ----------
    let page = 1;
    let totalPages = 1;
    let sortKey = "newest";
    let filters = {
      categories: [], // e.g., ['skincare', 'makeup'] (backend normalizes)
      brandIds: [],
      collectionIds: [],
      specialOnly: false,
      minPrice: undefined,
      maxPrice: undefined,
      search: undefined,
    };
    let isLoading = false;

    // ---------- Helpers ----------
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
    const toFa = (n) => {
      try {
        if (window.KUtils?.toFa) return window.KUtils.toFa(n);
      } catch {}
      return String(n);
    };

    const normalizeHex = (hex) => {
      if (!hex || typeof hex !== "string") return null;
      const s = hex.trim().toLowerCase();
      return /^#[0-9a-f]{6}$/.test(s) ? s : null;
    };

    function shadeHex(hex, percent = -6) {
      const h = normalizeHex(hex);
      if (!h) return hex || "#ffeef5";
      const num = parseInt(h.slice(1), 16);
      let r = (num >> 16) & 0xff,
        g = (num >> 8) & 0xff,
        b = num & 0xff;
      const f = (100 + percent) / 100;
      r = Math.min(255, Math.max(0, Math.round(r * f)));
      g = Math.min(255, Math.max(0, Math.round(g * f)));
      b = Math.min(255, Math.max(0, Math.round(b * f)));
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function deriveCardColors(item) {
      const themeHex = normalizeHex(item?.colorTheme?.hexCode);
      const chipHex = normalizeHex(item?.colorChips?.[0]?.hex);
      const base2 = themeHex || chipHex || "#ffeef5";
      const c1 = shadeHex(base2, -8);
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
      return `<div class="card-swatches">${chips
        .map((c) => {
          const hex = normalizeHex(c.hex);
          return hex
            ? `<span class="swatch" title="${escapeHtml(
                c.name || ""
              )}" style="background-color:${hex}"></span>`
            : "";
        })
        .join("")}</div>`;
    }

    function ratingStars(r) {
      const full = Math.floor(r || 0);
      const stars = Array(full)
        .fill(0)
        .map(
          () =>
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                 viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
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
        item.heroImageUrl || "/assets/images/products/product.png";
      const { c1, c2 } = deriveCardColors(item);
      const catCls = `category-${String(item.category || "default")
        .toLowerCase()
        .replace("_", "-")}`;

      const a = document.createElement("a");
      a.href = `/product/${encodeURIComponent(item.slug)}`;
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

    // ---------- URL -> initial filters ----------
    function normalizeCategorySlug(s) {
      const t = String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-");
      return CATEGORY_SET.has(t) ? t : null;
    }
    function parseCategoriesFromUrl(sp) {
      const raw = sp.getAll("category");
      const parts = [];
      for (const v of raw) {
        String(v || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((x) => parts.push(x));
      }
      const slugs = [];
      for (const p of parts) {
        const s = normalizeCategorySlug(p);
        if (s && !slugs.includes(s)) slugs.push(s);
      }
      return slugs;
    }
    function setCategoryCheckboxes(slugs) {
      document.querySelectorAll('input[name="category"]').forEach((el) => {
        el.checked = slugs.includes(el.value);
      });
    }
    function initFromUrl() {
      const sp = new URL(window.location.href).searchParams;

      // categories (slug form)
      const catSlugs = parseCategoriesFromUrl(sp);
      if (catSlugs.length) {
        setCategoryCheckboxes(catSlugs);
        filters.categories = catSlugs; // backend normalizes to enum-slugs
      }

      // search term
      const q = (sp.get("search") || "").trim();
      if (q) {
        filters.search = q;
        const inp = document.getElementById("search-input");
        if (inp) inp.value = q;
      }

      // sort (supports newest, popular, price-asc, price-desc)
      const allowedSorts = new Set([
        "newest",
        "popular",
        "price-asc",
        "price-desc",
      ]);
      const s = (sp.get("sort") || "")
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-");
      if (allowedSorts.has(s)) {
        sortKey = s;
      }
    }

    // ---------- Fetch DB filters and render ----------
    async function loadFilters() {
      try {
        const res = await fetch(API_FILTERS, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data } = await res.json();

        // Brands
        const brandRoot = document.getElementById("brand-filter-list");
        if (brandRoot && Array.isArray(data?.brands)) {
          brandRoot.innerHTML = data.brands
            .map(
              (b) => `
              <label class="cute-checkbox">
                <input type="checkbox" name="brandId" value="${escapeHtml(
                  b.id
                )}" />
                <span class="checkmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <label>${escapeHtml(b.name)}${
                b.count ? " (" + toFa(b.count) + ")" : ""
              }</label>
              </label>`
            )
            .join("");
        }

        // Collections
        const collectionRoot = document.getElementById(
          "collection-filter-list"
        );
        if (collectionRoot && Array.isArray(data?.collections)) {
          collectionRoot.innerHTML = data.collections
            .map(
              (c) => `
              <label class="cute-checkbox">
                <input type="checkbox" name="collectionId" value="${escapeHtml(
                  c.id
                )}" />
                <span class="checkmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <label>${escapeHtml(c.name)}${
                c.count ? " (" + toFa(c.count) + ")" : ""
              }</label>
              </label>`
            )
            .join("");
        }

        // Price range init
        const pr = data?.priceRange || {};
        const minIn = document.querySelector(".range-min");
        const maxIn = document.querySelector(".range-max");
        const progress = document.querySelector(
          ".price-range-slider .progress"
        );
        const minDisp = document.getElementById("price-min-display");
        const maxDisp = document.getElementById("price-max-display");
        if (minIn && maxIn && progress && minDisp && maxDisp) {
          const min = Number.isFinite(pr.min) ? pr.min : 0;
          const max = Number.isFinite(pr.max) ? pr.max : 1000000;
          const finalMin = Math.min(min, max);
          const finalMax = Math.max(max, finalMin + 10000);
          minIn.min = String(finalMin);
          minIn.max = String(finalMax);
          maxIn.min = String(finalMin);
          maxIn.max = String(finalMax);
          minIn.value = String(finalMin);
          maxIn.value = String(finalMax);
          progress.style.right =
            (parseInt(minIn.value) / parseInt(minIn.max)) * 100 + "%";
          progress.style.left =
            100 - (parseInt(maxIn.value) / parseInt(maxIn.max)) * 100 + "%";
          minDisp.textContent = toFa(parseInt(minIn.value)) + " تومان";
          maxDisp.textContent = toFa(parseInt(maxIn.value)) + " تومان";
        }
      } catch (e) {
        console.warn("Failed to load filter options", e);
      } finally {
        try {
          window.KUtils?.refreshIcons?.();
        } catch {}
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
      params.set("activeOnly", "false");

      if (filters.search) params.set("search", filters.search);
      if (filters.categories.length)
        filters.categories.forEach((c) => params.append("categories[]", c));
      if (filters.brandIds.length)
        filters.brandIds.forEach((id) => params.append("brandIds[]", id));
      if (filters.collectionIds.length)
        filters.collectionIds.forEach((id) =>
          params.append("collectionIds[]", id)
        );
      if (filters.specialOnly) params.set("specialOnly", "true");
      if (typeof filters.minPrice === "number")
        params.set("minPrice", String(filters.minPrice));
      if (typeof filters.maxPrice === "number")
        params.set("maxPrice", String(filters.maxPrice));

      try {
        const res = await fetch(`${API}?${params.toString()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) {
          console.error(
            "Failed to load products",
            res.status,
            await res.text()
          );
          isLoading = false;
          return;
        }
        const json = await res.json();
        handleProductsResponse(json);
      } catch (e) {
        console.error("Network error loading products", e);
      } finally {
        isLoading = false;
      }
    }

    function handleProductsResponse(json) {
      const items = json?.data?.items || [];
      const meta = json?.data?.meta || { totalPages: 1 };

      const frag = document.createDocumentFragment();
      for (const item of items) {
        try {
          frag.appendChild(createProductCard(item));
        } catch (e) {
          console.error("Card render failed", item, e);
        }
      }
      productGrid.appendChild(frag);

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
      if (sortCurrent) sortCurrent.textContent = "مرتب‌سازی: " + activeText;
      try {
        window.KUtils?.refreshIcons?.();
      } catch {}
    }

    // Keep URL in sync with state (sort, categories, search)
    function syncUrlFromState() {
      const sp = new URLSearchParams(window.location.search);

      // sort
      if (sortKey && sortKey !== "newest") sp.set("sort", sortKey);
      else sp.delete("sort");

      // categories
      sp.delete("category");
      filters.categories.forEach((c) => sp.append("category", c));

      // search
      if (filters.search) sp.set("search", filters.search);
      else sp.delete("search");

      const qs = sp.toString();
      const newUrl = window.location.pathname + (qs ? "?" + qs : "");
      window.history.replaceState({}, "", newUrl);
    }

    function applySort(key = "newest") {
      sortKey = key;
      updateSortUI(key);
      resetGrid();
      fetchPage();
      closeSort();
      syncUrlFromState(); // keep URL updated
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

    let filterOverlay = document.getElementById("mobile-menu-overlay");
    if (!filterOverlay) {
      filterOverlay = document.createElement("div");
      filterOverlay.id = "mobile-menu-overlay";
      filterOverlay.className = "mobile-menu-overlay";
      document.body.appendChild(filterOverlay);
    }

    const applyFiltersBtnEl = document.getElementById("apply-filters-btn");
    const filterFooter = applyFiltersBtnEl?.parentElement || null;

    const mq = window.matchMedia("(max-width: 1024px)");
    const originalParent = shopSidebar?.parentNode || null;
    const placeholder = document.createComment("shop-sidebar-placeholder");

    function adjustMobileUI(isMobile) {
      if (shopSidebar) {
        shopSidebar.style.borderRadius = isMobile ? "0" : "";
      }
      syncStickyFooterPadding();
    }

    function moveSidebar(e) {
      if (!shopSidebar || !originalParent) return;
      const isMobile = e?.matches ?? mq.matches;

      if (isMobile) {
        if (shopSidebar.parentNode === originalParent) {
          originalParent.insertBefore(placeholder, shopSidebar);
          document.body.appendChild(shopSidebar);
        }
      } else {
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
      mq.addListener(moveSidebar);
    }

    function openFilterMenu() {
      shopSidebar?.classList.add("is-active");
      filterOverlay?.classList.add("is-active");
      document.body.classList.add("filter-menu-open");
      syncStickyFooterPadding();
    }

    function closeFilterMenu() {
      shopSidebar?.classList.remove("is-active");
      document.body.classList.remove("filter-menu-open");

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

    function syncStickyFooterPadding() {
      if (!mq.matches || !shopSidebar || !filterFooter) {
        if (shopSidebar) shopSidebar.style.paddingBottom = "";
        return;
      }
      requestAnimationFrame(() => {
        shopSidebar.style.paddingBottom = `30px`;
      });
    }
    window.addEventListener("resize", syncStickyFooterPadding);
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
        minDisp.textContent = toFa(minVal) + " تومان";
        maxDisp.textContent = toFa(maxVal) + " تومان";
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
      // initial values set in loadFilters()
    }

    // ---------- Apply filters ----------
    const applyFiltersBtn = document.getElementById("apply-filters-btn");
    function getCheckedValues(name) {
      return Array.from(
        document.querySelectorAll(`input[name="${name}"]:checked`)
      ).map((el) => el.value);
    }
    function applyFilters() {
      const catSlugs = getCheckedValues("category");
      const brandIds = getCheckedValues("brandId");
      const collectionIds = getCheckedValues("collectionId");
      const specialChecked = getCheckedValues("special").includes("discount");
      const minVal = parseInt(document.querySelector(".range-min")?.value || 0);
      const maxVal = parseInt(
        document.querySelector(".range-max")?.value || Number.MAX_SAFE_INTEGER
      );

      filters.categories = catSlugs;
      filters.brandIds = brandIds;
      filters.collectionIds = collectionIds;
      filters.specialOnly = specialChecked;
      filters.minPrice = minVal;
      filters.maxPrice = maxVal;

      resetGrid();
      fetchPage();

      if (shopSidebar?.classList.contains("is-active")) {
        closeFilterMenu();
      }

      syncUrlFromState(); // keep URL updated
    }
    applyFiltersBtn && applyFiltersBtn.addEventListener("click", applyFilters);

    // ---------- Initial load ----------
    initFromUrl(); // read ?category=, ?search=, ?sort=
    await loadFilters();
    (function applySortInitial() {
      // sortKey is already set by initFromUrl()
      updateSortUI(sortKey);
      resetGrid();
      fetchPage();
    })();
  });
})();
