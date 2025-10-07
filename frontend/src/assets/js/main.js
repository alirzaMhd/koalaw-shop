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
  const productGrid = document.getElementById("product-grid");
  if (productGrid) {
    productGrid.innerHTML = "";
    const items = [
      {
        d: "100",
        c: "skincare bestseller",
        t: "اکسیر درخشش طلایی",
        p: 480000,
        r: 4.8,
      },
      { d: "200", c: "makeup", t: "بوسه مخملی مات", p: 320000, r: 4.5 },
      { d: "300", c: "makeup", t: "پایه ابریشمی بی‌نقص", p: 420000, r: 4.9 },
      {
        d: "400",
        c: "fragrance bestseller",
        t: "راز نیمه‌شب",
        p: 780000,
        r: 4.7,
      },
    ];
    items.forEach((p) => {
      const primary = p.c.split(" ")[0];
      const icon =
        { skincare: "shield", makeup: "pen-tool", fragrance: "wind" }[
        primary
        ] || "gift";
      const stars =
        '<i data-feather="star" class="w-4 h-4 fill-current"></i>'.repeat(
          Math.floor(p.r)
        );
      productGrid.innerHTML += `
        <a href="#" class="product-card-v3 break-inside-avoid category-${primary}" data-aos="fade-up" data-aos-delay="${p.d
        }" data-category="${p.c}">
          <div class="card-bg"></div>
          <div class="card-blob">
            <svg viewBox="0 0 200 200"><path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z" transform="translate(100 100)"></path></svg>
          </div>
          <div class="card-image-wrapper">
            <img src="/assets/images/product.png" alt="${p.t
        }" class="card-image">
          </div>
          <div class="card-content">
            <div class="card-category"><i data-feather="${icon}" class="w-3 h-3"></i><span>${primary}</span></div>
            <h3 class="card-title">${p.t}</h3>
            <div class="card-rating">${stars}<span>${p.r.toLocaleString(
          "fa-IR",
          { minimumFractionDigits: 1, maximumFractionDigits: 1 }
        )}</span></div>
            <p class="card-price">${KUtils.toIRR(p.p)}</p>
          </div>
        </a>
      `;
    });
    KUtils.refreshIcons();
  }

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
        <div class="testimonial-card w-80 sm:w-96 lg:w-auto flex-shrink-0 snap-start" data-aos="fade-up" data-aos-delay="${t.d
        }">
          <div class="flex mb-6"><div class="flex text-yellow-400">${'<i data-feather="star" class="w-5 h-5 fill-current"></i>'.repeat(
          5
        )}</div></div>
          <p class="text-gray-600 mb-8 italic leading-relaxed">${t.t}</p>
          <div class="flex items-center">
            <img src="/assets/images/profile.png" alt="مشتری" class="w-14 h-14 rounded-full object-cover ml-4">
            <div><h4 class="font-semibold text-gray-800">${t.n
        }</h4><p class="text-sm text-gray-500">${t.s}</p></div>
          </div>
        </div>`;
    });
    KUtils.refreshIcons();
  }

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
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items=end p-4">
            <div class="text-white"><i data-feather="heart" class="w-5 h-5 mb-1"></i><p class="text-sm">${p.l} هزار لایک</p></div>
          </div>
        </div>`;
    });
    KUtils.refreshIcons();
  }
});
