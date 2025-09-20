// /assets/js/components/search.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("search-button");
    const overlay = document.getElementById("search-overlay");
    const closeBtn = document.getElementById("close-search-button");
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");
    const overlayForm = overlay
      ? overlay.querySelector("form.search-form")
      : null;
    const suggestions = overlay
      ? overlay.querySelector(".search-suggestions")
      : null;

    const inlineForm = document.getElementById("inline-search-form");
    const inlineInput = document.getElementById("inline-search-input");

    let debounceTimer = null;
    let controller = null;

    function openSearch() {
      if (!overlay) return;
      overlay.classList.add("is-active");
      document.body.classList.add("search-overlay-open");
      setTimeout(() => input && input.focus(), 300);
      // If there is text in input, run a search
      if (input && input.value.trim().length > 1) {
        debouncedSearch(input.value.trim());
      } else {
        clearResults();
      }
    }

    function closeSearch() {
      if (!overlay) return;
      overlay.classList.remove("is-active");
      document.body.classList.remove("search-overlay-open");
      clearResults();
    }

    function escapeHTML(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatPriceRial(val) {
      if (val == null) return "";
      try {
        return Number(val).toLocaleString("fa-IR") + " ریال";
      } catch {
        return val + " ریال";
      }
    }

    function showLoading() {
      if (!results) return;
      results.innerHTML = `
        <div class="flex items-center gap-3 text-gray-500 px-2 py-2">
          <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
          </svg>
          <span>در حال جستجو…</span>
        </div>`;
    }

    function clearResults() {
      if (!results) return;
      results.innerHTML = "";
      if (suggestions) suggestions.classList.remove("hidden");
    }

    function renderError(message) {
      if (!results) return;
      results.innerHTML = `
        <div class="px-3 py-2 text-rose-600 bg-rose-50 rounded-lg text-sm">
          خطا در جستجو: ${escapeHTML(message || "لطفاً دوباره تلاش کنید.")}
        </div>`;
    }

    function renderNoResults() {
      if (!results) return;
      results.innerHTML = `
        <div class="px-3 py-2 text-gray-600 bg-gray-50 rounded-lg text-sm">
          نتیجه‌ای یافت نشد.
        </div>`;
    }

    function renderResults(items, q) {
      if (!results) return;
      if (!items || items.length === 0) {
        renderNoResults();
        return;
      }

      const html = items
        .map((p) => {
          const img = p.heroImageUrl || "/assets/images/koala.png";
          const title = escapeHTML(p.title || "");
          const brand = escapeHTML(p.brandName || "");
          const price = formatPriceRial(p.price);

          // We don't know your product detail route; send users to /shop with the query
          const href = `/shop?search=${encodeURIComponent(title)}`;

          return `
            <a href="${href}" class="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition group ring-1 ring-transparent hover:ring-gray-100">
              <div class="flex items-center gap-3 min-w-0">
                <img src="${img}" alt="${title}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-gray-900 truncate">${title}</div>
                  <div class="text-xs text-gray-500 truncate">${brand}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-xs md:text-sm text-emerald-600 font-medium">${price}</span>
                <i data-feather="arrow-left" class="w-4 h-4 text-gray-400 group-hover:text-gray-700"></i>
              </div>
            </a>
          `;
        })
        .join("");

      results.innerHTML = html;
      // Feather icons might need refresh after dynamic HTML
      if (window.feather && typeof window.feather.replace === "function") {
        window.feather.replace();
      }
    }

    async function search(q) {
      if (!results) return;
      if (!q || q.trim().length < 2) {
        results.innerHTML = "";
        if (suggestions) suggestions.classList.remove("hidden");
        return;
      }

      if (suggestions) suggestions.classList.add("hidden");
      showLoading();

      if (controller) controller.abort();
      controller = new AbortController();
      const signal = controller.signal;

      try {
        const resp = await fetch(
          `/api/search/products?q=${encodeURIComponent(q)}&size=8`,
          { signal }
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!data || data.ok === false)
          throw new Error(data?.error || "Search failed");
        if (signal.aborted) return;
        renderResults(data.items || [], q);
      } catch (e) {
        if (signal.aborted) return;
        renderError(e && e.message ? e.message : "خطای ناشناخته");
      }
    }

    const debouncedSearch = (q) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => search(q), 300);
    };

    // Open/close overlay
    btn &&
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openSearch();
      });
    closeBtn && closeBtn.addEventListener("click", closeSearch);
    overlay &&
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeSearch();
      });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay?.classList.contains("is-active"))
        closeSearch();
    });

    // Live search on input
    input &&
      input.addEventListener("input", (e) => {
        const q = (e.target.value || "").trim();
        debouncedSearch(q);
      });

    // Overlay form submit -> fallback to shop page
    overlayForm &&
      overlayForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (input?.value || "").trim();
        if (q) window.location.href = `/shop?search=${encodeURIComponent(q)}`;
      });

    // Inline search (404) -> redirect to shop
    inlineForm &&
      inlineForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (inlineInput?.value || "").trim();
        if (q) window.location.href = `/shop?search=${encodeURIComponent(q)}`;
      });
  });
})();
