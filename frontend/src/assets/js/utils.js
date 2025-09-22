(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const raf = (fn) => requestAnimationFrame(fn);

  function toFa(n = 0) {
    try {
      return Number(n).toLocaleString("fa-IR");
    } catch {
      return n + "";
    }
  }
  function toIRR(n = 0) {
    const v = Math.max(0, Number(n) || 0);
    return `${v.toLocaleString("fa-IR")} تومان`;
  }

  function getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }
  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function throttle(fn, wait = 100) {
    let t = 0,
      lastArgs,
      lastThis;
    return function (...args) {
      lastArgs = args;
      lastThis = this;
      const now = Date.now();
      if (now - t >= wait) {
        t = now;
        fn.apply(lastThis, lastArgs);
      }
    };
  }
  function debounce(fn, delay = 200) {
    let id;
    return function (...args) {
      clearTimeout(id);
      id = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function refreshIcons() {
    try {
      window.feather && window.feather.replace();
    } catch {}
  }

  // Footer links generator (shared default)
  // Footer links generator (shared default)
  const DEFAULT_FOOTER_LINKS = {
    فروشگاه: [
      { label: "تازه‌ها", href: "/shop?sort=new" },
      { label: "پرفروش‌ترین‌ها", href: "/shop?sort=popular" },
      { label: "مراقبت از پوست", href: "/shop?category=skincare" },
      { label: "آرایش", href: "/shop?category=makeup" },
      { label: "عطر", href: "/shop?category=fragrance" },
      { label: "ست‌های هدیه", href: "/shop?category=gift-sets" },
    ],
    "خدمات مشتریان": [
      { label: "تماس با ما", href: "/about#contact" },
      { label: "سوالات متداول", href: "/about#contact" },
      { label: "مرجوعی", href: "/tos#s8" },
      { label: "پیگیری سفارش", href: "/about#contact" },
    ],
  };

  function buildFooterLinks(
    containerId = "footer-links",
    data = DEFAULT_FOOTER_LINKS
  ) {
    const wrap = $("#" + containerId);
    if (!wrap) return;

    // Normalize: support both object map and array of sections
    const sections = Array.isArray(data)
      ? data
      : Object.entries(data).map(([title, items = []]) => ({
          title,
          items: items.map((i) =>
            typeof i === "string" ? { label: i, href: "#" } : i
          ),
        }));

    const html = sections
      .map(({ title, items = [] }) => {
        const list = items
          .map(({ label = "", href = "#", target, rel }) => {
            const isExternal = /^https?:\/\//i.test(href);
            const t = target ? ` target="${target}"` : "";
            const r = rel
              ? ` rel="${rel}"`
              : isExternal
              ? ` rel="noopener noreferrer"`
              : "";
            return `<li><a href="${href}"${t}${r} class="text-gray-400 hover:text-white transition duration-300">${label}</a></li>`;
          })
          .join("");
        return `<div><h4 class="font-semibold text-lg mb-6">${title}</h4><ul class="space-y-3">${list}</ul></div>`;
      })
      .join("");

    wrap.innerHTML = html;
    refreshIcons();
  }

  // Background: clouds and particles (used in multiple pages)
  function createClouds(rootSel = ".cloud-animation", count = 6) {
    const root = $(rootSel);
    if (!root) return;
    if (root.dataset.built === "1") return; // avoid duplicates
    for (let i = 1; i <= count; i++) {
      const c = document.createElement("div");
      c.className = `cloud cloud-${i}`;
      root.appendChild(c);
    }
    root.dataset.built = "1";
  }
  function createParticles(rootSel = ".particle-overlay", count = 9) {
    const root = $(rootSel);
    if (!root) return;
    if (root.dataset.built === "1") return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = 10 + 10 * i + "%";
      p.style.animationDuration = 25 + 10 * Math.random() + "s";
      p.style.animationDelay = 15 * Math.random() + "s";
      root.appendChild(p);
    }
    root.dataset.built = "1";
  }

  window.KUtils = {
    $,
    $$,
    on,
    raf,
    toFa,
    toIRR,
    getJSON,
    setJSON,
    throttle,
    debounce,
    refreshIcons,
    buildFooterLinks,
    createClouds,
    createParticles,
    DEFAULT_FOOTER_LINKS,
  };
})();