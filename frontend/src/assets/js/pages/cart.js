// src/assets/js/pages/cart.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Only run on cart SPA
    if (!document.getElementById("view-cart")) return;

    // Init AOS
    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();

    // Footer links (if needed)
    KUtils.buildFooterLinks();

    // Toast
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    function showToast(msg, icon = "check-circle") {
      if (!toast) return;
      toastText.textContent = msg;
      toast.querySelector("svg")?.remove();
      const i = document.createElement("i");
      i.setAttribute("data-feather", icon);
      toast.insertBefore(i, toastText);
      KUtils.refreshIcons();
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2200);
    }

    // Constants + storage keys
    const API_BASE = "/api"; // Your backend API base URL
    const CART_KEY = "koalaw_cart";
    const STATE_KEY = "koalaw_cart_state";
    const ADDR_KEY = "koalaw_checkout_address";
    const LAST_ORDER_KEY = "koalaw_last_order";

    const FREE_SHIP_THRESHOLD = 1000000;
    const BASE_SHIPPING = 45000;
    const EXPRESS_PRICE = 30000;
    const GIFT_WRAP_PRICE = 20000;

    // Sample coupons (for frontend validation before API call)
        const coupons = {
          KOALAW10: {
            type: "percent",
            value: 10,
            min: 0,
            msg: "کد ۱۰٪ تخفیف اعمال شد.",
          },
          WELCOME15: {
            type: "percent",
            value: 15,
            min: 400000,
            msg: "۱۵٪ تخفیف خوش‌آمدگویی اعمال شد.",
          },
          FREESHIP: {
            type: "shipping",
            value: BASE_SHIPPING,
            min: 0,
            msg: "ارسال رایگان فعال شد.",
          },
        };

    const SAMPLE_ITEMS = [];
    // UUID validation helper
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

    // Add after the constants section (around line 30):

    // Check if user is authenticated
    async function isAuthenticated() {
      try {
        const resp = await fetch(`${API_BASE}/profile`, {
          credentials: "include",
        });
        return resp.ok;
      } catch (e) {
        return false;
      }
    }

    // Fetch user profile data
    async function fetchUserProfile() {
      try {
        const resp = await fetch(`${API_BASE}/profile`, {
          credentials: "include",
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.data?.profile || null;
      } catch (e) {
        console.warn("[CART] Failed to fetch profile:", e);
        return null;
      }
    }

    // Fetch user addresses
    async function fetchUserAddresses() {
      try {
        const resp = await fetch(`${API_BASE}/profile/addresses`, {
          credentials: "include",
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return data?.data?.addresses || [];
      } catch (e) {
        console.warn("[CART] Failed to fetch addresses:", e);
        return [];
      }
    }

    // Select address from saved addresses
    function selectSavedAddress(address) {
      const addr = {
        firstname: address.firstName || "",
        lastname: address.lastName || "",
        phone: address.phone || "",
        postal: address.postalCode || "",
        province: address.province || "",
        city: address.city || "",
        line1: address.addressLine1 || "",
      };
      saveAddress(addr);

      // Update form fields
      [
        "firstname",
        "lastname",
        "phone",
        "postal",
        "province",
        "city",
        "line1",
      ].forEach((k) => {
        const el = document.getElementById("addr-" + k);
        if (el) el.value = addr[k];
      });

      renderAddress();
      showToast("آدرس انتخاب شد", "map-pin");
    }

    // Get or create backend cart ID
    async function getOrCreateBackendCartId() {
      let backendCartId = KUtils.getJSON("koalaw_backend_cart_id");
      if (backendCartId && isUUID(backendCartId)) return backendCartId;

      let anonymousId = KUtils.getJSON("koalaw_anonymous_id");
      if (!anonymousId || !isUUID(anonymousId)) {
        anonymousId = uuidv4();
        KUtils.setJSON("koalaw_anonymous_id", anonymousId);
      }

      const resp = await fetch(`${API_BASE}/carts/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.message || "Failed to initialize cart");
      }
      const json = await resp.json();
      const id = json?.data?.cart?.id;
      if (!isUUID(id)) throw new Error("Failed to get valid cart id");
      KUtils.setJSON("koalaw_backend_cart_id", id);
      return id;
    }

    async function syncDeleteItemFromBackend(cartId, itemId) {
      try {
        await fetch(`${API_BASE}/carts/${cartId}/items/${itemId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      } catch (e) {
        console.warn("[CART] Failed to delete item from backend:", e);
      }
    }

    async function syncClearBackendCart(cartId) {
      try {
        await fetch(`${API_BASE}/carts/${cartId}/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      } catch (e) {
        console.warn("[CART] Failed to clear backend cart:", e);
      }
    }

    // Fetch related products from cart items
    async function fetchRelatedProducts(cart) {
      if (!cart.length) return [];

      const relatedMap = new Map();
      const cartProductIds = new Set(
        cart.map((item) => item.productId).filter(Boolean)
      );

      for (const item of cart) {
        if (!item.productId || !isUUID(item.productId)) continue;

        try {
          const resp = await fetch(`${API_BASE}/products/${item.productId}`);
          if (!resp.ok) continue;

          const data = await resp.json();
          const related = data?.data?.product?.related || [];

          related.forEach((rel) => {
            if (!cartProductIds.has(rel.id) && !relatedMap.has(rel.id)) {
              relatedMap.set(rel.id, {
                id: rel.id,
                productId: rel.id,
                title: rel.title,
                price: rel.price,
                image: rel.heroImageUrl || "/assets/images/product.png",
                slug: rel.slug,
                variant: "",
                variantId: null,
                currencyCode: rel.currencyCode || "IRR",
              });
            }
          });
        } catch (e) {
          console.warn("[CART] Failed to fetch related products:", e);
        }
      }

      return Array.from(relatedMap.values()).slice(0, 8);
    }
    // Helpers
    const toIRR = KUtils.toIRR;
    const toFa = KUtils.toFa;

    function loadCart() {
      const saved = KUtils.getJSON(CART_KEY);
      if (Array.isArray(saved)) return saved;
      KUtils.setJSON(CART_KEY, SAMPLE_ITEMS);
      return [...SAMPLE_ITEMS];
    }
    function saveCart(cart) {
      KUtils.setJSON(CART_KEY, cart);
    }

    function loadState() {
      const saved = KUtils.getJSON(STATE_KEY);
      if (saved) return saved;
      const init = {
        coupon: "",
        gift: false,
        express: false,
        note: "",
        shippingMethod: "standard",
        payMethod: "gateway",
      };
      KUtils.setJSON(STATE_KEY, init);
      return init;
    }
    function saveState(state) {
      KUtils.setJSON(STATE_KEY, state);
    }

    function loadAddress() {
      return KUtils.getJSON(ADDR_KEY, {
        firstname: "",
        lastname: "",
        phone: "",
        postal: "",
        province: "",
        city: "",
        line1: "",
      });
    }
    function saveAddress(addr) {
      KUtils.setJSON(ADDR_KEY, addr);
    }

    function computeTotals(cart, state) {
      const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
      let discount = 0,
        shipping = 0,
        gift = state.gift ? GIFT_WRAP_PRICE : 0;
      if (state.coupon) {
        const r = coupons[state.coupon.toUpperCase()];
        if (r && subtotal >= r.min) {
          if (r.type === "percent")
            discount = Math.floor(subtotal * (r.value / 100));
          else if (r.type === "shipping") shipping = 0;
        }
      }
      const postSubtotal = subtotal - discount;
      shipping = postSubtotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIPPING;
      if (state.express) shipping += EXPRESS_PRICE;
      const total = Math.max(0, postSubtotal + shipping + gift);
      return { subtotal, discount, shipping, gift, total };
    }

    // Router
    const routes = ["cart", "address", "payment"];
    function getRoute() {
      const h = location.hash.replace("#/", "").trim();
      return routes.includes(h) ? h : "cart";
    }
    function navigate(to) {
      location.hash = `#/${to}`;
    }

    // Hero meta
    const heroMap = {
      cart: {
        icon: "shopping-bag",
        badge: "سبد خرید",
        title: "سفارش خود را نهایی کنید",
        sub: "بررسی اقلام سبد، اعمال کد تخفیف و ادامه به پرداخت",
      },
      address: {
        icon: "map-pin",
        badge: "آدرس و ارسال",
        title: "نشانی و روش ارسال خود را انتخاب کنید",
        sub: "اطلاعات تحویل را وارد کنید و ادامه دهید",
      },
      payment: {
        icon: "credit-card",
        badge: "پرداخت",
        title: "پرداخت و ثبت سفارش",
        sub: "به درگاه بانکی امن هدایت می‌شوید",
      },
    };

    function updateHero(route) {
      const meta = heroMap[route];
      if (!meta) return;
      const badge = document.getElementById("hero-badge");
      const title = document.getElementById("hero-title");
      const sub = document.getElementById("hero-subtitle");
      const icon = document.getElementById("hero-icon");
      if (badge) badge.textContent = meta.badge;
      if (title) title.textContent = meta.title;
      if (sub) sub.textContent = meta.sub;
      if (icon) {
        icon.setAttribute("data-feather", meta.icon);
        icon.replaceWith(icon.cloneNode(false));
        KUtils.refreshIcons();
      }
    }

    function validateAddress(a) {
      return !!(
        a.firstname &&
        a.lastname &&
        a.phone &&
        a.province &&
        a.city &&
        a.line1
      );
    }

    function updateStepper(route, cart, addr) {
      const index = routes.indexOf(route);
      const sc = document.getElementById("step-cart");
      const sa = document.getElementById("step-address");
      const sp = document.getElementById("step-payment");
      [sc, sa, sp].forEach((s) => {
        if (!s) return;
        s.classList.remove("is-done", "is-current");
        s.removeAttribute("aria-disabled");
      });

      if (index === 0) sc?.classList.add("is-current");
      if (index === 1) {
        sc?.classList.add("is-done");
        sa?.classList.add("is-current");
      }
      if (index === 2) {
        sc?.classList.add("is-done");
        sa?.classList.add("is-done");
        sp?.classList.add("is-current");
      }

      const hasCart = cart.length > 0;
      const addrValid = validateAddress(addr);
      if (!hasCart) {
        sa?.setAttribute("aria-disabled", "true");
        sp?.setAttribute("aria-disabled", "true");
      } else if (!addrValid) sp?.setAttribute("aria-disabled", "true");

      const stepsWrap = document.querySelector(".checkout-steps");
      if (window.innerWidth < 640 && stepsWrap) {
        const current = stepsWrap.querySelector(".step.is-current");
        current?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }

    function renderCart() {
      const cart = loadCart();
      const state = loadState();

      // options
      const ex = document.getElementById("cart-express");
      const gw = document.getElementById("cart-gift-wrap");
      const note = document.getElementById("cart-note");
      const couponInput = document.getElementById("cart-coupon-code");
      const couponMsg = document.getElementById("cart-coupon-msg");
      ex && (ex.checked = !!state.express);
      gw && (gw.checked = !!state.gift);
      note && (note.value = state.note || "");
      couponInput && (couponInput.value = state.coupon || "");
      couponMsg &&
        (couponMsg.textContent = state.coupon
          ? coupons[state.coupon]?.msg || "کد اعمال‌شده."
          : "");

      const navCnt = document.getElementById("nav-cart-count");
      if (navCnt)
        navCnt.textContent = KUtils.toFa(cart.reduce((a, c) => a + c.qty, 0));

      const itemsWrap = document.getElementById("cart-items");
      const empty = document.getElementById("cart-empty");
      if (itemsWrap) itemsWrap.innerHTML = "";
      if (!cart.length) {
        empty?.classList.remove("hidden");
      } else {
        empty?.classList.add("hidden");
        cart.forEach((line) => {
          const row = document.createElement("div");
          row.className = "order-card";
          row.dataset.id = line.id;
          row.innerHTML = `
            <div class="flex gap-4 items-center">
              <div class="w-24 h-24 rounded-xl overflow-hidden bg-rose-50 flex-shrink-0">
                <img src="${line.image}" alt="${
                  line.title
                }" class="w-full h-full object-cover"/>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h4 class="font-bold text-gray-800 truncate">${
                      line.title
                    }</h4>
                    <div class="text-xs text-gray-500 mt-1">${
                      line.variant || "—"
                    }</div>
                    <div class="mt-2 inline-flex items-center gap-2 text-rose-700 text-sm font-bold">
                      <i data-feather="credit-card"></i>
                      <span>${toIRR(line.price)}</span>
                    </div>
                  </div>
                  <button class="remove text-rose-600 hover:text-rose-800 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 transition" title="حذف">
                    <i data-feather="trash-2"></i>
                  </button>
                </div>
                <div class="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div class="qty-box">
                    <button class="qty-btn minus" title="کاهش"><i data-feather="minus"></i></button>
                    <input class="qty-input" type="number" min="1" value="${
                      line.qty
                    }">
                    <button class="qty-btn plus" title="افزایش"><i data-feather="plus"></i></button>
                  </div>
                  <div class="text-sm text-gray-600">
                    مبلغ این آیتم:
                    <span class="font-extrabold text-gray-900" data-line-total>${toIRR(
                      line.price * line.qty
                    )}</span>
                  </div>
                </div>
              </div>
            </div>`;
          itemsWrap.appendChild(row);
        });
      }
      KUtils.refreshIcons();

      // handlers
      itemsWrap?.querySelectorAll(".qty-btn.plus").forEach((btn) =>
        btn.addEventListener("click", () => {
          const id = btn.closest("[data-id]").dataset.id;
          const i = cart.findIndex((x) => x.id === id);
          if (i > -1) {
            cart[i].qty++;
            saveCart(cart);
            renderCart();
          }
        })
      );
      itemsWrap?.querySelectorAll(".qty-btn.minus").forEach((btn) =>
        btn.addEventListener("click", () => {
          const id = btn.closest("[data-id]").dataset.id;
          const i = cart.findIndex((x) => x.id === id);
          if (i > -1) {
            cart[i].qty = Math.max(1, cart[i].qty - 1);
            saveCart(cart);
            renderCart();
          }
        })
      );
      itemsWrap?.querySelectorAll(".qty-input").forEach((inp) =>
        inp.addEventListener("input", () => {
          const row = inp.closest("[data-id]");
          const id = row.dataset.id;
          const i = cart.findIndex((x) => x.id === id);
          let v = parseInt(inp.value || "1", 10);
          if (isNaN(v) || v < 1) v = 1;
          if (i > -1) {
            cart[i].qty = v;
            saveCart(cart);
            row.querySelector("[data-line-total]").textContent = toIRR(
              cart[i].price * cart[i].qty
            );
            updateCartSummary();
          }
        })
      );
      itemsWrap?.querySelectorAll(".remove").forEach((btn) =>
        btn.addEventListener("click", async () => {
          const row = btn.closest("[data-id]");
          const lineId = row.dataset.id;
          const item = cart.find((x) => x.id === lineId);

          const newCart = cart.filter((x) => x.id !== lineId);
          saveCart(newCart);
          showToast("آیتم حذف شد", "trash-2");
          renderCart();

          // Sync with backend
          if (item && item.productId && isUUID(item.productId)) {
            try {
              const cartId = await getOrCreateBackendCartId();
              // Find the backend cart item by productId/variantId
              const cartResp = await fetch(`${CARTS_API}/${cartId}`, {
                credentials: "include",
              });
              if (cartResp.ok) {
                const cartData = await cartResp.json();
                const backendItem = cartData?.data?.cart?.items?.find(
                  (i) =>
                    i.productId === item.productId &&
                    (i.variantId || null) === (item.variantId || null)
                );
                if (backendItem?.id) {
                  await syncDeleteItemFromBackend(cartId, backendItem.id);
                }
              }
            } catch (e) {
              console.warn("[CART] Failed to sync delete with backend:", e);
            }
          }
        })
      );

      function updateCartSummary() {
        const s = loadState();
        const c = loadCart();
        const t = computeTotals(c, s);
        const subtotal = document.getElementById("cart-subtotal");
        const discount = document.getElementById("cart-discount");
        const shipping = document.getElementById("cart-shipping");
        const gift = document.getElementById("cart-gift");
        const grand = document.getElementById("cart-grand");
        subtotal && (subtotal.textContent = toIRR(t.subtotal));
        discount &&
          (discount.textContent =
            t.discount > 0 ? `- ${toIRR(t.discount)}` : "۰ تومان");
        shipping &&
          (shipping.textContent =
            t.shipping === 0 ? "رایگان" : toIRR(t.shipping));
        gift && (gift.textContent = s.gift ? toIRR(t.gift) : "۰ تومان");
        grand && (grand.textContent = toIRR(t.total));

        const current = Math.max(0, t.subtotal - t.discount);
        const progText = document.getElementById("cart-progress-text");
        const shipBadge = document.getElementById("cart-ship-badge");
        const progFill = document.getElementById("cart-progress-bar");
        if (current >= FREE_SHIP_THRESHOLD) {
          progText &&
            (progText.textContent =
              "تبریک! ارسال رایگان برای سفارش شما فعال شد.");
          if (shipBadge) {
            shipBadge.textContent = "ارسال رایگان";
            shipBadge.className = "text-xs px-3 py-1 rounded-full badge-free";
          }
          progFill && (progFill.style.width = "100%");
        } else {
          const remain = FREE_SHIP_THRESHOLD - current;
          progText &&
            (progText.textContent = `برای ارسال رایگان، هنوز ${toIRR(
              remain
            )} مانده است.`);
          if (shipBadge) {
            shipBadge.textContent = "فعال‌سازی ارسال رایگان";
            shipBadge.className = "text-xs px-3 py-1 rounded-full badge-warn";
          }
          const pct = Math.min(
            100,
            Math.round((current / FREE_SHIP_THRESHOLD) * 100)
          );
          progFill && (progFill.style.width = pct + "%");
        }
      }
      updateCartSummary();

      // Options
      ex &&
        (ex.onchange = (e) => {
          const s = loadState();
          s.express = e.target.checked;
          s.shippingMethod = s.express ? "express" : "standard";
          saveState(s);
          updateCartSummary();
        });
      gw &&
        (gw.onchange = (e) => {
          const s = loadState();
          s.gift = e.target.checked;
          saveState(s);
          updateCartSummary();
        });
      note &&
        (note.oninput = (e) => {
          const s = loadState();
          s.note = e.target.value;
          saveState(s);
        });

      // Coupon
      const applyBtn = document.getElementById("cart-apply-coupon");
      applyBtn &&
        (applyBtn.onclick = () => {
          const code = (couponInput?.value || "").trim().toUpperCase();
          const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
          if (!code) {
            const s = loadState();
            s.coupon = "";
            saveState(s);
            couponMsg.textContent = "";
            updateCartSummary();
            return;
          }
          const r = coupons[code];
          if (r) {
            if (subtotal < r.min) {
              couponMsg.textContent = `حداقل سبد برای این کد: ${toIRR(r.min)}`;
              couponMsg.className = "text-sm text-rose-700 mt-2";
            } else {
              const s = loadState();
              s.coupon = code;
              saveState(s);
              couponMsg.textContent = r.msg || "کد تخفیف اعمال شد.";
              couponMsg.className = "text-sm text-emerald-700 mt-2";
              showToast("کد تخفیف اعمال شد", "tag");
              updateCartSummary();
            }
          } else {
            couponMsg.textContent = "کد معتبر نیست.";
            couponMsg.className = "text-sm text-rose-700 mt-2";
          }
        });

      // Clear
      const clearBtn = document.getElementById("cart-clear");
      clearBtn &&
        (clearBtn.onclick = async () => {
          if (!cart.length) return;
          if (confirm("آیا از پاک کردن سبد خرید مطمئن هستید؟")) {
            saveCart([]);
            renderCart();

            // Sync with backend
            try {
              const cartId = await getOrCreateBackendCartId();
              await syncClearBackendCart(cartId);
            } catch (e) {
              console.warn("[CART] Failed to clear backend cart:", e);
            }
          }
        });

      // Recs
      // Fetch and render related products
      fetchRelatedProducts(cart).then((recommendations) => {
        const recWraps = document.querySelectorAll(
          "#cart-recommendations, #cart-recommendations-desktop"
        );

        if (recommendations.length === 0) {
          recWraps.forEach((wrap) => {
            const container = wrap.closest(".profile-card");
            if (container) container.style.display = "none";
          });
        } else {
          recWraps.forEach((recWrap) => {
            const container = recWrap.closest(".profile-card");
            if (container) container.style.display = "block";

            recWrap.innerHTML = "";
            recommendations.forEach((p) => {
              const d = document.createElement("button");
              d.className =
                "text-right p-3 rounded-xl border hover:border-rose-300 bg-white transition";
              d.innerHTML = `
          <div class="aspect-square rounded-lg overflow-hidden mb-2 bg-rose-50">
            <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover"/>
          </div>
          <div class="text-sm font-bold text-gray-800 truncate">${p.title}</div>
          <div class="text-xs text-gray-600 mt-1">${toIRR(p.price)}</div>
          <div class="mt-2 inline-flex items-center gap-1 text-rose-700 text-xs">
            <i data-feather="plus-circle"></i> افزودن
          </div>`;
              d.addEventListener("click", async () => {
                const c = loadCart();
                const i = c.findIndex((x) => x.productId === p.productId);
                if (i > -1) {
                  c[i].qty += 1;
                } else {
                  c.push({
                    id: p.id,
                    productId: p.productId,
                    variantId: p.variantId,
                    title: p.title,
                    price: p.price,
                    qty: 1,
                    image: p.image,
                    variant: p.variant || "",
                    currencyCode: p.currencyCode || "IRR",
                  });
                }
                saveCart(c);
                showToast("به سبد اضافه شد", "check-circle");

                try {
                  const cartId = await getOrCreateBackendCartId();
                  await fetch(`${API_BASE}/carts/${cartId}/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      productId: p.productId,
                      variantId: p.variantId || null,
                      quantity: 1,
                    }),
                  });
                } catch (e) {
                  console.warn("Failed to sync with backend:", e);
                }

                renderCart();
              });
              recWrap.appendChild(d);
            });
          });
        }
        KUtils.refreshIcons();
      });

      // Checkout button
      const goAddr = document.getElementById("cart-checkout-btn");
      goAddr &&
        (goAddr.onclick = () => {
          if (!loadCart().length) {
            showToast("سبد خرید خالی است", "alert-circle");
            navigate("cart");
            return;
          }
          navigate("address");
        });
    }

    // Replace the entire renderAddress() function (around line 450):

    async function renderAddress() {
      const cart = loadCart();
      if (!cart.length) {
        showToast("ابتدا محصولی به سبد اضافه کنید", "alert-triangle");
        navigate("cart");
        return;
      }

      let state = loadState();
      let addr = loadAddress();

      // Check if user is authenticated and fetch their data
      const isAuth = await isAuthenticated();
      let savedAddresses = [];

      if (isAuth) {
        const addresses = await fetchUserAddresses();
        savedAddresses = addresses || [];

        // If current addr is empty, pre-fill from saved addresses
        const isEmpty = !addr.firstname && !addr.lastname && !addr.phone;

        if (isEmpty && savedAddresses.length > 0) {
          // Find default address or use latest
          const defaultAddr =
            savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

          if (defaultAddr) {
            addr = {
              firstname: defaultAddr.firstName || "",
              lastname: defaultAddr.lastName || "",
              phone: defaultAddr.phone || "",
              postal: defaultAddr.postalCode || "",
              province: defaultAddr.province || "",
              city: defaultAddr.city || "",
              line1: defaultAddr.addressLine1 || "",
            };
            saveAddress(addr);
          }
        }
      }

      // Render saved addresses section
      const savedAddressesContainer = document.getElementById(
        "saved-addresses-container"
      );
      if (savedAddressesContainer) {
        if (isAuth && savedAddresses.length > 0) {
          savedAddressesContainer.classList.remove("hidden");
          const addressesList = document.getElementById("saved-addresses-list");
          addressesList.innerHTML = "";

          savedAddresses.forEach((address) => {
            const div = document.createElement("div");
            div.className = "saved-address-card";
            div.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              ${address.isDefault ? '<span class="inline-block px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full mb-2">پیش‌فرض</span>' : ""}
              ${address.label ? `<p class="font-bold text-gray-800 mb-1">${address.label}</p>` : ""}
              <p class="text-sm text-gray-700 mb-1">${address.firstName} ${address.lastName}</p>
              <p class="text-sm text-gray-600 mb-1">${address.phone}</p>
              <p class="text-sm text-gray-600">${address.province}، ${address.city}</p>
              <p class="text-sm text-gray-600">${address.addressLine1}</p>
              ${address.postalCode ? `<p class="text-xs text-gray-500 mt-1">کد پستی: ${toFa(address.postalCode)}</p>` : ""}
            </div>
            <button class="btn-secondary text-sm select-address-btn" data-address-id="${address.id}">
              <i data-feather="check"></i>
              انتخاب
            </button>
          </div>
        `;
            addressesList.appendChild(div);
          });

          KUtils.refreshIcons();

          // Add click handlers for select buttons
          addressesList
            .querySelectorAll(".select-address-btn")
            .forEach((btn) => {
              btn.addEventListener("click", () => {
                const addressId = btn.dataset.addressId;
                const selectedAddr = savedAddresses.find(
                  (a) => a.id === addressId
                );
                if (selectedAddr) {
                  selectSavedAddress(selectedAddr);
                }
              });
            });
        } else {
          savedAddressesContainer.classList.add("hidden");
        }
      }

      // Prefill + inputs
      const fields = [
        "firstname",
        "lastname",
        "phone",
        "postal",
        "province",
        "city",
        "line1",
      ];
      fields.forEach((k) => {
        const el = document.getElementById("addr-" + k);
        if (!el) return;
        el.value = addr[k] || "";
        el.addEventListener("input", () => {
          addr[k] = el.value.trim();
          saveAddress(addr);
          update();
        });
      });

      // Ship methods
      const std = document.getElementById("addr-ship-standard");
      const exp = document.getElementById("addr-ship-express");
      if (std && exp) {
        std.checked = !state.express;
        exp.checked = !!state.express;
        document.getElementById("addr-price-standard").textContent =
          KUtils.toIRR(45000);
        document.getElementById("addr-price-express").textContent =
          KUtils.toIRR(45000 + 30000);
        document.querySelectorAll('input[name="addr-ship"]').forEach((r) => {
          r.onchange = () => {
            state = loadState();
            state.express = r.value === "express";
            state.shippingMethod = state.express ? "express" : "standard";
            saveState(state);
            update();
          };
        });
      }

      function update() {
        const t = computeTotals(loadCart(), loadState());
        const set = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        set("addr-subtotal", KUtils.toIRR(t.subtotal));
        set(
          "addr-discount",
          t.discount > 0 ? `- ${KUtils.toIRR(t.discount)}` : "۰ تومان"
        );
        set(
          "addr-shipping",
          t.shipping === 0 ? "رایگان" : KUtils.toIRR(t.shipping)
        );
        set("addr-grand", KUtils.toIRR(t.total));
        const a = loadAddress();
        set(
          "addr-ship-to",
          a.firstname
            ? `${a.firstname} ${a.lastname} — ${a.phone}\n${a.province}، ${
                a.city
              }، ${a.line1} — کد پستی: ${a.postal || "—"}`
            : "—"
        );
        const navCnt = document.getElementById("nav-cart-count");
        if (navCnt)
          navCnt.textContent = KUtils.toFa(
            loadCart().reduce((x, y) => x + y.qty, 0)
          );
      }
      update();
      KUtils.refreshIcons();

      const next = document.getElementById("addr-to-payment");
      next &&
        (next.onclick = () => {
          addr = loadAddress();
          if (!validateAddress(addr)) {
            showToast("لطفاً اطلاعات آدرس را کامل کنید", "alert-circle");
            return;
          }
          navigate("payment");
        });
    }

    function renderPayment() {
      const cart = loadCart();
      if (!cart.length) {
        showToast("سبد خرید خالی است", "alert-circle");
        navigate("cart");
        return;
      }
      const addr = loadAddress();
      if (!validateAddress(addr)) {
        showToast("ابتدا آدرس را تکمیل کنید", "alert-triangle");
        navigate("address");
        return;
      }
      let state = loadState();

      function update() {
        const t = computeTotals(loadCart(), loadState());
        const set = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        set("pay-subtotal", KUtils.toIRR(t.subtotal));
        set(
          "pay-discount",
          t.discount > 0 ? `- ${KUtils.toIRR(t.discount)}` : "۰ تومان"
        );
        set(
          "pay-shipping",
          t.shipping === 0 ? "رایگان" : KUtils.toIRR(t.shipping)
        );
        set("pay-grand", KUtils.toIRR(t.total));
        const a = loadAddress();
        set(
          "pay-ship-to",
          `${a.firstname} ${a.lastname} — ${a.phone}\n${a.province}، ${
            a.city
          }، ${a.line1} — کد پستی: ${a.postal || "—"}`
        );
        const navCnt = document.getElementById("nav-cart-count");
        if (navCnt)
          navCnt.textContent = KUtils.toFa(
            loadCart().reduce((x, y) => x + y.qty, 0)
          );
      }
      update();

      const radios = Array.from(
        document.querySelectorAll('input[name="pay-method"]')
      );
      const savedMethod = state.payMethod || "gateway";
      const rSaved = radios.find((r) => r.value === savedMethod);
      if (rSaved) rSaved.checked = true;
      else radios[0] && (radios[0].checked = true);
      radios.forEach((r) =>
        r.addEventListener("change", () => {
          state = loadState();
          state.payMethod = r.value;
          KUtils.setJSON(STATE_KEY, state);
        })
      );

      const payBtn = document.getElementById("pay-now");
      let locking = false;

      // ==================== ZARINPAL INTEGRATION ====================

      /**
       * Sync local cart (if it contains real product IDs) to backend cart
       */
      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}$/i;
      const isUUID = (v) => UUID_RE.test(String(v || ""));
      async function syncLocalCartToBackend(backendCartId) {
        const local = loadCart();
        const syncable = local.filter((it) => isUUID(it.productId));
        if (!syncable.length) return;
        // Clear backend cart first to avoid duplicates
        await fetch(`${API_BASE}/carts/${backendCartId}/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
        for (const it of syncable) {
          try {
            await fetch(`${API_BASE}/carts/${backendCartId}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: it.productId,
                variantId: it.variantId || null,
                quantity: Number(it.qty || it.quantity || 1),
              }),
            });
          } catch (e) {
            console.warn("Failed to sync item to backend cart:", e);
          }
        }
      }

      /**
       * Create order via backend API and handle Zarinpal payment
       */

      async function processCheckout(paymentMethod) {
        const cart = loadCart();
        const addr = loadAddress();
        const state = loadState();

        // Ensure a real backend cart exists and use its UUID
        async function markCartAsConverted(cartId) {
          try {
            await fetch(`${CARTS_API}/${cartId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            });
            console.log("[CART] Cart marked as converted");
          } catch (e) {
            console.warn("[CART] Failed to mark cart as converted:", e);
          }
        }

        const cartId = await getOrCreateBackendCartId();
        await syncLocalCartToBackend(cartId);
        const checkoutPayload = {
          cartId: cartId,
          address: {
            firstName: addr.firstname,
            lastName: addr.lastname,
            phone: addr.phone,
            postalCode: addr.postal || "",
            province: addr.province,
            city: addr.city,
            addressLine1: addr.line1,
            addressLine2: "",
            country: "IR",
          },
          paymentMethod: paymentMethod, // "gateway" or "cod"
          shippingMethod: state.shippingMethod || "standard",
          couponCode: state.coupon || null,
          giftWrap: state.gift || false,
          note: state.note || null,
          returnUrl: window.location.origin + "/payment-return",
          cancelUrl: window.location.origin + "/cart",
          // Send ad-hoc lines so backend can create order even if server cart is empty
          lines: cart.map((it) => ({
            title: String(it.title || "").trim(),
            unitPrice: Number(it.price || 0),
            quantity: Number(it.qty || 1),
            imageUrl: it.image || undefined,
            currencyCode: it.currencyCode || "IRR",
            productId:
              it.productId && isUUID(it.productId) ? it.productId : undefined,
            variantId:
              it.variantId && isUUID(it.variantId) ? it.variantId : undefined,
            variantName: it.variant || undefined,
          })),
          // Compatibility aliases (controller will normalize to `lines`)

          items: undefined,
          cart: undefined,
        };

        try {
          const response = await fetch(`${API_BASE}/checkout/order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include", // ← Send auth cookies
            body: JSON.stringify(checkoutPayload),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "خطا در ثبت سفارش");
          }

          const result = await response.json();
          const { data } = result;

          // Save order info to localStorage
          KUtils.setJSON(LAST_ORDER_KEY, {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            status: data.status,
            amounts: data.amounts,
            payment: data.payment,
          });

          if (paymentMethod === "gateway") {
            // Redirect to Zarinpal payment gateway
            if (data.payment.approvalUrl) {
              showToast("در حال انتقال به درگاه پرداخت...", "credit-card");

              // Save payment info for verification after return
              KUtils.setJSON("koalaw_pending_payment", {
                orderId: data.orderId,
                paymentId: data.payment.id,
                authority: data.payment.authority,
                amount: data.amounts.total,
                cartId: checkoutPayload.cartId,
              });

              // Redirect to Zarinpal
              setTimeout(() => {
                window.location.href = data.payment.approvalUrl;
              }, 1000);
            } else {
              throw new Error("لینک پرداخت دریافت نشد");
            }
          } else if (paymentMethod === "cod") {
            // COD payment - order is placed, show success
            showToast("سفارش با موفقیت ثبت شد!", "check-circle");

            // Clear local cart
            saveCart([]);

            // Mark backend cart as converted
            try {
              await syncClearBackendCart(checkoutPayload.cartId);
            } catch (e) {
              console.warn("Failed to clear backend cart:", e);
            }
          }

          return data;
        } catch (error) {
          console.error("Checkout error:", error);
          throw error;
        }
      }

      payBtn &&
        (payBtn.onclick = async () => {
          if (locking) return;

          const method =
            document.querySelector('input[name="pay-method"]:checked')?.value ||
            "gateway";

          state = loadState();
          state.payMethod = method;
          KUtils.setJSON(STATE_KEY, state);

          locking = true;
          payBtn.dataset.orig = payBtn.innerHTML;
          payBtn.innerHTML = `<span class="inline-flex items-center gap-2"><span class="w-4 h-4 rounded-full border-2 border-white/40 border-l-white animate-spin"></span>${
            method === "gateway"
              ? "در حال انتقال به درگاه..."
              : "در حال ثبت سفارش..."
          }</span>`;
          payBtn.disabled = true;
          payBtn.classList.add("opacity-80", "cursor-not-allowed");

          try {
            await processCheckout(method);
          } catch (error) {
            // Reset button state on error
            payBtn.innerHTML = payBtn.dataset.orig || "پرداخت و ثبت سفارش";
            payBtn.disabled = false;
            payBtn.classList.remove("opacity-80", "cursor-not-allowed");
            locking = false;

            // Show error toast
            showToast(
              error.message || "خطا در پردازش سفارش. لطفاً دوباره تلاش کنید.",
              "alert-circle"
            );
          }
        });

      KUtils.refreshIcons();
    }

    function renderRoute() {
      const route = getRoute();
      const cart = loadCart();
      const addr = loadAddress();

      document
        .getElementById("view-cart")
        ?.classList.toggle("hidden", route !== "cart");
      document
        .getElementById("view-address")
        ?.classList.toggle("hidden", route !== "address");
      document
        .getElementById("view-payment")
        ?.classList.toggle("hidden", route !== "payment");

      updateHero(route);
      updateStepper(route, cart, addr);

      if (route === "cart") renderCart();
      if (route === "address") renderAddress();
      if (route === "payment") renderPayment();

      window.AOS && AOS.refresh();
    }

    // Protect stepper clicks
    ["step-cart", "step-address", "step-payment"].forEach((id) => {
      const el = document.getElementById(id);
      el &&
        el.addEventListener("click", (e) => {
          const to = el.id.replace("step-", "");
          const cart = loadCart();
          const addr = loadAddress();
          if (to === "address" && !cart.length) {
            e.preventDefault();
            showToast("ابتدا محصولی به سبد اضافه کنید", "alert-triangle");
          }
          if (to === "payment" && (!cart.length || !validateAddress(addr))) {
            e.preventDefault();
            showToast("آدرس را تکمیل کنید", "alert-triangle");
          }
        });
    });

    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  });
})();
