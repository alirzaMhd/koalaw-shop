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

    const SAMPLE_ITEMS = [
      {
        id: "p-100",
        title: "اکسیر درخشش طلایی",
        price: 480000,
        qty: 1,
        image: "/assets/images/product.png",
        variant: "30ml",
      },
      {
        id: "p-200",
        title: "رژ لب بوسه مخملی",
        price: 320000,
        qty: 2,
        image: "/assets/images/cosmetic.png",
        variant: "Shade 03",
      },
    ];

    const RECS = [
      {
        id: "r-1",
        title: "سرم هیالورونیک",
        price: 290000,
        image: "/assets/images/skin.png",
      },
      {
        id: "r-2",
        title: "عطر راز نیمه‌شب",
        price: 780000,
        image: "/assets/images/perfume.png",
      },
      {
        id: "r-3",
        title: "ماسک مو تغذیه‌کننده",
        price: 350000,
        image: "/assets/images/hair.png",
      },
      {
        id: "r-4",
        title: "رژ گونه لطیف",
        price: 260000,
        image: "/assets/images/cosmetic.png",
      },
    ];

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
        btn.addEventListener("click", () => {
          const id = btn.closest("[data-id]").dataset.id;
          const newCart = cart.filter((x) => x.id !== id);
          saveCart(newCart);
          showToast("آیتم حذف شد", "trash-2");
          renderCart();
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
        (clearBtn.onclick = () => {
          if (!cart.length) return;
          if (confirm("آیا از پاک کردن سبد خرید مطمئن هستید؟")) {
            saveCart([]);
            renderCart();
          }
        });

      // Recs
      const recWraps = document.querySelectorAll(
        "#cart-recommendations, #cart-recommendations-desktop"
      );
      recWraps.forEach((recWrap) => {
        recWrap.innerHTML = "";
        RECS.forEach((p) => {
          const d = document.createElement("button");
          d.className =
            "text-right p-3 rounded-xl border hover:border-rose-300 bg-white transition";
          d.innerHTML = `
            <div class="aspect-square rounded-lg overflow-hidden mb-2 bg-rose-50">
              <img src="${p.image}" alt="${
                p.title
              }" class="w-full h-full object-cover"/>
            </div>
            <div class="text-sm font-bold text-gray-800 truncate">${
              p.title
            }</div>
            <div class="text-xs text-gray-600 mt-1">${toIRR(p.price)}</div>
            <div class="mt-2 inline-flex items-center gap-1 text-rose-700 text-xs">
              <i data-feather="plus-circle"></i> افزودن
            </div>`;
          d.addEventListener("click", () => {
            const c = loadCart();
            const i = c.findIndex((x) => x.id === p.id);
            if (i > -1) c[i].qty += 1;
            else
              c.push({
                id: p.id,
                title: p.title,
                price: p.price,
                qty: 1,
                image: p.image,
                variant: "",
              });
            saveCart(c);
            showToast("به سبد اضافه شد", "check-circle");
            renderCart();
          });
          recWrap.appendChild(d);
        });
      });
      KUtils.refreshIcons();

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

    function renderAddress() {
      const cart = loadCart();
      if (!cart.length) {
        showToast("ابتدا محصولی به سبد اضافه کنید", "alert-triangle");
        navigate("cart");
        return;
      }

      let state = loadState();
      let addr = loadAddress();

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
       * Create order via backend API and handle Zarinpal payment
       */
      async function processCheckout(paymentMethod) {
        const cart = loadCart();
        const addr = loadAddress();
        const state = loadState();

        // TODO: Replace this with your actual backend cart ID
        // For now, we'll use a dummy cart ID - you need to create a cart via your backend first
        const cartId =
          KUtils.getJSON("koalaw_backend_cart_id") || "dummy-cart-id";

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
          returnUrl: window.location.origin + "/payment-return.html",
          cancelUrl: window.location.origin + "/cart",
        };

        try {
          const response = await fetch(`${API_BASE}/checkout/order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Add auth token if you have user authentication
              // "Authorization": `Bearer ${KUtils.getItem("auth_token")}`,
            },
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

            // Clear cart
            saveCart([]);

            // Redirect to success page or order detail
            setTimeout(() => {
              window.location.href = `/order-success.html?orderId=${data.orderId}`;
            }, 1500);
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
