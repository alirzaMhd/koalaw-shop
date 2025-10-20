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

    // ========== AUTH & USER PROFILE ==========
    let currentUser = null; // { id, email, profileImage, firstName, lastName }

    // Check authentication and fetch user profile
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Accept: "application/json" },
          credentials: "include", // include cookies
        });

        if (res.ok) {
          const json = await res.json();
          const user = json?.data?.user;

          if (user) {
            // Fetch full profile to get profile image
            const profileRes = await fetch("/api/profile", {
              headers: { Accept: "application/json" },
              credentials: "include",
            });

            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              const profile = profileJson?.data?.profile;

              currentUser = {
                id: user.id,
                email: user.email,
                firstName: profile?.firstName || "کاربر",
                lastName: profile?.lastName || "",
                profileImage:
                  profile?.profileImage || "/assets/images/profile.png",
              };

              return true;
            }
          }
        }
      } catch (err) {
        console.warn("Not authenticated or failed to fetch profile:", err);
      }

      currentUser = null;
      return false;
    }

    // Call auth check at page load
    const isAuthenticated = await checkAuth();

    // Update review form based on auth status
    if (isAuthenticated && currentUser) {
      // Hide name field for authenticated users
      if (reviewName) {
        reviewName.value =
          `${currentUser.firstName} ${currentUser.lastName}`.trim();
        reviewName.disabled = true;
        reviewName.classList.add("bg-gray-100");
        const label = reviewName.parentElement?.querySelector("label");
        if (label) label.textContent = "نام شما (وارد شده)";
      }
    }

    // ========== END AUTH ==========

    // ---- Cart + Toast helpers ----
    const CART_KEY = "koalaw_cart";

    const safeGetJSON = (key, fallback = []) => {
      try {
        if (typeof KUtils?.getJSON === "function")
          return KUtils.getJSON(key, fallback);
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    const safeSetJSON = (key, val) => {
      try {
        if (typeof KUtils?.setJSON === "function")
          return KUtils.setJSON(key, val);
        localStorage.setItem(key, JSON.stringify(val));
      } catch {}
    };

    const loadCart = () => {
      const saved = safeGetJSON(CART_KEY, []);
      return Array.isArray(saved) ? saved : [];
    };
    const saveCart = (cart) => safeSetJSON(CART_KEY, cart);

    const getCartCount = () =>
      loadCart().reduce((sum, item) => sum + (parseInt(item?.qty, 10) || 0), 0);

    const updateNavCartCount = () => {
      const el = document.getElementById("nav-cart-count");
      if (!el) return;
      const n = getCartCount();
      const toFaFn =
        typeof KUtils?.toFa === "function" ? KUtils.toFa : (x) => String(x);
      el.textContent = toFaFn(n);
    };

    // Toast (re-uses global if present, creates one if not)
    function ensureToast() {
      let t = document.getElementById("toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.className = "toast";
        t.innerHTML = `<i data-feather="check-circle"></i><span id="toast-text">انجام شد</span>`;
        document.body.appendChild(t);
        KUtils?.refreshIcons?.();
      }
      return t;
    }
    function showToast(msg, icon = "check-circle") {
      const t = ensureToast();
      const text = t.querySelector("#toast-text") || t.querySelector("span");
      if (text) text.textContent = msg;
      t.querySelector("svg")?.remove();
      const i = document.createElement("i");
      i.setAttribute("data-feather", icon);
      t.insertBefore(i, text);
      KUtils?.refreshIcons?.();
      t.classList.add("show");
      clearTimeout(t._to);
      t._to = setTimeout(() => t.classList.remove("show"), 2200);
    }

    // keep navbar badge fresh on page load
    updateNavCartCount();

    // ----------- Helpers -----------
    const API_BASE = "/api/products";
    const API_ROOT = "/api";
    const CARTS_API = `${API_ROOT}/carts`;
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = (v) => UUID_RE.test(String(v || ""));
    const uuidv4 = () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r =
          (crypto?.getRandomValues?.(new Uint8Array(1))[0] ??
            Math.floor(Math.random() * 256)) & 15;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    async function getOrCreateBackendCartId() {
      // Check if user is authenticated
      if (isAuthenticated && currentUser) {
        // Use authenticated user cart endpoint
        try {
          const resp = await fetch(`${CARTS_API}/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include", // Include auth cookies
          });

          if (resp.ok) {
            const json = await resp.json();
            const id = json?.data?.cart?.id;
            if (isUUID(id)) {
              KUtils?.setJSON?.("koalaw_backend_cart_id", id);
              return id;
            }
          }
        } catch (e) {
          console.warn(
            "Failed to get authenticated cart, falling back to anonymous:",
            e
          );
        }
      }

      // Anonymous cart flow (for guests or if authenticated cart fails)
      let backendCartId = KUtils?.getJSON?.("koalaw_backend_cart_id");
      if (backendCartId && isUUID(backendCartId)) return backendCartId;

      let anonymousId = KUtils?.getJSON?.("koalaw_anonymous_id");
      if (!anonymousId || !isUUID(anonymousId)) {
        anonymousId = uuidv4();
        KUtils?.setJSON?.("koalaw_anonymous_id", anonymousId);
      }

      const resp = await fetch(`${CARTS_API}/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId }),
      });

      if (!resp.ok) throw new Error("Failed to create/get backend cart");
      const json = await resp.json();
      const id = json?.data?.cart?.id;
      if (!isUUID(id)) throw new Error("Invalid backend cart id");
      KUtils?.setJSON?.("koalaw_backend_cart_id", id);
      return id;
    }
    const REVIEWS_API = "/api/reviews"; // NEW

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
      if (currencyCode === "IRT" || !currencyCode) {
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
          })[m]
      );
    const categoryLabel = (cat) => {
      const category = String(cat || "").toLowerCase();
      const map = {
        skincare: "مراقبت از پوست",
        makeup: "آرایش",
        fragrance: "عطر",
        haircare: "مو",
        "body-bath": "بدن و حمام",
      };
      return map[category] || category || "";
    };
    const categoryIconFallback = (cat) => {
      const category = String(cat || "").toLowerCase();
      const map = {
        skincare: "shield",
        makeup: "pen-tool",
        fragrance: "wind",
        haircare: "git-branch",
        "body-bath": "droplet",
      };
      return map[category] || "grid";
    };
    const toCategorySlug = (v) =>
      +String(v || "")
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-");
    const parseSlugFromUrl = () => {
      const url = new URL(window.location.href);
      const qSlug = url.searchParams.get("slug");
      if (qSlug) return qSlug;

      const parts = url.pathname.split("/").filter(Boolean);
      if (!parts.length) return null;

      const prev = parts[parts.length - 2];
      if (["product", "products", "p"].includes(prev))
        return parts[parts.length - 1];
      if (parts.length >= 3) return parts[parts.length - 1];

      return parts[parts.length - 1];
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
    // ========== IMAGE ZOOM (center panel + bigger lens that maps 1:1) ==========
    (function setupImageZoom() {
      if (!mainImg) return;

      const LENS_SIZE_PX = 220; // bigger square lens
      const PANEL_SIZE_PX = 560; // center panel size

      // Ensure zoom panel exists (create or normalize to center of screen)
      let zoomPanel = document.getElementById("zoom-panel");
      if (!zoomPanel) {
        zoomPanel = document.createElement("div");
        zoomPanel.id = "zoom-panel";
        document.body.appendChild(zoomPanel);
      }
      Object.assign(zoomPanel.style, {
        position: "fixed",
        left: "50%",
        top: `calc(100% - ${PANEL_SIZE_PX / 10}px)`,
        transform: "translate(-50%, -50%)",
        width: PANEL_SIZE_PX + "px",
        height: PANEL_SIZE_PX + "px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 25px 40px rgba(0,0,0,.12)",
        backgroundColor: "rgba(255,255,255,.8)",
        backdropFilter: "blur(8px)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 0",
        pointerEvents: "none",
        zIndex: "60",
        display: "none",
      });

      // Ensure lens exists (create if missing)
      let zoomLens = document.getElementById("zoom-lens");
      const mainImageWrap = mainImg.parentElement; // .main-image (relative)
      if (!zoomLens) {
        zoomLens = document.createElement("div");
        zoomLens.id = "zoom-lens";
        mainImageWrap && mainImageWrap.appendChild(zoomLens);
      }
      Object.assign(zoomLens.style, {
        position: "absolute",
        border: "2px solid #fb7185", // rose-400
        background: "rgba(253, 164, 175, .25)", // rose-300/25
        borderRadius: "8px",
        pointerEvents: "none",
        display: "none",
        top: "0px",
        left: "0px",
        transform: "translate(0,0)",
      });
      mainImageWrap && mainImageWrap.classList.add("relative");

      let imgRect, wrapRect, lensSize, zoomFactor;

      function showZoom(e) {
        if (!mainImg.naturalWidth || !mainImg.naturalHeight) {
          mainImg.addEventListener("load", () => showZoom(e), { once: true });
          return;
        }

        zoomPanel.style.display = "block";
        zoomLens.style.display = "block";
        zoomPanel.style.backgroundImage = `url("${mainImg.src}")`;

        imgRect = mainImg.getBoundingClientRect();
        wrapRect = mainImageWrap.getBoundingClientRect();

        // Lens size: big, but never larger than image bounds
        lensSize = Math.min(LENS_SIZE_PX, imgRect.width, imgRect.height);
        zoomFactor = PANEL_SIZE_PX / lensSize;

        zoomLens.style.width = `${lensSize}px`;
        zoomLens.style.height = `${lensSize}px`;

        // Background size scaled based on displayed image size (not natural),
        // so the lens area maps 1:1 to the panel
        const bgW = imgRect.width * zoomFactor;
        const bgH = imgRect.height * zoomFactor;
        zoomPanel.style.backgroundSize = `${bgW}px ${bgH}px`;

        moveZoom(e);
      }

      function moveZoom(e) {
        if (zoomPanel.style.display === "none") return;

        const x = e.clientX - imgRect.left;
        const y = e.clientY - imgRect.top;

        const half = lensSize / 2;

        // Clamp lens inside the displayed image area
        let lx = Math.max(0, Math.min(x - half, imgRect.width - lensSize));
        let ly = Math.max(0, Math.min(y - half, imgRect.height - lensSize));

        // Position lens relative to the wrapper (account for image offset inside it)
        const offsetX = imgRect.left - wrapRect.left;
        const offsetY = imgRect.top - wrapRect.top;
        zoomLens.style.transform = `translate(${offsetX + lx}px, ${offsetY + ly}px)`;

        // Show exactly the lens contents in the panel (lens -> full panel)
        const posX = -lx * zoomFactor;
        const posY = -ly * zoomFactor;
        zoomPanel.style.backgroundPosition = `${posX}px ${posY}px`;
      }

      function hideZoom() {
        zoomPanel.style.display = "none";
        zoomLens.style.display = "none";
      }

      mainImg.addEventListener("mouseenter", showZoom);
      mainImg.addEventListener("mousemove", moveZoom);
      mainImg.addEventListener("mouseleave", hideZoom);

      // If the main image source changes (thumbnail click), update the panel background
      mainImg.addEventListener("load", () => {
        if (zoomPanel.style.display !== "none") {
          zoomPanel.style.backgroundImage = `url("${mainImg.src}")`;
          // Recompute geometry
          imgRect = mainImg.getBoundingClientRect();
          wrapRect = mainImageWrap.getBoundingClientRect();
        }
      });

      gallery &&
        gallery.addEventListener("click", () => {
          if (zoomPanel.style.display !== "none") {
            zoomPanel.style.backgroundImage = `url("${mainImg.src}")`;
          }
        });

      // Keep geometry fresh while active
      window.addEventListener(
        "scroll",
        () => {
          if (zoomPanel.style.display !== "none") {
            imgRect = mainImg.getBoundingClientRect();
            wrapRect = mainImageWrap.getBoundingClientRect();
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", () => {
        if (zoomPanel.style.display !== "none") {
          hideZoom(); // recompute on next enter
        }
      });
    })();
    // ========== END IMAGE ZOOM ==========
    // ========== INVENTORY-AWARE QUANTITY SYSTEM ==========
    let quantity = 1;
    let availableStock = 0;
    let selectedVariantId = null;
    const addBtn = document.querySelector(".add-to-cart-btn");

    // Stock badge UI component
    const updateStockBadge = () => {
      let badge = document.getElementById("stock-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "stock-badge";
        badge.className = "text-sm font-medium mb-4 flex items-center gap-2";
        const qtyContainer =
          document.querySelector(".quantity-selector")?.parentElement;
        if (qtyContainer) {
          qtyContainer.insertBefore(badge, qtyContainer.firstChild);
        }
      }

      if (availableStock <= 0) {
        badge.innerHTML = `
          <i data-feather="x-circle" class="w-4 h-4 text-red-600"></i>
          <span class="text-red-600 font-semibold">ناموجود</span>
        `;
      } else if (availableStock <= 5) {
        badge.innerHTML = `
          <i data-feather="alert-circle" class="w-4 h-4 text-orange-600"></i>
          <span class="text-orange-600">تنها ${toFa(availableStock)} عدد باقی مانده</span>
        `;
      } else if (availableStock <= 20) {
        badge.innerHTML = `
          <i data-feather="check-circle" class="w-4 h-4 text-green-600"></i>
          <span class="text-green-600">موجود (${toFa(availableStock)} عدد)</span>
        `;
      } else {
        badge.innerHTML = `
          <i data-feather="check-circle" class="w-4 h-4 text-green-600"></i>
          <span class="text-green-600">موجود</span>
        `;
      }
      KUtils?.refreshIcons?.();
    };

    const renderQty = () => {
      if (!qtyDisplay) return;
      qtyDisplay.textContent = toFa(quantity);

      const decBtn = document.querySelector('.quantity-btn[data-action="dec"]');
      if (decBtn) {
        const isDisabled = quantity <= 1;
        decBtn.disabled = isDisabled;
        decBtn.style.opacity = isDisabled ? "0.4" : "1";
        decBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
      }

      const incBtn = document.querySelector('.quantity-btn[data-action="inc"]');
      if (incBtn) {
        const isDisabled = quantity >= availableStock;
        incBtn.disabled = isDisabled;
        incBtn.style.opacity = isDisabled ? "0.4" : "1";
        incBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
      }

      if (addBtn) {
        if (availableStock <= 0) {
          addBtn.disabled = true;
          addBtn.innerHTML = `<i data-feather="x-circle" class="w-5 h-5"></i> ناموجود`;
          addBtn.classList.add("opacity-60", "cursor-not-allowed");
          addBtn.style.cursor = "not-allowed";
        } else {
          addBtn.disabled = false;
          addBtn.innerHTML = `<i data-feather="shopping-bag" class="w-5 h-5"></i> افزودن به سبد خرید`;
          addBtn.classList.remove("opacity-60", "cursor-not-allowed");
          addBtn.style.cursor = "pointer";
        }
        KUtils?.refreshIcons?.();
      }
    };

    renderQty();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".quantity-btn");
      if (!btn || btn.disabled) return;

      const isMinus =
        btn.dataset.action === "dec" ||
        !!btn.querySelector(
          '[data-feather="minus"], svg.feather.feather-minus'
        );

      if (isMinus) {
        quantity = Math.max(1, quantity - 1);
      } else {
        if (quantity < availableStock) {
          quantity = quantity + 1;
        } else {
          showToast(
            `حداکثر ${toFa(availableStock)} عدد موجود است`,
            "alert-circle"
          );
        }
      }

      renderQty();
    });

    // ========== END INVENTORY SYSTEM ==========

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

    // ========== REVIEWS SYSTEM (BACKEND-INTEGRATED) ==========
    let currentRating = 0;
    let initialReviewsCount = 0;
    let userReviewsCount = 0;
    let currentAvgRating = 0;
    let currentProductId = null; // Store product ID for review submission

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

    // Helper to get avatar for review
    const getReviewAvatar = (review) => {
      // If current user and this is their review, use their profile image
      if (currentUser && review.userId === currentUser.id) {
        return currentUser.profileImage;
      }
      // Default koala avatar
      return "/assets/images/profile.png";
    };

    // Submit review -> POST to /api/reviews
    reviewForm &&
      reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (currentRating < 1) {
          showToast("لطفاً امتیاز بدهید", "alert-circle");
          return;
        }

        const text = (reviewText?.value || "").trim();
        if (!text) {
          showToast("لطفاً متن نظر را وارد کنید", "alert-circle");
          return;
        }

        if (!currentProductId) {
          showToast("خطا در شناسایی محصول", "x-circle");
          return;
        }

        // Build payload
        const payload = {
          productId: currentProductId,
          rating: currentRating,
          body: text,
          title: null, // Optional: add title field to form if needed
        };

        // Add guestName only if not authenticated
        if (!isAuthenticated) {
          const name = (reviewName?.value || "").trim();
          if (!name) {
            showToast("لطفاً نام خود را وارد کنید", "alert-circle");
            return;
          }
          payload.guestName = name;
        }

        try {
          const res = await fetch(REVIEWS_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include", // Include auth cookies
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}));
            throw new Error(errorJson?.message || `HTTP ${res.status}`);
          }

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

          // Use current user's avatar if authenticated
          const avatarUrl = currentUser
            ? currentUser.profileImage
            : "/assets/images/profile.png";

          const displayName = currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
            : payload.guestName || "کاربر";

          const card = document.createElement("div");
          card.className = "review-card";
          card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover" alt="avatar">
                <div>
                  <div class="font-semibold">${escapeHtml(displayName)}</div>
                  <div class="text-sm text-gray-500">لحظاتی پیش</div>
                </div>
              </div>
              <div class="stars">${starsHtml}</div>
            </div>
            <p class="text-gray-600"></p>`;
          card.querySelector("p").textContent = text;
          reviewsList?.prepend(card);
          KUtils.refreshIcons();

          // Reset form
          reviewForm.reset();
          if (!isAuthenticated && reviewName) reviewName.value = "";
          currentRating = 0;
          setupRatingControl();

          showToast(
            "نظر شما با موفقیت برای تایید به ادمین داده شد ✨",
            "check-circle"
          );

          // Update counts and top rating
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
          showToast(err.message || "خطا در ثبت نظر", "x-circle");
        }
      });

    // ========== END REVIEWS SYSTEM ==========

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

      // Store product ID for review submissions
      currentProductId = p.id;

      // Update <title>
      try {
        document.title = `KOALAW | ${p.title} - محصولات لوکس آرایش`;
      } catch {}

      // Category + Title
      if (productCategoryEl) {
        const catLabel =
          p.categoryLabel || categoryLabel(p.category || p.categoryValue || "");
        productCategoryEl.textContent = catLabel;
        // Update the category icon beside the label using DB icon if provided
        const wrap = productCategoryEl.parentElement;
        if (wrap) {
          const iconEl = wrap.querySelector("i[data-feather], svg.feather");
          const slug = toCategorySlug(p.categoryValue || p.category || "");
          const iconName = p.categoryIcon || categoryIconFallback(slug);
          // If it's already an <i>, update attribute; if it's an svg, replace with <i> and re-render icons
          let iTag = wrap.querySelector("i[data-feather]");
          if (!iTag) {
            // replace any existing svg with a new <i>
            if (
              iconEl &&
              iconEl.tagName &&
              iconEl.tagName.toLowerCase() === "svg"
            ) {
              iconEl.remove();
            }
            const i = document.createElement("i");
            i.setAttribute("data-feather", iconName);
            i.className = "w-4 h-4";
            wrap.insertBefore(i, wrap.firstChild);
          } else {
            iTag.setAttribute("data-feather", iconName);
          }
          KUtils?.refreshIcons?.();
        }
      }
      if (productTitleEl) productTitleEl.textContent = p.title || "";

      // Breadcrumb
      const breadcrumb = document.querySelector(".breadcrumb");
      if (breadcrumb) {
        const last = breadcrumb.querySelector("span:last-child");
        if (last) last.textContent = p.title || "";
        const catLink = breadcrumb.querySelector('a[href^="/shop/"]');
        if (catLink) {
          const slug = toCategorySlug(p.categoryValue || p.category || "");
          const catLabel =
            p.categoryLabel ||
            categoryLabel(p.category || p.categoryValue || "");
          catLink.href = `/shop?category=${slug}`;
          catLink.textContent = catLabel;
        }
      }

      // Rating + review counts
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

      // Badge chip
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

      // Badges grid
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

      // Images
      const images = (p.images && p.images.length ? p.images : [])
        .slice()
        .sort((a, b) => a.position - b.position);
      const hero =
        p.heroImageUrl ||
        (images[0] && images[0].url) ||
        p.categoryHeroImageUrl || // NEW: fallback to category hero image from DB
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

      // ========== INVENTORY-AWARE VARIANT SYSTEM ==========

      const getAvailableStock = () => {
        if (!selectedVariantId) {
          return p.stock ?? 999;
        }
        const v = (p.variants || []).find((x) => x.id === selectedVariantId);
        return v?.stock ?? 0;
      };

      const updateStock = () => {
        availableStock = getAvailableStock();
        quantity = Math.min(quantity, Math.max(1, availableStock));
        if (quantity < 1) quantity = 1;
        renderQty();
        updateStockBadge();
      };

      if (Array.isArray(p.variants) && p.variants.length > 0) {
        const firstInStock = p.variants.find(
          (v) => v.stock > 0 && v.isActive !== false
        );
        selectedVariantId = firstInStock ? firstInStock.id : p.variants[0].id;

        if (variantsContainer) {
          variantsContainer.innerHTML = `
            <div class="flex items-center gap-4">
              <span class="text-gray-700 font-medium">واریانت:</span>
              <div id="variant-list" class="flex flex-wrap gap-2"></div>
            </div>
          `;
          const list = variantsContainer.querySelector("#variant-list");

          const SELECTED = ["border-black", "bg-rose-50"];
          const UNSELECTED = ["border-gray-300", "bg-white"];

          p.variants.forEach((v) => {
            const outOfStock = v.stock <= 0 || v.isActive === false;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `px-3 py-1 rounded-lg border text-sm transition hover:border-black ${
              outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""
            }`;
            btn.textContent = v.variantName;
            btn.dataset.variantId = v.id;
            btn.title = outOfStock ? "ناموجود" : `موجود: ${toFa(v.stock)} عدد`;

            if (v.id === selectedVariantId) {
              btn.classList.add(...SELECTED);
            } else {
              btn.classList.add(...UNSELECTED);
            }

            if (!outOfStock) {
              btn.addEventListener("click", () => {
                selectedVariantId = v.id;

                list.querySelectorAll("button").forEach((b) => {
                  b.classList.remove(...SELECTED);
                  b.classList.add(...UNSELECTED);
                });

                btn.classList.remove(...UNSELECTED);
                btn.classList.add(...SELECTED);

                renderPrice();
                updateStock();
              });
            } else {
              btn.disabled = true;
            }
            list.appendChild(btn);
          });
          variantsContainer.classList.remove("hidden");
        }
      } else {
        variantsContainer && variantsContainer.classList.add("hidden");
      }

      updateStock();

      // ========== END INVENTORY-AWARE VARIANT SYSTEM ==========

      // Price
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

      // Add to cart
      // Add to cart
      if (addBtn) {
        addBtn.addEventListener("click", async () => {
          if (availableStock <= 0) {
            showToast("این محصول ناموجود است", "x-circle");
            return;
          }

          if (quantity > availableStock) {
            showToast(
              `حداکثر ${toFa(availableStock)} عدد موجود است`,
              "alert-circle"
            );
            return;
          }

          const vObj =
            selectedVariantId && Array.isArray(p.variants)
              ? p.variants.find((v) => v.id === selectedVariantId)
              : null;

          const lineId = selectedVariantId
            ? `${p.id}__${selectedVariantId}`
            : String(p.id);

          const imageUrl =
            document.getElementById("main-product-image")?.src ||
            p.heroImageUrl ||
            (Array.isArray(p.images) && p.images[0]?.url) ||
            "/assets/images/product.png";

          const cart = loadCart();
          const idx = cart.findIndex((x) => x.id === lineId);

          const existingQty = idx > -1 ? cart[idx].qty : 0;
          const totalQty = existingQty + quantity;

          if (totalQty > availableStock) {
            showToast(
              `شما ${toFa(
                existingQty
              )} عدد از این محصول در سبد دارید. حداکثر موجود: ${toFa(
                availableStock
              )}`,
              "alert-circle"
            );
            return;
          }

          if (idx > -1) {
            cart[idx].qty = totalQty;
            cart[idx].productId = cart[idx].productId || p.id;
            cart[idx].variantId =
              cart[idx].variantId || selectedVariantId || null;
            cart[idx].currencyCode =
              cart[idx].currencyCode || p.currencyCode || "IRT";
          } else {
            cart.push({
              id: lineId,
              title: p.title || "محصول",
              price:
                typeof currentPrice === "function" ? currentPrice() : p.price,
              qty: quantity,
              image: imageUrl,
              variant: vObj?.variantName || "",
              productId: p.id,
              variantId: selectedVariantId || null,
              currencyCode: p.currencyCode || "IRT",
            });
          }

          saveCart(cart);
          updateNavCartCount();
          showToast("به سبد اضافه شد", "check-circle");

          // Sync to backend cart with comprehensive error handling
          try {
            console.log("[ADD TO CART] Starting backend sync...");
            console.log("[ADD TO CART] Product ID:", p.id);
            console.log("[ADD TO CART] Quantity:", quantity);

            // Validate product ID is UUID
            if (!isUUID(p.id)) {
              console.error(
                "[ADD TO CART] Product ID is not a valid UUID:",
                p.id
              );
              throw new Error("Invalid product ID format");
            }

            const cartId = await getOrCreateBackendCartId();
            console.log("[ADD TO CART] Backend Cart ID:", cartId);

            const payload = {
              productId: p.id,
              variantId:
                selectedVariantId && isUUID(selectedVariantId)
                  ? selectedVariantId
                  : null,
              quantity: quantity,
            };

            const response = await fetch(`${CARTS_API}/${cartId}/items`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(payload),
            });

            console.log("[ADD TO CART] Response status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("[ADD TO CART] Backend error response:", errorText);

              let errorJson;
              try {
                errorJson = JSON.parse(errorText);
              } catch {
                errorJson = { message: errorText };
              }

              throw new Error(
                errorJson?.message || `Backend sync failed: ${response.status}`
              );
            }

            const result = await response.json();
            console.log("[ADD TO CART] Success! Backend response:", result);
          } catch (e) {
            console.error("[ADD TO CART] Backend sync failed:", e);
            console.error("[ADD TO CART] Error details:", {
              message: e.message,
              stack: e.stack,
            });

            // Show error toast but don't prevent local cart update
            showToast(
              `افزوده شد (همگام‌سازی با سرور ناموفق: ${e.message})`,
              "alert-triangle"
            );
          }

          addBtn.classList.add("opacity-90");
          setTimeout(() => addBtn.classList.remove("opacity-90"), 200);
        });
      }

      // Tabs content
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

      // Description - render HTML directly
      const descHtml = p.description || "";
      setHtmlOrHide("description", descriptionBody, descHtml);

      // Ingredients - render HTML directly
      const ingHtml = p.ingredients || "";
      setHtmlOrHide("ingredients", ingredientsBody, ingHtml);

      // How to Use - render HTML directly
      const usageHtml = p.howToUse || "";
      setHtmlOrHide("usage", usageBody, usageHtml);
      // Reviews: render from DB with avatar logic
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
          // Use authenticated user's avatar if this is their review
          const avatarUrl = getReviewAvatar(r);

          const card = document.createElement("div");
          card.className = "review-card";
          card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <img
                  src="${avatarUrl}"
                  class="w-10 h-10 rounded-full object-cover"
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

      // Related products
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
          const slug = toCategorySlug(
            item.categoryValue || item.category || "default"
          );
          const categoryClass = `category-${slug}`;
          const ratingText = Number(item.ratingAvg || 0)
            .toFixed(1)
            .replace(".", "٫");
          const href = `/product/${encodeURIComponent(item.slug)}`;
          const hero = item.heroImageUrl || "/assets/images/product.png";
          const label =
            item.categoryLabel ||
            categoryLabel(item.categoryValue || item.category || "");
          const icon = item.categoryIcon || categoryIconFallback(slug);
          const card = document.createElement("a");
          card.href = href;
          card.className = `w-3/4 sm:w-1/2 md:w-1/3 lg:w-auto flex-shrink-0 snap-start product-card-v3 ${categoryClass}`;
          card.setAttribute("data-aos", "fade-up");
          card.setAttribute("data-aos-delay", String(100 * (idx + 1)));

          card.innerHTML = `
            <div class="card-bg"></div>
            <div class="card-blob">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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
                <i data-feather="${icon}" class="w-3 h-3"></i>
                <span>${escapeHtml(label)}</span>
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

        KUtils.refreshIcons();
        fillCardStars(relatedList);
      };
      renderRelated();

      const firstVisible = Array.from(tabButtons).find(
        (b) => !b.classList.contains("hidden")
      );
      if (firstVisible) showTabByName(firstVisible.dataset.tab);

      KUtils.refreshIcons();
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
