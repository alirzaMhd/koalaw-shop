// frontend/src/assets/js/pages/404.js
// 404 page specific functionality: dynamic category suggestions

(function () {
  "use strict";

  /**
   * Get JSON from localStorage
   */
  function getJSON(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Set JSON to localStorage
   */
  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logger.warn("localStorage setItem failed:", e);
    }
  }

  /**
   * Fetch last 4 DB categories from filters endpoint with caching
   */
  async function fetchDbCategoryLinks() {
    try {
      const cacheKey = "404PageCategories:last4:v2";
      const cached = getJSON(cacheKey, null);
      const maxAgeMs = 6 * 60 * 60 * 1000; // 6h

      if (
        cached &&
        Array.isArray(cached.items) &&
        Date.now() - (cached.ts || 0) < maxAgeMs
      ) {
        return cached.items;
      }

      const res = await fetch("/api/products/filters", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dbCats = Array.isArray(json?.data?.dbCategories)
        ? json.data.dbCategories
        : [];

      // only last 4 categories
      const last4 = dbCats.slice(-4);
      const items = last4.map((c) => ({
        label: c.label || c.value,
        href: `/shop?category=${encodeURIComponent(
          String(c.value || "").toLowerCase()
        )}`,
        icon: c.icon || "grid",
      }));

      setJSON(cacheKey, { ts: Date.now(), items });
      return items;
    } catch (e) {
      logger.warn("404 Page: failed to load DB categories", e);
      return [];
    }
  }

  /**
   * Render category links
   */
  function renderCategoryLinks(categories) {
    if (categories.length === 0) {
      return '<a href="/shop">مشاهده فروشگاه</a>';
    }

    return categories
      .map((cat) => `  <a href="${cat.href}">${cat.label}</a>`)
      .join("");
  }

  /**
   * Populate suggestion areas
   */
  function populateSuggestions(html) {
    const inlineContainer = document.getElementById(
      "inline-category-suggestions"
    );
    const overlayContainer = document.getElementById(
      "overlay-category-suggestions"
    );

    if (inlineContainer) {
      inlineContainer.innerHTML = html;
    }

    if (overlayContainer) {
      overlayContainer.innerHTML = html;
    }
  }

  /**
   * Initialize category suggestions
   */
  async function initCategorySuggestions() {
    try {
      const categories = await fetchDbCategoryLinks();
      const html = renderCategoryLinks(categories);
      populateSuggestions(html);
    } catch (error) {
      logger.error("Error initializing category suggestions:", error);
      // Fallback
      populateSuggestions(' <a href="/shop">مشاهده فروشگاه</a>');
    }
  }

  /**
   * Handle inline search form submission
   */
  function initInlineSearch() {
    const form = document.getElementById("inline-search-form");
    const input = document.getElementById("inline-search-input");

    if (!form || !input) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = input.value.trim();

      if (query) {
        window.location.href = `/shop?search=${encodeURIComponent(query)}`;
      }
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    initCategorySuggestions();
    initInlineSearch();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
