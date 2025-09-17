
// src/assets/js/search.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("search-button");
    const overlay = document.getElementById("search-overlay");
    const closeBtn = document.getElementById("close-search-button");
    const input = document.getElementById("search-input");

    function openSearch() {
      if (!overlay) return;
      overlay.classList.add("is-active");
      document.body.classList.add("search-overlay-open");
      setTimeout(() => input && input.focus(), 400);
    }
    function closeSearch() {
      if (!overlay) return;
      overlay.classList.remove("is-active");
      document.body.classList.remove("search-overlay-open");
    }

    btn && btn.addEventListener("click", (e) => { e.preventDefault(); openSearch(); });
    closeBtn && closeBtn.addEventListener("click", closeSearch);
    overlay && overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSearch(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay?.classList.contains("is-active")) closeSearch(); });

    // Handle overlay form submit
    const overlayForm = overlay ? overlay.querySelector("form.search-form") : null;
    overlayForm && overlayForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (input?.value || "").trim();
      if (q) window.location.href = `/shop?search=${encodeURIComponent(q)}`;
    });

    // Inline search form (404)
    const inlineForm = document.getElementById("inline-search-form");
    const inlineInput = document.getElementById("inline-search-input");
    inlineForm && inlineForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (inlineInput?.value || "").trim();
      if (q) window.location.href = `/shop?search=${encodeURIComponent(q)}`;
    });
  });
})();
