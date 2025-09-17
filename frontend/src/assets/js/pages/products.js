// src/assets/js/shop.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const mainImg = document.getElementById("main-product-image");
    const gallery = document.querySelector(".thumbnail-gallery");
    const qtyDisplay = document.getElementById("quantity");
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const reviewsList = document.getElementById("reviews-list");
    const reviewForm = document.getElementById("review-form");
    const reviewName = document.getElementById("review-name");
    const reviewText = document.getElementById("review-text");
    const ratingControl = document.getElementById("rating-control");
    const reviewMsg = document.getElementById("review-msg");
    const reviewCountInline = document.getElementById("review-count-inline");
    const reviewTabCount = document.getElementById("review-tab-count");

    if (!mainImg) return; // only run on product page

    // Initialize AOS + icons + footer links if not already
    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // Thumbnails
    gallery &&
      gallery.addEventListener("click", (e) => {
        const img = e.target.closest("img");
        if (!img) return;
        mainImg.src = img.src;
        document
          .querySelectorAll(".thumbnail")
          .forEach((t) => t.classList.remove("active"));
        img.closest(".thumbnail")?.classList.add("active");
      });

    // Quantity
    let quantity = 1;
    function renderQty() {
      qtyDisplay && (qtyDisplay.textContent = KUtils.toFa(quantity));
    }
    renderQty();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".quantity-btn");
      if (!btn) return;
      const isMinus = btn.querySelector('[data-feather="minus"]');
      quantity = Math.max(1, quantity + (isMinus ? -1 : +1));
      renderQty();
    });

    // Tabs
    function showTabByName(name) {
      tabContents.forEach((c) => c.classList.add("hidden"));
      document.getElementById(name)?.classList.remove("hidden");
      tabButtons.forEach((b) => b.classList.remove("active"));
      const btn = Array.from(tabButtons).find((b) => b.dataset.tab === name);
      btn && btn.classList.add("active");
    }

    // --- THIS IS THE CORRECTED PART ---
    tabButtons.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        // Get the target tab name from the button's 'data-tab' attribute
        const tabName = btn.dataset.tab;
        if (tabName) {
          showTabByName(tabName);
        }
      })
    );
    // --- END OF CORRECTION ---

    // Reviews count + interactive rating
    let currentRating = 0;
    const initialReviewsCount = 124;
    let userReviewsCount = 0;
    function updateReviewCounts() {
      const total = initialReviewsCount + userReviewsCount;
      const fa = KUtils.toFa(total);
      reviewCountInline && (reviewCountInline.textContent = `(${fa} نظر)`);
      reviewTabCount && (reviewTabCount.textContent = fa);
    }
    updateReviewCounts();

    function setupRatingControl() {
      if (!ratingControl) return;
      const stars = Array.from(ratingControl.querySelectorAll(".star"));
      const paint = (value) =>
        stars.forEach((s, i) => {
          s.style.fill = i < value ? "currentColor" : "none";
        });
      stars.forEach((star, idx) => {
        star.setAttribute("role", "button");
        star.setAttribute("tabindex", "0");
        star.setAttribute("aria-label", `${idx + 1} ستاره`);
        star.addEventListener("mouseenter", () => paint(idx + 1));
        star.addEventListener("mouseleave", () => paint(currentRating));
        star.addEventListener("click", () => {
          currentRating = idx + 1;
          paint(currentRating);
        });
        star.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            currentRating = idx + 1;
            paint(currentRating);
          }
        });
      });
    }
    setupRatingControl();

    reviewForm &&
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (currentRating < 1) {
          alert("لطفاً امتیاز بدهید.");
          return;
        }
        const name = reviewName.value.trim();
        const text = reviewText.value.trim();
        if (!name || !text) return;

        const starsHtml = Array(5)
          .fill(0)
          .map(
            (_, i) =>
              `<i data-feather="star" class="w-4 h-4 ${
                i < currentRating ? "fill-current" : ""
              }"></i>`
          )
          .join("");

        const avatarSeed =
          Math.random() > 0.5
            ? "1494790108377-be9c29b29330"
            : "1507003211169-0a1dd7228f2d";
        const card = document.createElement("div");
        card.className = "review-card";
        card.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-${avatarSeed}?w=50&h=50&fit=crop" class="w-10 h-10 rounded-full" alt="avatar">
            <div><div class="font-semibold">${name}</div><div class="text-sm text-gray-500">لحظاتی پیش</div></div>
          </div>
          <div class="stars">${starsHtml}</div>
        </div>
        <p class="text-gray-600"></p>`;
        card.querySelector("p").textContent = text;
        reviewsList?.prepend(card);
        KUtils.refreshIcons();

        // Reset
        reviewForm.reset();
        currentRating = 0;
        setupRatingControl();
        reviewMsg &&
          (reviewMsg.classList.remove("hidden"),
          setTimeout(() => reviewMsg.classList.add("hidden"), 2000));

        userReviewsCount++;
        updateReviewCounts();
      });

    // Fill stars in "related products" cards
    document.querySelectorAll(".product-card-v3 .card-rating").forEach((r) => {
      const vEl = r.querySelector("span");
      if (!vEl) return;
      const ratingValue = parseFloat((vEl.textContent || "").replace("٫", "."));
      const stars = r.querySelectorAll('i[data-feather="star"]');
      stars.forEach((s, i) => {
        if (i < Math.floor(ratingValue)) s.classList.add("fill-current");
      });
    });
    KUtils.refreshIcons();
  });
})();
