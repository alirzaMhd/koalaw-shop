// src/assets/js/products.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const productGrid = document.getElementById("shop-product-grid");
    if (!productGrid) return;

    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    const allProducts = [
      {
        d: "0",
        c: "skincare",
        b: "LuxeElixir",
        t: "اکسیر درخشش طلایی",
        p: 480000,
        r: 4.8,
        img: "../../images/skin.png",
      },
      {
        d: "100",
        c: "makeup",
        b: "Celeste",
        t: "بوسه مخملی مات",
        p: 320000,
        r: 4.5,
        img: "../../images/cosmetic.png",
      },
      {
        d: "200",
        c: "makeup",
        b: "Aetheria",
        t: "پایه ابریشمی بی‌نقص",
        p: 420000,
        r: 4.9,
        img: "../../images/cosmetic.png",
      },
      {
        d: "300",
        c: "fragrance",
        b: "Solstice Glow",
        t: "راز نیمه‌شب",
        p: 780000,
        r: 4.7,
        img: "../../images/perfume.png",
      },
      {
        d: "0",
        c: "skincare",
        b: "Celeste",
        t: "کرم شب بازسازی کننده",
        p: 550000,
        r: 4.6,
        img: "../../images/skin.png",
      },
      {
        d: "100",
        c: "haircare",
        b: "LuxeElixir",
        t: "سرم موی آرگان",
        p: 290000,
        r: 4.8,
        img: "../../images/hair.png",
      },
      {
        d: "200",
        c: "body-bath",
        b: "Aetheria",
        t: "اسکراب بدن شکری",
        p: 210000,
        r: 4.4,
        img: "../../images/body.png",
      },
      {
        d: "300",
        c: "makeup",
        b: "Solstice Glow",
        t: "پالت سایه کهکشانی",
        p: 650000,
        r: 4.9,
        img: "../../images/cosmetic.png",
      },
      {
        d: "0",
        c: "fragrance",
        b: "Celeste",
        t: "عطر شکوفه بهاری",
        p: 710000,
        r: 4.5,
        img: "../../images/perfume.png",
      },
      {
        d: "100",
        c: "skincare",
        b: "LuxeElixir",
        t: "تونر گل رز آبرسان",
        p: 190000,
        r: 4.7,
        img: "../../images/skin.png",
      },
      {
        d: "200",
        c: "body-bath",
        b: "Aetheria",
        t: "کره بدن وانیلی",
        p: 250000,
        r: 4.6,
        img: "../../images/body.png",
      },
      {
        d: "300",
        c: "haircare",
        b: "Solstice Glow",
        t: "ماسک موی کراتینه",
        p: 380000,
        r: 4.8,
        img: "../../images/hair.png",
      },
      {
        d: "0",
        c: "skincare",
        b: "Celeste",
        t: "سرم ویتامین سی",
        p: 495000,
        r: 4.9,
        img: "../../images/skin.png",
      },
      {
        d: "100",
        c: "makeup",
        b: "Aetheria",
        t: "ریمل حجم‌دهنده",
        p: 310000,
        r: 4.6,
        img: "../../images/cosmetic.png",
      },
      {
        d: "200",
        c: "fragrance",
        b: "LuxeElixir",
        t: "ادکلن چوب صندل",
        p: 850000,
        r: 4.8,
        img: "../../images/perfume.png",
      },
      {
        d: "300",
        c: "body-bath",
        b: "Celeste",
        t: "لوسیون بدن آلوئه‌ورا",
        p: 230000,
        r: 4.5,
        img: "../../images/body.png",
      },
    ];
    let visibleProducts = allProducts.slice();
    let currentIdx = 0;
    const perPage = 12;

    function createProductCard(p) {
      const iconMap = {
        skincare: "shield",
        makeup: "pen-tool",
        fragrance: "wind",
        haircare: "git-branch",
        "body-bath": "droplet",
      };
      const labelMap = {
        skincare: "مراقبت از پوست",
        makeup: "آرایش",
        fragrance: "عطر",
        haircare: "مراقبت از مو",
        "body-bath": "بدن و حمام",
      };
      const icon = iconMap[p.c] || "gift";
      const label = labelMap[p.c] || "محصول";
      const stars = Array(Math.floor(p.r))
        .fill(0)
        .map(
          () =>
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
        )
        .join("");
      const card = document.createElement("a");
      card.href = "#";
      card.className = `product-card-v3 category-${p.c}`;
      card.setAttribute("data-aos", "fade-up");
      card.innerHTML = `
        <div class="card-bg"></div>
        <div class="card-blob"><svg viewBox="0 0 200 200"><path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z" transform="translate(100 100)"></path></svg></div>
        <div class="card-image-wrapper"><img src="${p.img}" alt="${
        p.t
      }" class="card-image"></div>
        <div class="card-content">
          <div class="card-category"><i data-feather="${icon}" class="w-3 h-3"></i><span>${label}</span></div>
          <h3 class="card-title">${p.t}</h3>
          <div class="card-brand">${p.b}</div>
          <div class="card-rating">${stars}<span>${p.r.toLocaleString("fa-IR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}</span></div>
          <p class="card-price">${KUtils.toIRR(p.p)}</p>
        </div>`;
      return card;
    }

    function loadProducts() {
      if (currentIdx >= visibleProducts.length) return;
      const frag = document.createDocumentFragment();
      const slice = visibleProducts.slice(currentIdx, currentIdx + perPage);
      slice.forEach((p) => frag.appendChild(createProductCard(p)));
      productGrid.appendChild(frag);
      currentIdx += perPage;
      KUtils.refreshIcons();
      const countEl = document.getElementById("product-count");
      countEl && (countEl.textContent = productGrid.children.length);
    }

    // Sort dropdown
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
      KUtils.refreshIcons();
    }
    function sortProducts(key = "newest") {
      if (key === "newest")
        visibleProducts.sort((a, b) => parseInt(b.d) - parseInt(a.d));
      else if (key === "popular") visibleProducts.sort((a, b) => b.r - a.r);
      else if (key === "price-asc") visibleProducts.sort((a, b) => a.p - b.p);
      else if (key === "price-desc") visibleProducts.sort((a, b) => b.p - a.p);
      productGrid.innerHTML = "";
      currentIdx = 0;
      loadProducts();
      updateSortUI(key);
    }
    sortTrigger &&
      sortTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        sortWrap.classList.contains("is-open") ? closeSort() : openSort();
      });
    sortItems.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.dataset.sort;
        closeSort();
        sortProducts(key);
      })
    );
    document.addEventListener("click", closeSort);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSort();
    });

    // Initial sort + render
    sortProducts("newest");

    // Infinite scroll
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            currentIdx < visibleProducts.length
          ) {
            loadingIndicator.style.opacity = "1";
            setTimeout(() => {
              loadProducts();
              loadingIndicator.style.opacity = "0";
            }, 800);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(loadingIndicator);
    }

    // Filter sidebar (mobile)
    const openFilterBtn = document.getElementById("open-filter-btn");
    const closeFilterBtn = document.getElementById("close-filter-btn");
    const shopSidebar = document.getElementById("shop-sidebar");
    const filterOverlay = document.createElement("div");
    filterOverlay.className = "mobile-menu-overlay";
    document.body.appendChild(filterOverlay);

    function toggleFilterMenu() {
      shopSidebar?.classList.toggle("is-active");
      filterOverlay.classList.toggle("is-active");
      document.body.classList.toggle("filter-menu-open");
    }
    openFilterBtn &&
      closeFilterBtn &&
      shopSidebar &&
      (openFilterBtn.addEventListener("click", toggleFilterMenu),
      closeFilterBtn.addEventListener("click", toggleFilterMenu),
      filterOverlay.addEventListener("click", toggleFilterMenu));

    // Price range UI
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
        minDisp.textContent = KUtils.toFa(minVal) + " تومان";
        maxDisp.textContent = KUtils.toFa(maxVal) + " تومان";
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

    // Apply Filters
    const applyFiltersBtn = document.getElementById("apply-filters-btn");
    function getCheckedValues(name) {
      return Array.from(
        document.querySelectorAll(`input[name="${name}"]:checked`)
      ).map((el) => el.value);
    }
    function applyFilters() {
      const cats = getCheckedValues("category");
      const brands = getCheckedValues("brand");
      const minVal = parseInt(document.querySelector(".range-min")?.value || 0);
      const maxVal = parseInt(
        document.querySelector(".range-max")?.value || Number.MAX_SAFE_INTEGER
      );
      visibleProducts = allProducts.filter((p) => {
        const okCat = cats.length ? cats.includes(p.c) : true;
        const okBrand = brands.length ? brands.includes(p.b) : true;
        const okPrice = p.p >= minVal && p.p <= maxVal;
        return okCat && okBrand && okPrice;
      });
      const activeSortKey =
        (Array.from(document.querySelectorAll(".sort-item")) || []).find(
          (o) => o.getAttribute("aria-selected") === "true"
        )?.dataset.sort || "newest";
      sortProducts(activeSortKey);
      if (shopSidebar?.classList.contains("is-active")) toggleFilterMenu();
    }
    applyFiltersBtn && applyFiltersBtn.addEventListener("click", applyFilters);
  });
})();
