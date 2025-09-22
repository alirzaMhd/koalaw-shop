// src/assets/js/pages/products.js
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
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

    const productBadge = document.getElementById("product-badge");
    const productCategoryEl = document.getElementById("product-category");
    const productTitleEl = document.getElementById("product-title");
    const priceEl = document.getElementById("product-price");
    const compareEl = document.getElementById("product-compare");
    const discountBadgeEl = document.getElementById("product-discount-badge");
    const ratingStarsEl = document.getElementById("rating-stars");
    const variantsContainer = document.getElementById("variants-container");
    const badgesGrid = document.getElementById("product-badges-grid");

    // Related
    const relatedSection = document.getElementById("related-section");
    const relatedList = document.getElementById("related-list");

    const descriptionBody = document.getElementById("description-body");
    const ingredientsBody = document.getElementById("ingredients-body");
    const usageBody = document.getElementById("usage-body");

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

    // ----------- Helpers -----------
    const API_BASE = "/api/products";

    const toFa = (n) => {
      try {
        return typeof KUtils?.toFa === "function"
          ? KUtils.toFa(n)
          : Number(n).toLocaleString("fa-IR");
      } catch {
        return n;
      }
    };
    const faNumber = (n) => {
      try {
        return Number(n).toLocaleString("fa-IR");
      } catch {
        return n;
      }
    };
    const formatPrice = (amount, currencyCode) => {
      if (currencyCode === "IRR" || !currencyCode) {
        return `${faNumber(amount || 0)} تومان`;
      }
      const nf = new Intl.NumberFormat("fa-IR", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
      });
      return nf.format(amount || 0);
    };
    const escapeHtml = (s) =>
      (s || "").replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          }[m])
      );
    const categoryLabel = (cat) => {
      category = cat.toLowerCase();
      const map = {
        skincare: "مراقبت از پوست",
        makeup: "آرایش",
        fragrance: "عطر",
        haircare: "مو",
        "body-bath": "بدن و حمام",
      };
      return map[category] || category || "";
    };
    const categoryIcon = (cat) => {
      category = cat.toLowerCase();
      const map = {
        skincare: "shield",
        makeup: "star",
        fragrance: "droplet",
        haircare: "git-branch",
        "body-bath": "droplet",
      };
      return map[category] || "tag";
    };
    const parseSlugFromUrl = () => {
      const url = new URL(window.location.href);
      const qSlug = url.searchParams.get("slug");
      if (qSlug) return qSlug;

      const parts = url.pathname.split("/").filter(Boolean);
      if (!parts.length) return null;

      // Support: /product/:slug, /products/:slug, /p/:slug, /shop/:category/:slug
      const prev = parts[parts.length - 2];
      if (["product", "products", "p"].includes(prev))
        return parts[parts.length - 1];
      if (parts.length >= 3) return parts[parts.length - 1]; // /shop/:category/:slug

      return parts[parts.length - 1]; // fallback
    };
    const setVisible = (el, visible) =>
      el && el.classList.toggle("hidden", !visible);

    // Relative time in fa
    const timeAgoFa = (iso) => {
      const d = new Date(iso);
      const diff = Math.max(0, Date.now() - d.getTime());
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "لحظاتی پیش";
      if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${toFa(hours)} ساعت پیش`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${toFa(days)} روز پیش`;
      const weeks = Math.floor(days / 7);
      if (weeks < 5) return `${toFa(weeks)} هفته پیش`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${toFa(months)} ماه پیش`;
      const years = Math.floor(days / 365);
      return `${toFa(years)} سال پیش`;
    };

    const iconColorClass = (icon) => {
      const map = {
        feather: "text-green-500",
        award: "text-yellow-500",
        truck: "text-blue-500",
        "refresh-cw": "text-purple-500",
        star: "text-amber-500",
        zap: "text-orange-500",
        shield: "text-rose-500",
        heart: "text-pink-500",
        check: "text-emerald-600",
      };
      return map[icon] || "text-rose-500";
    };

    // Feather icons: after replacement, stars become <svg class="feather feather-star">...
    const findStarIcons = (container) => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll(
          'i[data-feather="star"], svg.feather.feather-star'
        )
      );
    };
    const setTopRating = (avg) => {
      const int = Math.round(Number(avg || 0));
      const stars = findStarIcons(ratingStarsEl);
      stars.forEach((s, i) => {
        if (i < int) s.classList.add("fill-current");
        else s.classList.remove("fill-current");
      });
    };

    // Thumbnails click (delegated)
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
    const renderQty = () => {
      qtyDisplay && (qtyDisplay.textContent = toFa(quantity));
    };
    renderQty();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".quantity-btn");
      if (!btn) return;
      const isMinus = btn.querySelector('[data-feather="minus"]');
      quantity = Math.max(1, quantity + (isMinus ? -1 : +1));
      renderQty();
    });

    // Tabs
    const showTabByName = (name) => {
      tabContents.forEach((c) => c.classList.add("hidden"));
      document.getElementById(name)?.classList.remove("hidden");
      tabButtons.forEach((b) => b.classList.remove("active"));
      const btn = Array.from(tabButtons).find((b) => b.dataset.tab === name);
      btn && btn.classList.add("active");
    };
    tabButtons.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabName = btn.dataset.tab;
        if (tabName) {
          showTabByName(tabName);
        }
      })
    );

    // Reviews count + interactive rating
    let currentRating = 0;
    let initialReviewsCount = 0; // from DB
    let userReviewsCount = 0;
    let currentAvgRating = 0;
    const updateReviewCounts = () => {
      const total = initialReviewsCount + userReviewsCount;
      const fa = toFa(total);
      reviewCountInline && (reviewCountInline.textContent = `(${fa} نظر)`);
      reviewTabCount && (reviewTabCount.textContent = fa);
    };

    const setupRatingControl = () => {
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
    };
    setupRatingControl();

    // Submit review -> POST to API, optimistic render
    reviewForm &&
      reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (currentRating < 1) {
          alert("لطفاً امتیاز بدهید.");
          return;
        }
        const name = (reviewName?.value || "").trim();
        const text = (reviewText?.value || "").trim();
        if (!name || !text) return;

        const payload = {
          rating: currentRating,
          body: text,
          guestName: name,
        };

        try {
          const slug = parseSlugFromUrl();
          const res = await fetch(
            `${API_BASE}/slug/${encodeURIComponent(slug)}/reviews`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "same-origin",
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const r = json?.data?.review;

          // Build and prepend card
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
                <div><div class="font-semibold">${escapeHtml(
                  r?.authorName || name
                )}</div><div class="text-sm text-gray-500">لحظاتی پیش</div></div>
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

          // Update counts and top rating (approx)
          const oldCount = initialReviewsCount + userReviewsCount;
          const newAvg =
            (currentAvgRating * oldCount + payload.rating) /
            (oldCount + 1 || 1);
          currentAvgRating = newAvg;
          setTopRating(newAvg);

          userReviewsCount++;
          updateReviewCounts();
        } catch (err) {
          console.error("Failed to submit review:", err);
          alert("خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
        }
      });

    // Helper to fill star icons in product cards (after feather.replace)
    const fillCardStars = (root) => {
      if (!root) return;
      root.querySelectorAll(".product-card-v3 .card-rating").forEach((r) => {
        const vEl = r.querySelector("span");
        if (!vEl) return;
        const ratingValue = parseFloat(
          (vEl.textContent || "").replace("٫", ".")
        );
        const stars = Array.from(
          r.querySelectorAll('i[data-feather="star"], svg.feather.feather-star')
        );
        stars.forEach((s, i) => {
          if (i < Math.floor(ratingValue)) s.classList.add("fill-current");
        });
      });
    };

    KUtils.refreshIcons();

    // ----------- Load product from API and hydrate -----------
    const slug = parseSlugFromUrl();
    if (!slug) {
      console.warn(
        "No product slug found. Use a path like /product/:slug or pass ?slug=..."
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/slug/${encodeURIComponent(slug)}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const p = json?.data?.product;
      if (!p) throw new Error("Product not found in response");

      // Update <title>
      try {
        document.title = `KOALAW | ${p.title} - محصولات لوکس آرایش`;
      } catch {}

      // Category + Title
      if (productCategoryEl)
        productCategoryEl.textContent = categoryLabel(p.category);
      if (productTitleEl) productTitleEl.textContent = p.title || "";

      // Breadcrumb (update last title + category link if possible)
      const breadcrumb = document.querySelector(".breadcrumb");
      if (breadcrumb) {
        const last = breadcrumb.querySelector("span:last-child");
        if (last) last.textContent = p.title || "";
        const catLink = breadcrumb.querySelector('a[href^="/shop/"]');
        if (catLink) {
          catLink.href = `shop?category=${p.category}`;
          catLink.textContent = categoryLabel(p.category);
        }
      }

      // Rating + review counts (use reviewSummary if present)
      const sum = p.reviewSummary || {};
      currentAvgRating = Number(
        typeof sum.ratingAvg === "number" ? sum.ratingAvg : p.ratingAvg
      );
      setTopRating(currentAvgRating);
      initialReviewsCount = Number(
        typeof sum.ratingCount === "number"
          ? sum.ratingCount
          : p.ratingCount || 0
      );
      userReviewsCount = 0;
      updateReviewCounts();

      // Badge chip over image (legacy visual)
      const showLegacyBadges = () => {
        const hasDiscount =
          typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price;
        if (productBadge) {
          if (p.isBestseller) {
            productBadge.textContent = "پرفروش";
            setVisible(productBadge, true);
          } else if (hasDiscount || p.isSpecialProduct) {
            productBadge.textContent = "ویژه";
            setVisible(productBadge, true);
          } else {
            setVisible(productBadge, false);
          }
        }
      };
      const renderDbBadgeChip = () => {
        if (!productBadge) return;
        const badges = Array.isArray(p.badges) ? p.badges : [];
        if (!badges.length) {
          showLegacyBadges();
          return;
        }
        const b = badges[0];
        productBadge.innerHTML = `<span class="inline-flex items-center gap-1">
          <i data-feather="${escapeHtml(
            b.icon || "award"
          )}" class="w-4 h-4"></i>
          ${escapeHtml(b.title || "")}
        </span>`;
        setVisible(productBadge, true);
        KUtils.refreshIcons();
      };
      renderDbBadgeChip();

      // Badges grid (DB-driven)
      const renderDbBadgesGrid = () => {
        if (!badgesGrid) return;
        const badges = Array.isArray(p.badges) ? p.badges : [];
        badgesGrid.innerHTML = "";
        if (!badges.length) {
          badgesGrid.classList.add("hidden");
          return;
        }
        badgesGrid.classList.remove("hidden");
        badges.forEach((b) => {
          const icon = (b.icon || "award").trim();
          const colorClass = iconColorClass(icon);
          const card = document.createElement("div");
          card.className = "bg-white p-4 rounded-xl text-center";
          card.innerHTML = `
            <i data-feather="${escapeHtml(
              icon
            )}" class="w-8 h-8 ${colorClass} mx-auto mb-2"></i>
            <div class="font-semibold text-sm">${escapeHtml(
              b.title || ""
            )}</div>
          `;
          badgesGrid.appendChild(card);
        });
        KUtils.refreshIcons();
      };
      renderDbBadgesGrid();

      // Images (hero + gallery)
      const images = (p.images && p.images.length ? p.images : [])
        .slice()
        .sort((a, b) => a.position - b.position);
      const hero =
        p.heroImageUrl ||
        (images[0] && images[0].url) ||
        "/assets/images/product.png";
      mainImg.src = hero;
      mainImg.alt = p.title || "محصول";
      if (gallery) {
        gallery.innerHTML = "";
        const thumbs = images.length ? images : [{ url: hero, alt: p.title }];
        thumbs.forEach((im, idx) => {
          const div = document.createElement("div");
          div.className = `thumbnail ${idx === 0 ? "active" : ""}`;
          div.innerHTML = `<img src="${im.url}" alt="${escapeHtml(
            im.alt || p.title || "نمای محصول"
          )}" class="w-full h-full object-cover" />`;
          gallery.appendChild(div);
        });
      }

      // Variants (simple selector buttons) — optional
      let selectedVariantId = null;
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        selectedVariantId = p.variants[0].id;
        if (variantsContainer) {
          variantsContainer.innerHTML = `
            <div class="flex items-center gap-4">
              <span class="text-gray-700 font-medium">واریانت:</span>
              <div id="variant-list" class="flex flex-wrap gap-2"></div>
            </div>
          `;
          const list = variantsContainer.querySelector("#variant-list");
          p.variants.forEach((v, idx) => {
            const disabled = v.stock <= 0 || v.isActive === false;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `px-3 py-1 rounded-lg border ${
              idx === 0
                ? "border-rose-400 bg-rose-50"
                : "border-gray-200 bg-white"
            } text-sm hover:border-rose-400 transition ${
              disabled ? "opacity-60 cursor-not-allowed" : ""
            }`;
            btn.textContent = v.variantName;
            btn.dataset.variantId = v.id;
            if (!disabled) {
              btn.addEventListener("click", () => {
                selectedVariantId = v.id;
                list
                  .querySelectorAll("button")
                  .forEach((b) =>
                    b.classList.remove("border-rose-400", "bg-rose-50")
                  );
                btn.classList.add("border-rose-400", "bg-rose-50");
                renderPrice();
              });
            }
            list.appendChild(btn);
          });
          variantsContainer.classList.remove("hidden");
        }
      } else {
        variantsContainer && variantsContainer.classList.add("hidden");
      }

      // Price (reactive to variant selection)
      const currentPrice = () => {
        if (!selectedVariantId) return p.price;
        const v = (p.variants || []).find((x) => x.id === selectedVariantId);
        if (!v) return p.price;
        return typeof v.price === "number" ? v.price : p.price;
      };
      const renderPrice = () => {
        const price = currentPrice();
        if (priceEl) priceEl.textContent = formatPrice(price, p.currencyCode);
        const cmp =
          typeof p.compareAtPrice === "number" ? p.compareAtPrice : null;
        const showCmp = cmp && cmp > price;
        if (compareEl) {
          compareEl.textContent = showCmp
            ? formatPrice(cmp, p.currencyCode)
            : "";
          compareEl.classList.toggle("hidden", !showCmp);
        }
        if (discountBadgeEl) {
          if (showCmp) {
            const pct = Math.round(((cmp - price) / cmp) * 100);
            discountBadgeEl.textContent = `${toFa(pct)}% تخفیف`;
          }
          discountBadgeEl.classList.toggle("hidden", !showCmp);
        }
      };
      renderPrice();

      // Add to cart payload (log for now)
      const addBtn = document.querySelector(".add-to-cart-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          const payload = {
            productId: p.id,
            variantId: selectedVariantId,
            qty: quantity,
          };
          console.log("Add to cart:", payload);
          // TODO: integrate with your cart API
        });
      }

      // Tabs content (hide if empty)
      const setHtmlOrHide = (tabName, mountEl, html) => {
        const btn = Array.from(tabButtons).find(
          (b) => b.dataset.tab === tabName
        );
        const tab = document.getElementById(tabName);
        const has = Boolean(html && html.trim());
        if (btn) btn.classList.toggle("hidden", !has);
        if (tab) tab.classList.toggle("hidden", !has);
        if (has && mountEl) mountEl.innerHTML = html;
      };

      // Description: as paragraphs
      const descHtml = (p.description || "")
        .split(/\n{2,}/)
        .map(
          (chunk) =>
            `<p class="text-gray-600 leading-relaxed mb-4">${escapeHtml(
              chunk.trim()
            )}</p>`
        )
        .join("");
      setHtmlOrHide("description", descriptionBody, descHtml);

      // Ingredients: list or paragraph
      let ingHtml = "";
      if (p.ingredients) {
        const parts = p.ingredients
          .split(/\n|،|,/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          ingHtml = `<h3 class="text-xl font-bold mb-4">ترکیبات</h3>
            <ul class="space-y-2 text-gray-600">${parts
              .map((x) => `<li>• ${escapeHtml(x)}</li>`)
              .join("")}</ul>`;
        } else {
          ingHtml = `<p class="text-gray-600 leading-relaxed">${escapeHtml(
            p.ingredients
          )}</p>`;
        }
      }
      setHtmlOrHide("ingredients", ingredientsBody, ingHtml);

      // Usage: each line = step
      let usageHtml = "";
      if (p.howToUse) {
        const steps = p.howToUse
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        usageHtml = steps
          .map(
            (txt, idx) => `
          <div class="flex items-start gap-4">
            <div class="bg-rose-100 text-rose-800 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">${toFa(
              idx + 1
            )}</div>
            <div><p class="text-gray-600">${escapeHtml(txt)}</p></div>
          </div>`
          )
          .join("");
      }
      setHtmlOrHide("usage", usageBody, usageHtml);

      // Reviews: render from DB (p.reviews)
      const renderStars = (n) =>
        Array(5)
          .fill(0)
          .map(
            (_, i) =>
              `<i data-feather="star" class="w-4 h-4 ${
                i < n ? "fill-current" : ""
              }"></i>`
          )
          .join("");

      if (reviewsList) {
        reviewsList.innerHTML = "";
        const reviews = Array.isArray(p.reviews) ? p.reviews : [];
        reviews.forEach((r) => {
          const avatarSeed =
            Math.random() > 0.5
              ? "1494790108377-be9c29b29330"
              : "1507003211169-0a1dd7228f2d";
          const card = document.createElement("div");
          card.className = "review-card";
          card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-${avatarSeed}?w=50&h=50&fit=crop"
                  class="w-10 h-10 rounded-full"
                  alt="avatar"
                />
                <div>
                  <div class="font-semibold">${escapeHtml(
                    r.authorName || "کاربر"
                  )}</div>
                  <div class="text-sm text-gray-500">${timeAgoFa(
                    r.createdAt
                  )}</div>
                </div>
              </div>
              <div class="stars">${renderStars(Number(r.rating || 0))}</div>
            </div>
            <p class="text-gray-600">${escapeHtml(r.body || "")}</p>
          `;
          reviewsList.appendChild(card);
        });
        KUtils.refreshIcons();
      }

      // Related products: render DB list and link to /product/:slug
      const renderRelated = () => {
        if (!relatedList || !relatedSection) return;
        const items = Array.isArray(p.related) ? p.related : [];
        relatedList.innerHTML = "";
        if (!items.length) {
          relatedSection.classList.add("hidden");
          return;
        }
        relatedSection.classList.remove("hidden");

        items.forEach((item, idx) => {
          const categoryClass = `category-${(item.category || "default")
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
          const ratingText = Number(item.ratingAvg || 0)
            .toFixed(1)
            .replace(".", "٫");
          const href = `/product/${encodeURIComponent(item.slug)}`;
          const hero = item.heroImageUrl || "/assets/images/product.png";

          const card = document.createElement("a");
          card.href = href;
          card.className = `w-3/4 sm:w-1/2 md:w-1/3 lg:w-auto flex-shrink-0 snap-start product-card-v3 ${categoryClass}`;
          card.setAttribute("data-aos", "fade-up");
          card.setAttribute("data-aos-delay", String(100 * (idx + 1)));

          card.innerHTML = `
            <div class="card-bg"></div>
            <div class="card-blob">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/200/svg">
                <path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z" transform="translate(100 100)"></path>
              </svg>
            </div>
            <div class="card-image-wrapper">
              <img src="${hero}" alt="${escapeHtml(
            item.title
          )}" class="card-image" />
            </div>
            <div class="card-content">
              <div class="card-category">
                <i data-feather="${categoryIcon(
                  item.category
                )}" class="w-3 h-3"></i>
                <span>${escapeHtml(categoryLabel(item.category))}</span>
              </div>
              <h3 class="card-title">${escapeHtml(item.title)}</h3>
              <div class="card-rating">
                <i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i>
                <span>${ratingText}</span>
              </div>
              <p class="card-price">${formatPrice(
                item.price,
                item.currencyCode
              )}</p>
            </div>
          `;
          relatedList.appendChild(card);
        });

        // Refresh icons and fill star fills based on rating number
        KUtils.refreshIcons();
        fillCardStars(relatedList);
      };
      renderRelated();

      // Ensure first visible tab is selected
      const firstVisible = Array.from(tabButtons).find(
        (b) => !b.classList.contains("hidden")
      );
      if (firstVisible) showTabByName(firstVisible.dataset.tab);

      // Refresh icons after DOM mutations
      KUtils.refreshIcons();
      // Repaint rating stars after feather.replace
      setTopRating(currentAvgRating);
    } catch (err) {
      console.error("Failed to load product:", err);
      if (productTitleEl) productTitleEl.textContent = "محصول یافت نشد";
      setVisible(productBadge, false);
      badgesGrid && badgesGrid.classList.add("hidden");
      relatedSection && relatedSection.classList.add("hidden");
    }
  });
})();
