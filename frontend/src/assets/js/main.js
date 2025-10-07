// src/assets/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // AOS
  if (window.AOS) {
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
    });
    document
      .querySelectorAll("[data-aos-duration]")
      .forEach((e) => e.setAttribute("data-aos-duration", "600"));
  }

  // Icons
  KUtils.refreshIcons();

  // Footer links
  KUtils.buildFooterLinks();

  // Clouds + Particles (if present)
  KUtils.createClouds(".cloud-animation", window.innerWidth < 768 ? 6 : 10);
  KUtils.createParticles(".particle-overlay", window.innerWidth < 768 ? 4 : 9);

  // Back-to-top (shared id)
  const btt = document.getElementById("backToTop");
  if (btt) {
    window.addEventListener(
      "scroll",
      KUtils.throttle(() => {
        const y = window.pageYOffset || 0;
        btt.style.opacity = y > 500 ? "1" : "0";
        btt.style.visibility = y > 500 ? "visible" : "hidden";
      }, 100)
    );
    btt.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  // Loader fade (if present)
  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => (loader.style.display = "none"), 400);
      }, 600);
    }
  });

  // Homepage sections population (index.html)
  // ========== DYNAMIC PRODUCT GRID FOR HOMEPAGE ==========
  const productGrid = document.getElementById("product-grid");
  if (productGrid) {
    const API_PRODUCTS = "/api/products";
    let currentFilter = "all"; // Default filter

    // Category mapping
    const categoryMap = {
      skincare: "SKINCARE",
      makeup: "MAKEUP",
      fragrance: "FRAGRANCE",
      haircare: "HAIRCARE",
      "body-bath": "BODY_BATH",
    };

    const categoryIcons = {
      SKINCARE: "shield",
      MAKEUP: "pen-tool",
      FRAGRANCE: "wind",
      HAIRCARE: "git-branch",
      BODY_BATH: "droplet",
    };

    const categoryLabels = {
      SKINCARE: "مراقبت از پوست",
      MAKEUP: "آرایش",
      FRAGRANCE: "عطر",
      HAIRCARE: "مراقبت از مو",
      BODY_BATH: "بدن و حمام",
    };

    // Helper functions from shop.js
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
      const category = item.category || "SKINCARE";
      const cIcon = categoryIcons[category] || "gift";
      const cLabel = categoryLabels[category] || "محصول";
      const img = item.heroImageUrl || "/assets/images/products/product.png";
      const { c1, c2 } = deriveCardColors(item);
      const catCls = `category-${String(category).toLowerCase().replace("_", "-")}`;

      const a = document.createElement("a");
      a.href = `/product/${encodeURIComponent(item.slug)}`;
      a.className = `product-card-v3 break-inside-avoid ${catCls}`;
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
        <p class="card-price">${toIRR(item.price)}</p>
      </div>
    `;
      return a;
    }

    async function fetchProducts(filter = "all") {
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("perPage", "4"); // 4 products
        params.set("includeImages", "true");
        params.set("activeOnly", "true");

        // Apply filter logic
        if (filter === "all") {
          // All products - newest
          params.set("sort", "newest");
        } else if (filter === "bestseller") {
          // Best sellers - sort by popularity/sales
          params.set("sort", "popular");
        } else if (filter === "skincare") {
          params.set("sort", "newest");
          params.append("categories[]", categoryMap["skincare"]);
        } else if (filter === "makeup") {
          params.set("sort", "newest");
          params.append("categories[]", categoryMap["makeup"]);
        } else if (filter === "fragrance") {
          params.set("sort", "newest");
          params.append("categories[]", categoryMap["fragrance"]);
        }

        const response = await fetch(`${API_PRODUCTS}?${params.toString()}`);
        if (!response.ok) {
          console.error("Failed to fetch products:", response.status);
          return;
        }

        const json = await response.json();
        console.log("Products API Response:", json); // Debug
        const products = json?.data?.items || [];

        renderProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }

    function renderProducts(products) {
      // Clear grid
      productGrid.innerHTML = "";

      if (products.length === 0) {
        productGrid.innerHTML =
          '<p class="col-span-full text-center text-gray-500 py-8">محصولی یافت نشد</p>';
        return;
      }

      // Render each product
      products.forEach((product, index) => {
        const card = createProductCard(product);
        card.setAttribute("data-aos-delay", index * 100);
        productGrid.appendChild(card);
      });

      // Refresh icons and animations
      if (window.KUtils?.refreshIcons) {
        KUtils.refreshIcons();
      }
      if (window.AOS) {
        AOS.refresh();
      }
    }

    // Filter button click handlers
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");

        // Update active state
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Fetch products with new filter
        currentFilter = filter;
        fetchProducts(filter);
      });
    });

    // Initial load - show all products
    fetchProducts("all");
  }

  // ========== FETCH COLLECTIONS FOR HOMEPAGE ==========
  const collectionsContainer = document.querySelector(
    "#collections .collections-grid"
  );
  if (collectionsContainer) {
    async function fetchCollectionProducts() {
      try {
        // Build API request
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("perPage", "3"); // Get 3 products
        params.set("sort", "newest"); // Most recent
        params.set("includeImages", "true");
        params.set("activeOnly", "true");
        // Optional: Filter by specific collection
        // params.append('collectionIds[]', 'YOUR_COLLECTION_ID_HERE');

        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) {
          console.error("Failed to fetch collections:", response.status);
          return;
        }

        const json = await response.json();
        console.log("Collection Products API Response:", json); // Debug log
        const products = json?.data?.items || [];

        if (products.length > 0) {
          renderCollectionCards(products);
        } else {
          console.warn("No collection products found");
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    }

    function renderCollectionCards(products) {
      // Color schemes for each card
      const colorSchemes = [
        {
          gradient: "linear-gradient(135deg, #fb7185, #fda4af)",
          accent: "#f43f5e",
          light: "#ffe4e6",
          duration1: "20s",
          duration2: "15s",
          duration3: "18s",
        },
        {
          gradient: "linear-gradient(135deg, #a78bfa, #c4b5fd)",
          accent: "#8b5cf6",
          light: "#ddd6fe",
          duration1: "21s",
          duration2: "17s",
          duration3: "25s",
        },
        {
          gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
          accent: "#d97706",
          light: "#fef3c7",
          duration1: "19s",
          duration2: "23s",
          duration3: "16s",
        },
      ];

      // Category icons mapping
      const categoryIcons = {
        SKINCARE: "shield",
        MAKEUP: "pen-tool",
        FRAGRANCE: "wind",
        HAIRCARE: "git-branch",
        BODY_BATH: "droplet",
      };

      // Category labels in Persian
      const categoryLabels = {
        SKINCARE: "مراقبت از پوست",
        MAKEUP: "آرایش",
        FRAGRANCE: "عطر",
        HAIRCARE: "مراقبت از مو",
        BODY_BATH: "بدن و حمام",
      };

      // Clear existing loading message
      collectionsContainer.innerHTML = "";

      // Create first large card
      if (products[0]) {
        const product = products[0];
        const scheme = colorSchemes[0];
        const category = product.category || "SKINCARE";
        const icon = categoryIcons[category] || "gift";
        const label = categoryLabels[category] || "محصول";
        const image =
          product.heroImageUrl || "/assets/images/products/collection.png";
        const description =
          product.description ||
          product.subtitle ||
          "محصول ویژه از کالکشن جدید ما که برای تغذیه و جوانسازی طراحی شده است.";

        const largeCard = document.createElement("a");
        largeCard.href = `/product/${product.slug}`;
        largeCard.className = "collection-card-link group block";
        largeCard.innerHTML = `
          <div class="collection-card-new large h-full" data-aos="fade-right" data-aos-duration="700">
            <div class="collection-visuals-container">
              <div class="card-bg-shapes">
                <div class="card-bg-shape shape-1" style="background: ${scheme.gradient}; animation-duration: ${scheme.duration1};"></div>
                <div class="card-bg-shape shape-2" style="background: ${scheme.accent}; animation-duration: ${scheme.duration2};"></div>
                <div class="card-bg-shape shape-3" style="background: ${scheme.light}; animation-duration: ${scheme.duration3};"></div>
              </div>
              <div class="collection-glob float-animation">
                <img src="${image}" alt="${product.title}" class="collection-product-image" />
                <div class="collection-glob-inner"></div>
              </div>
            </div>
            <div class="collection-content-new">
              <span class="collection-category" style="color: ${scheme.accent}">
                ${label}
              </span>
              <h3 class="collection-title">${product.title}</h3>
              <p class="collection-desc">${description}</p>
              <div class="collection-link">
                <span>کشف کنید</span>
                <i data-feather="arrow-left" class="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-2"></i>
              </div>
            </div>
          </div>
        `;
        collectionsContainer.appendChild(largeCard);
      }

      // Create container for two smaller cards
      const smallCardsContainer = document.createElement("div");
      smallCardsContainer.className = "flex flex-col gap-8";

      // Create two smaller cards
      for (let i = 1; i < Math.min(products.length, 3); i++) {
        const product = products[i];
        const scheme = colorSchemes[i];
        const category = product.category || "SKINCARE";
        const icon = categoryIcons[category] || "gift";
        const label = categoryLabels[category] || "محصول";
        const image =
          product.heroImageUrl || "/assets/images/products/collection.png";

        const smallCard = document.createElement("a");
        smallCard.href = `/product/${product.slug}`;
        smallCard.className = "collection-card-link group block";
        smallCard.innerHTML = `
          <div class="collection-card-new" data-aos="fade-left" data-aos-duration="700" data-aos-delay="${i * 100}">
            <div class="collection-visuals-container">
              <div class="card-bg-shapes">
                <div class="card-bg-shape shape-1" style="background: ${scheme.gradient}; animation-duration: ${scheme.duration1};"></div>
                <div class="card-bg-shape shape-2" style="background: ${scheme.accent}; animation-duration: ${scheme.duration2};"></div>
                <div class="card-bg-shape shape-3" style="background: ${scheme.light}; animation-duration: ${scheme.duration3};"></div>
              </div>
              <div class="collection-glob float-animation">
                <img src="${image}" alt="${product.title}" class="collection-product-image" />
                <div class="collection-glob-inner"></div>
              </div>
            </div>
            <div class="collection-content-new">
              <span class="collection-category" style="color: ${scheme.accent}">
                ${label}
              </span>
              <h3 class="collection-title">${product.title}</h3>
              <div class="collection-link">
                <span>کشف کنید</span>
                <i data-feather="arrow-left" class="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-2"></i>
              </div>
            </div>
          </div>
        `;
        smallCardsContainer.appendChild(smallCard);
      }

      collectionsContainer.appendChild(smallCardsContainer);

      // Refresh icons and animations after rendering
      if (window.KUtils?.refreshIcons) {
        KUtils.refreshIcons();
      }
      if (window.AOS) {
        AOS.refresh();
      }
    }

    // Execute the fetch
    fetchCollectionProducts();
  }

  // ========== FETCH CATEGORIES FOR HOMEPAGE ==========
  const categoryContainer = document.querySelector(
    ".category-scroll-container .flex"
  );
  if (categoryContainer) {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/products/filters", {
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Failed to fetch categories:", response.status);
          return;
        }

        const json = await response.json();
        console.log("Categories API Response:", json); // Debug log
        const categories = json?.data?.categories || [];

        if (categories.length > 0) {
          renderCategoryCards(categories);
        } else {
          console.warn("No categories found, using fallback");
          // Use fallback categories
          const fallbackCategories = [
            { category: "SKINCARE", count: 0 },
            { category: "MAKEUP", count: 0 },
            { category: "FRAGRANCE", count: 0 },
            { category: "HAIRCARE", count: 0 },
            { category: "BODY_BATH", count: 0 },
          ];
          renderCategoryCards(fallbackCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Render fallback on error
        const fallbackCategories = [
          { category: "SKINCARE", count: 0 },
          { category: "MAKEUP", count: 0 },
          { category: "FRAGRANCE", count: 0 },
          { category: "HAIRCARE", count: 0 },
          { category: "BODY_BATH", count: 0 },
        ];
        renderCategoryCards(fallbackCategories);
      }
    }

    function renderCategoryCards(categories) {
      // Static image mapping for each category
      const categoryImages = {
        SKINCARE: "/assets/images/products/skin.png",
        MAKEUP: "/assets/images/products/cosmetic.png",
        FRAGRANCE: "/assets/images/products/perfume.png",
        HAIRCARE: "/assets/images/products/hair.png",
        BODY_BATH: "/assets/images/products/body.png",
      };

      // Icon mapping
      const categoryIcons = {
        SKINCARE: "shield",
        MAKEUP: "pen-tool",
        FRAGRANCE: "wind",
        HAIRCARE: "git-branch",
        BODY_BATH: "droplet",
      };

      // Persian labels
      const categoryLabels = {
        SKINCARE: "مراقبت از پوست",
        MAKEUP: "آرایش",
        FRAGRANCE: "عطر",
        HAIRCARE: "مراقبت از مو",
        BODY_BATH: "بدن و حمام",
      };

      // Slug mapping (for URLs)
      const categorySlugs = {
        SKINCARE: "skincare",
        MAKEUP: "makeup",
        FRAGRANCE: "fragrance",
        HAIRCARE: "haircare",
        BODY_BATH: "body-bath",
      };

      // Clear existing content
      categoryContainer.innerHTML = "";

      // Render each category card
      categories.forEach((category, index) => {
        const categoryKey = category.category || category.name || category.id;
        const image =
          categoryImages[categoryKey] || "/assets/images/products/product.png";
        const icon = categoryIcons[categoryKey] || "gift";
        const label =
          categoryLabels[categoryKey] || category.name || categoryKey;
        const slug =
          categorySlugs[categoryKey] || categoryKey.replace("_", "-");
        const count = category.count || category._count?.products || 0;

        const card = document.createElement("a");
        card.href = `/shop?category=${slug}`;
        card.className = "category-card w-52 md:w-64 flex-shrink-0";
        card.setAttribute("data-aos", "fade-up");
        card.setAttribute("data-aos-delay", index * 100);

        card.innerHTML = `
          <img
            src="${image}"
            alt="${label}"
            class="category-card-bg"
          />
          <div class="category-card-overlay"></div>
          <div class="category-card-content">
            <div class="category-card-icon">
              <i data-feather="${icon}" class="w-6 h-6"></i>
            </div>
            <h3 class="category-card-title">${label}</h3>
            ${count > 0 ? `<p class="text-xs text-white/80 mt-1">${KUtils.toFa ? KUtils.toFa(count) : count} محصول</p>` : ""}
          </div>
        `;

        categoryContainer.appendChild(card);
      });

      // Refresh icons and animations
      if (window.KUtils?.refreshIcons) {
        KUtils.refreshIcons();
      }
      if (window.AOS) {
        AOS.refresh();
      }
    }

    // Execute the fetch
    fetchCategories();
  }

  // ========== FETCH BRANDS FOR HOMEPAGE ==========
  const brandsMarquee = document.querySelector(".brands-marquee");
  if (brandsMarquee) {
    async function fetchBrands() {
      try {
        const response = await fetch("/api/products/filters", {
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Failed to fetch brands:", response.status);
          return;
        }

        const json = await response.json();
        console.log("Brands API Response:", json); // Debug log
        const brands = json?.data?.brands || [];

        if (brands.length > 0) {
          renderBrandItems(brands);
        } else {
          console.warn("No brands found in API response");
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    }

    function renderBrandItems(brands) {
      // Pool of available Feather icons for brands
      const iconPool = [
        "droplet", // skincare / serum
        "feather", // elegance / light touch
        "sun", // glow / sunscreen
        "moon", // night cream
        "star", // beauty / top-rated
        "heart", // customer love
        "smile", // happiness / confidence
        "flower", // natural ingredients
        "gift", // product boxes / promos
        "diamond", // luxury / premium line
        "watch", // timeless beauty
        "umbrella", // protection / SPF
        "droplet", // hydration
        "wind", // freshness / scent
        "layers", // skincare steps
        "camera", // beauty influencer / photos
        "aperture", // clarity / focus on detail
        "eye", // eye makeup / eye cream
        "sunrise", // morning routine
        "sunset", // evening routine
        "cloud", // smooth texture / softness
        "box", // product packaging
        "award", // award-winning formula
        "star", // repetition for variation
        "edit-3", // makeup / brush / pencil
        "zap", // energizing / vitamin C
        "shield", // protection / barrier cream
        "lock", // skin barrier / secure formula
        "key", // secret formula / exclusive
        "target", // precise care / targeting concerns
        "trending-up", // brand growth / popularity
        "shopping-bag", // beauty retail
        "shopping-cart", // online beauty store
        "anchor", // trust / heritage
      ];

      // Consistent icon assignment based on brand name (hash function)
      function getIconForBrand(brandName) {
        let hash = 0;
        for (let i = 0; i < brandName.length; i++) {
          hash = (hash << 5) - hash + brandName.charCodeAt(i);
          hash = hash & hash; // Convert to 32-bit integer
        }
        const index = Math.abs(hash) % iconPool.length;
        return iconPool[index];
      }

      // Clear existing content
      brandsMarquee.innerHTML = "";

      // Render each brand
      brands.forEach((brand, index) => {
        const icon = getIconForBrand(brand.name);
        const brandName = brand.name || "Brand";
        const brandId = brand.id;
        const count = brand.count || brand._count?.products || 0;

        const brandItem = document.createElement("a");
        brandItem.href = `/shop?brandId=${brandId}`;
        brandItem.className = "brand-item";
        brandItem.setAttribute("data-aos", "fade-up");
        brandItem.setAttribute("data-aos-delay", (index % 8) * 50);
        brandItem.setAttribute(
          "title",
          count > 0
            ? `${brandName} - ${KUtils.toFa ? KUtils.toFa(count) : count} محصول`
            : brandName
        );

        brandItem.innerHTML = `
          <div class="brand-logo">
            <i data-feather="${icon}"></i>
          </div>
          <span class="brand-name">${brandName}</span>
        `;

        brandsMarquee.appendChild(brandItem);
      });

      // Duplicate for seamless marquee effect
      const originalBrands = brandsMarquee.innerHTML;
      brandsMarquee.innerHTML = originalBrands + originalBrands;

      // Refresh icons
      if (window.KUtils?.refreshIcons) {
        KUtils.refreshIcons();
      }
      if (window.AOS) {
        AOS.refresh();
      }
    }

    // Execute the fetch
    fetchBrands();
  }

  // ========== FETCH SPECIAL PRODUCTS FOR CAMPAIGN SECTION ==========
  const campaignContainer = document.querySelector(".campaign-section .grid");
  if (campaignContainer) {
    const API_PRODUCTS = "/api/products";

    // Helper functions
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

    async function fetchCampaignProducts() {
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("perPage", "4"); // Get 4 special products
        params.set("sort", "newest"); // Newest first
        params.set("specialOnly", "true"); // Only special/discounted products
        params.set("includeImages", "true");
        params.set("activeOnly", "true");

        console.log("Fetching campaign products:", params.toString());

        const response = await fetch(`${API_PRODUCTS}?${params.toString()}`);
        if (!response.ok) {
          console.error("Failed to fetch campaign products:", response.status);
          return;
        }

        const json = await response.json();
        console.log("Campaign Products API Response:", json);
        const products = json?.data?.items || [];

        if (products.length > 0) {
          renderCampaignProducts(products);
        } else {
          console.warn("No special products found for campaign");
        }
      } catch (error) {
        console.error("Error fetching campaign products:", error);
      }
    }

    function renderCampaignProducts(products) {
      // Category labels for badges
      const categoryLabels = {
        SKINCARE: "مراقبت از پوست",
        MAKEUP: "آرایش",
        FRAGRANCE: "عطر",
        HAIRCARE: "مراقبت از مو",
        BODY_BATH: "بدن و حمام",
      };

      // Clear existing content
      campaignContainer.innerHTML = "";

      // ========== LARGE FEATURED CARD (First Product) ==========
      if (products[0]) {
        const product = products[0];
        const image =
          product.heroImageUrl || "/assets/images/products/skin.png";
        const title = product.title || "محصول ویژه";
        const description =
          product.description ||
          product.subtitle ||
          "محصول ویژه با تخفیف استثنایی";
        const category = categoryLabels[product.category] || "محصول ویژه";
        const price = product.price || 0;
        const discountPrice = product.discountPrice || price;
        const discountPercent =
          price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0;

        const featuredCard = document.createElement("div");
        featuredCard.className = "lg:col-span-2";
        featuredCard.setAttribute("data-aos", "fade-right");
        featuredCard.setAttribute("data-aos-duration", "700");
        featuredCard.innerHTML = `
        <a href="/product/${product.slug}" class="campaign-featured-card group">
          <div class="campaign-featured-image-wrapper">
            <img
              src="${image}"
              alt="${escapeHtml(title)}"
              class="campaign-featured-image"
            />
          </div>
          <div class="campaign-featured-content">
            <span class="badge-cute bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-semibold self-start">
              <i data-feather="sparkles" class="w-4 h-4"></i>
              <span>${discountPercent > 0 ? `${toFa(discountPercent)}% تخفیف` : "جدید و انحصاری"}</span>
            </span>
            <h3 class="text-3xl font-serif font-bold text-white mt-4 mb-3">
              ${escapeHtml(title)}
            </h3>
            <p class="text-rose-100/90 mb-6 max-w-md">
              ${escapeHtml(description)}
            </p>
            ${
              discountPercent > 0
                ? `
              <div class="flex items-center gap-4 mb-6">
                <span class="text-3xl font-bold text-white">${toIRR(discountPrice)}</span>
                <span class="text-lg line-through text-rose-200/60">${toIRR(price)}</span>
              </div>
            `
                : `
              <div class="mb-6">
                <span class="text-3xl font-bold text-white">${toIRR(price)}</span>
              </div>
            `
            }
            <div class="mt-auto pt-6">
              <span class="inline-flex items-center gap-3 bg-white text-rose-900 font-bold px-8 py-4 rounded-full transition-all duration-300 group-hover:bg-rose-100 group-hover:shadow-lg">
                <span>مشاهده محصول</span>
                <i data-feather="arrow-left" class="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-2"></i>
              </span>
            </div>
          </div>
        </a>
      `;
        campaignContainer.appendChild(featuredCard);
      }

      // ========== SIDE CARDS (3 smaller products) ==========
      const sideCardsContainer = document.createElement("div");
      sideCardsContainer.className = "flex flex-col gap-8";
      sideCardsContainer.setAttribute("data-aos", "fade-left");
      sideCardsContainer.setAttribute("data-aos-duration", "700");
      sideCardsContainer.setAttribute("data-aos-delay", "200");

      for (let i = 1; i < Math.min(products.length, 4); i++) {
        const product = products[i];
        const image =
          product.heroImageUrl || "/assets/images/products/product.png";
        const title = product.title || "محصول ویژه";
        const description =
          product.subtitle ||
          product.description?.substring(0, 50) ||
          "محصول ویژه با تخفیف";
        const price = product.price || 0;
        const discountPrice = product.discountPrice || price;
        const discountPercent =
          price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0;

        const sideCard = document.createElement("a");
        sideCard.href = `/product/${product.slug}`;
        sideCard.className = "campaign-side-card group";
        sideCard.innerHTML = `
        <img
          src="${image}"
          alt="${escapeHtml(title)}"
          class="campaign-side-image"
        />
        <div class="campaign-side-content">
          ${
            discountPercent > 0
              ? `
            <span class="inline-block bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-2">
              ${toFa(discountPercent)}% تخفیف
            </span>
          `
              : ""
          }
          <h4 class="font-bold text-lg text-gray-800">${escapeHtml(title)}</h4>
          <p class="text-sm text-gray-500 mb-3">
            ${escapeHtml(description)}
          </p>
          ${
            discountPercent > 0
              ? `
            <div class="flex items-center gap-2">
              <span class="font-semibold text-rose-700">${toIRR(discountPrice)}</span>
              <span class="text-xs line-through text-gray-400">${toIRR(price)}</span>
            </div>
          `
              : `
            <span class="font-semibold text-rose-700">${toIRR(price)}</span>
          `
          }
        </div>
        <div class="campaign-side-arrow">
          <i data-feather="chevron-left"></i>
        </div>
      `;
        sideCardsContainer.appendChild(sideCard);
      }

      campaignContainer.appendChild(sideCardsContainer);

      // Refresh icons and animations
      if (window.KUtils?.refreshIcons) {
        KUtils.refreshIcons();
      }
      if (window.AOS) {
        AOS.refresh();
      }
    }

    // Execute the fetch
    fetchCampaignProducts();
  }
  // Testimonials
  const tGrid = document.getElementById("testimonial-grid");
  if (tGrid) {
    [
      {
        d: 100,
        i: "1438761681033-6461ffad8d80",
        t: "«اکسیر درخشش طلایی پوست من را کاملاً متحول کرده...»",
        n: "نیلوفر احمدی",
        s: "خریدار تأییدشده • ۳ ماه پیش",
      },
      {
        d: 200,
        i: "1494790108377-be9c29b29330",
        t: "«به عنوان یک آرایشگر... کرم پودر کوالا یک تغییر بزرگ است.»",
        n: "سارا رضایی",
        s: "آرایشگر حرفه‌ای • ۱ ماه پیش",
      },
      {
        d: 300,
        i: "1507003211169-0a1dd7228f2d",
        t: "«عطر راز نیمه‌شب حالا عطر امضای من است...»",
        n: "حمید موسوی",
        s: "مشتری وفادار • ۲ هفته پیش",
      },
    ].forEach((t) => {
      tGrid.innerHTML += `
        <div class="testimonial-card w-80 sm:w-96 lg:w-auto flex-shrink-0 snap-start" data-aos="fade-up" data-aos-delay="${t.d}">
          <div class="flex mb-6"><div class="flex text-yellow-400">${'<i data-feather="star" class="w-5 h-5 fill-current"></i>'.repeat(5)}</div></div>
          <p class="text-gray-600 mb-8 italic leading-relaxed">${t.t}</p>
          <div class="flex items-center">
            <img src="/assets/images/profile.png" alt="مشتری" class="w-14 h-14 rounded-full object-cover ml-4">
            <div><h4 class="font-semibold text-gray-800">${t.n}</h4><p class="text-sm text-gray-500">${t.s}</p></div>
          </div>
        </div>`;
    });
    KUtils.refreshIcons();
  }

  // Instagram grid
  const ig = document.getElementById("instagram-grid");
  if (ig) {
    [
      { i: "1", l: "۲.۳" },
      { i: "2", l: "۳.۱" },
      { i: "3", l: "۱.۸" },
      { i: "4", l: "۴.۲" },
    ].forEach((p) => {
      ig.innerHTML += `
        <div class="relative group overflow-hidden rounded-2xl">
          <img src="/assets/images/instagram/${p.i}.png" alt="اینستاگرام" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div class="text-white"><i data-feather="heart" class="w-5 h-5 mb-1"></i><p class="text-sm">${p.l} هزار لایک</p></div>
          </div>
        </div>`;
    });
    KUtils.refreshIcons();
  }
});
