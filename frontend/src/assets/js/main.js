// src/assets/js/main.js
document.addEventListener("DOMContentLoaded", async () => {
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
  if (window.KUtils && KUtils.refreshIcons) KUtils.refreshIcons();

  // Footer links
  if (window.KUtils && KUtils.buildFooterLinks) KUtils.buildFooterLinks();

  // Clouds + Particles (if present)
  if (window.KUtils && KUtils.createClouds) {
    KUtils.createClouds(".cloud-animation", window.innerWidth < 768 ? 6 : 10);
  }
  if (window.KUtils && KUtils.createParticles) {
    KUtils.createParticles(
      ".particle-overlay",
      window.innerWidth < 768 ? 4 : 9
    );
  }

  // Back-to-top (shared id)
  const btt = document.getElementById("backToTop");
  if (btt) {
    window.addEventListener(
      "scroll",
      window.KUtils && KUtils.throttle
        ? KUtils.throttle(() => {
            const y = window.pageYOffset || 0;
            btt.style.opacity = y > 500 ? "1" : "0";
            btt.style.visibility = y > 500 ? "visible" : "hidden";
          }, 100)
        : () => {
            const y = window.pageYOffset || 0;
            btt.style.opacity = y > 500 ? "1" : "0";
            btt.style.visibility = y > 500 ? "visible" : "hidden";
          }
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

  // ----------------------- Helpers -----------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const api = {
    async getJSON(url) {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
      return res.json();
    },
    filters() {
      return this.getJSON("/api/products/filters");
    },
    products(params = {}) {
      const sp = new URLSearchParams();
      const defaults = { page: "1" };
      Object.entries({ ...defaults, ...params }).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
        else if (v !== undefined && v !== null && v !== "") sp.set(k, v);
      });
      const qs = sp.toString();
      return this.getJSON(`/api/products${qs ? "?" + qs : ""}`);
    },
    productBySlug(slug) {
      return this.getJSON(`/api/products/slug/${encodeURIComponent(slug)}`);
    },
    magazinePosts(params = {}) {
      const sp = new URLSearchParams({
        onlyPublished: "true",
        page: "1",
        pageSize: "3",
        ...params,
      });
      return this.getJSON(`/api/magazine/posts?${sp.toString()}`);
    },
  };

  const iconForCategory = (slug) =>
    ({
      skincare: "shield",
      makeup: "pen-tool",
      fragrance: "wind",
      haircare: "git-branch",
      "body-bath": "droplet",
    })[String(slug || "").toLowerCase()] || "box";

  const imageForCategory = (slug) =>
    ({
      skincare: "/assets/images/skin.png",
      makeup: "/assets/images/cosmetic.png",
      fragrance: "/assets/images/perfume.png",
      haircare: "/assets/images/hair.png",
      "body-bath": "/assets/images/body.png",
    })[String(slug || "").toLowerCase()] || "/assets/images/product.png";

  const persianCategoryTitle = (slug, fallback) =>
    ({
      skincare: "مراقبت از پوست",
      makeup: "آرایش",
      fragrance: "عطر",
      haircare: "مراقبت از مو",
      "body-bath": "بدن و حمام",
    })[String(slug || "").toLowerCase()] ||
    fallback ||
    slug;

  const toIRR = (v) =>
    window.KUtils && KUtils.toIRR
      ? KUtils.toIRR(v)
      : new Intl.NumberFormat("fa-IR").format(Number(v || 0)) + " تومان";

  const formatDateFa = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR");
    } catch {
      return "";
    }
  };

  const refreshAOSAndIcons = () => {
    if (window.KUtils && KUtils.refreshIcons) KUtils.refreshIcons();
    if (window.AOS && AOS.refreshHard) AOS.refreshHard();
  };

  // ----------------------- 1) Hero CTA: "کالکشن را کاوش کنید" -> /shop -----------------------
  const heroExploreBtn = $("section.min-h-screen button.magnetic-btn");
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", () => {
      window.location.href = "/shop";
    });
  }

  // ----------------------- 7) "کاوش کامل کالکشن" -> /shop?bestseller=1 -----------------------
  const bestsellersSection = $(".bestsellers-section");
  if (bestsellersSection) {
    const allLinks = $$("a", bestsellersSection);
    const viewAllCta =
      allLinks.find((a) =>
        (a.textContent || "").includes("کاوش کامل کالکشن")
      ) || null;
    if (viewAllCta) viewAllCta.setAttribute("href", "/shop?bestseller=1");
  }

  // ----------------------- Load Filters (categories, brands, collections) -----------------------
  let filters;
  try {
    filters = await api.filters();
  } catch (e) {
    console.error("Failed to load filters", e);
  }

  // ----------------------- 3) Category cards from DB -----------------------
  // Replace the hard-coded cards inside: .category-scroll-container > .flex.flex-nowrap
  const catStrip =
    $(".category-scroll-container .flex.flex-nowrap") ||
    $(".category-scroll-container .flex");
  if (filters?.categories && catStrip) {
    catStrip.innerHTML = "";
    (filters.categories || []).forEach((c) => {
      const slug = c.slug || c.value || c.id || "";
      const label =
        c.label || c.name || persianCategoryTitle(slug, "دسته‌بندی");
      catStrip.innerHTML += `
        <a href="/shop?category=${encodeURIComponent(
          slug
        )}" class="category-card w-52 md:w-64 flex-shrink-0">
          <img src="${imageForCategory(slug)}" alt="${label}" class="category-card-bg" />
          <div class="category-card-overlay"></div>
          <div class="category-card-content">
            <div class="category-card-icon"><i data-feather="${iconForCategory(
              slug
            )}" class="w-6 h-6"></i></div>
            <h3 class="category-card-title">${label}</h3>
          </div>
        </a>
      `;
    });
    refreshAOSAndIcons();
  }

  // ----------------------- 4) Brand cards from DB -----------------------
  const brandsMarquee = $(".brands-marquee");
  if (filters?.brands && brandsMarquee) {
    brandsMarquee.innerHTML = "";
    (filters.brands || []).forEach((b) => {
      const name = b.name || "";
      const slug = b.slug || "";
      brandsMarquee.innerHTML += `
        <a href="/shop?brand=${encodeURIComponent(slug)}" class="brand-item">
          <div class="brand-logo"><i data-feather="star"></i></div>
          <span class="brand-name">${name}</span>
        </a>
      `;
    });
    refreshAOSAndIcons();
  }

  // ----------------------- 2) Collections cards from DB -> link to their product page -----------------------
  // We'll use up to 3 collections that have count>0; for each, load 1 product and fill the card.
  const collectionCards = $$("#collections .collection-card-link");
  if (filters?.collections && collectionCards.length) {
    const activeCollections = (filters.collections || [])
      .filter((c) => (c.count || 0) > 0)
      .slice(0, collectionCards.length);

    async function loadOneProductForCollection(collectionId) {
      // prefer featured
      let list = await api.products({
        collectionIds: String(collectionId),
        includeImages: "true",
        perPage: "1",
        page: "1",
        featuredOnly: "true",
        activeOnly: "true",
      });
      if (!list?.items?.length) {
        list = await api.products({
          collectionIds: String(collectionId),
          includeImages: "true",
          perPage: "1",
          page: "1",
          activeOnly: "true",
        });
      }
      return list?.items?.[0];
    }

    try {
      await Promise.all(
        activeCollections.map(async (col, idx) => {
          const card = collectionCards[idx];
          if (!card) return;

          const p = await loadOneProductForCollection(col.id);
          if (!p) return;

          const imgUrl =
            p.imageUrl ||
            (p.images && p.images[0] && p.images[0].url) ||
            p.heroImageUrl ||
            "/assets/images/product.png";

          // Elements inside card
          const titleEl = $(".collection-title", card);
          const catEl = $(".collection-category", card);
          const imgEl = $(".collection-product-image", card);
          const descEl = $(".collection-desc", card);

          // Link to product page
          card.setAttribute("href", `/product/${encodeURIComponent(p.slug)}`);

          // Fill content
          if (titleEl) titleEl.textContent = p.title || col.name || "کالکشن";
          const catSlug = (p.category || "").toString().toLowerCase();
          if (catEl)
            catEl.textContent = persianCategoryTitle(catSlug, "زیبایی");
          if (imgEl) imgEl.setAttribute("src", imgUrl);
          if (descEl)
            descEl.textContent =
              p.subtitle ||
              p.description ||
              "محصولات منتخب این کالکشن را ببینید.";
        })
      );
      refreshAOSAndIcons();
    } catch (e) {
      console.error("Failed to render collections", e);
    }
  }

  // ----------------------- 5) Product cards from DB + 6) Filters work -----------------------
  const productGrid = document.getElementById("product-grid");

  async function renderProducts({ filter = "bestseller", category } = {}) {
    if (!productGrid) return;

    // skeletons
    productGrid.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      productGrid.innerHTML += `
        <div class="product-card-v3 break-inside-avoid animate-pulse opacity-60">
          <div class="card-bg"></div>
          <div class="card-blob">
            <svg viewBox="0 0 200 200"><path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z" transform="translate(100 100)"></path></svg>
          </div>
          <div class="card-image-wrapper"><div class="w-full h-40 bg-gray-200 rounded-2xl"></div></div>
          <div class="card-content"><div class="h-4 bg-gray-200 rounded w-1/2 my-2"></div><div class="h-4 bg-gray-200 rounded w-1/3"></div></div>
        </div>
      `;
    }

    let query = {
      page: "1",
      perPage: "12",
      includeImages: "true",
      activeOnly: "true",
    };

    const f = (category || filter || "all").toString().toLowerCase();
    if (f === "bestseller") {
      query = { ...query, bestsellerOnly: "true" };
    } else if (f !== "all") {
      query = { ...query, categories: f };
    }

    try {
      const data = await api.products(query);
      const items = data?.items || [];
      productGrid.innerHTML = "";

      items.forEach((p, i) => {
        const primary = (p.category || "gift").toString().toLowerCase();
        const icon = iconForCategory(primary);
        const img =
          p.imageUrl ||
          (p.images && p.images[0] && p.images[0].url) ||
          p.heroImageUrl ||
          "/assets/images/product.png";
        const rating = Number(p.ratingAvg || p.rating || 0);
        const fullStars = Math.max(0, Math.floor(rating));
        const stars =
          '<i data-feather="star" class="w-4 h-4 fill-current"></i>'.repeat(
            fullStars
          );

        productGrid.innerHTML += `
          <a href="/product/${encodeURIComponent(
            p.slug
          )}" class="product-card-v3 break-inside-avoid category-${primary}" data-aos="fade-up" data-aos-delay="${(i + 1) * 60}">
            <div class="card-bg"></div>
            <div class="card-blob">
              <svg viewBox="0 0 200 200"><path d="M48.1,-58.9C62.2,-51.9,73.4,-37.2,77,-21.2C80.6,-5.2,76.5,12.2,68.4,26.1C60.3,40,48.2,50.4,34.5,58.3C20.8,66.2,5.5,71.6,-9.3,71.1C-24.1,70.7,-38.4,64.4,-50.9,54.7C-63.4,44.9,-74,31.7,-77.8,16.5C-81.6,1.2,-78.6,-16,-69.8,-29.3C-61,-42.6,-46.4,-52,-32.1,-59.5C-17.8,-67,-3.9,-72.6,9.6,-71.7C23.1,-70.8,48.1,-58.9,48.1,-58.9Z" transform="translate(100 100)"></path></svg>
            </div>
            <div class="card-image-wrapper">
              <img src="${img}" alt="${p.title || ""}" class="card-image">
            </div>
            <div class="card-content">
              <div class="card-category"><i data-feather="${icon}" class="w-3 h-3"></i><span>${primary}</span></div>
              <h3 class="card-title">${p.title || ""}</h3>
              <div class="card-rating">${stars}<span>${rating.toLocaleString(
                "fa-IR",
                {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }
              )}</span></div>
              <p class="card-price">${toIRR(p.price || 0)}</p>
            </div>
          </a>
        `;
      });

      refreshAOSAndIcons();
    } catch (e) {
      console.error("Failed to load products", e);
      productGrid.innerHTML = `<p class="text-center text-gray-500">خطا در بارگذاری محصولات</p>`;
    }
  }

  // Initial load -> bestsellers to match "پرفروش‌ها"
  await renderProducts({ filter: "bestseller" });
  // Set active filter button to bestseller
  const filterBtns = $$(".filter-btn", bestsellersSection || document);
  if (filterBtns.length) {
    filterBtns.forEach((b) =>
      b.classList.toggle(
        "active",
        (b.getAttribute("data-filter") || "") === "bestseller"
      )
    );
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const f = btn.getAttribute("data-filter") || "all";
        await renderProducts({ filter: f });
      });
    });
  }

  // ----------------------- 8) Campaign section from backend -----------------------
  async function renderCampaign() {
    const campaignSection = $(".campaign-section");
    if (!campaignSection) return;

    const header = $(".text-center", campaignSection);
    const badgeEl = header ? $("span", header) : null;
    const titleEl = header ? $("h2", header) : null;
    const descEl = header ? $("p", header) : null;

    const featuredCard = $(".campaign-featured-card", campaignSection);
    // Side list column (the flex of side cards)
    const sideList = $(".campaign-section .flex.flex-col.gap-8");

    try {
      const list = await api.products({
        specialOnly: "true",
        includeImages: "true",
        perPage: "4",
        page: "1",
        activeOnly: "true",
      });
      const items = list?.items || [];
      if (!items.length) return;

      const featured = items[0];
      // Load full detail to get badges, collection name, description
      let detail = null;
      try {
        detail = await api.productBySlug(featured.slug);
      } catch {}

      // Top texts
      if (badgeEl) {
        const badgeText =
          (detail?.badges && detail.badges[0] && detail.badges[0].title) ||
          "نسخه محدود";
        badgeEl.textContent = badgeText;
      }
      if (titleEl) {
        const coll = detail?.collection?.name;
        titleEl.textContent = coll ? `کالکشن ${coll}` : "کالکشن ویژه";
      }
      if (descEl) {
        descEl.textContent =
          detail?.subtitle ||
          detail?.description ||
          "محصولات ویژه را از دست ندهید.";
      }

      // Featured card content
      if (featuredCard) {
        const img =
          (featured.images && featured.images[0]?.url) ||
          featured.heroImageUrl ||
          "/assets/images/product.png";
        const h3 = $("h3", featuredCard);
        const p = $("p", featuredCard);
        const imgEl = $(".campaign-featured-image", featuredCard);
        const badgeCuteText = $(".badge-cute span:last-child", featuredCard);

        if (imgEl) imgEl.setAttribute("src", img);
        if (h3) h3.textContent = detail?.title || featured.title || "";
        if (p)
          p.textContent =
            detail?.subtitle ||
            (detail?.description
              ? String(detail.description).slice(0, 120) + "..."
              : "");
        if (badgeCuteText) {
          badgeCuteText.textContent =
            (detail?.badges && detail.badges[0]?.title) || "جدید و انحصاری";
        }
        featuredCard.setAttribute(
          "href",
          `/product/${encodeURIComponent(featured.slug)}`
        );
      }

      // Side cards
      if (sideList) {
        sideList.innerHTML = "";
        items.slice(1).forEach((p) => {
          const img =
            (p.images && p.images[0]?.url) ||
            p.heroImageUrl ||
            "/assets/images/product.png";
          sideList.innerHTML += `
            <a href="/product/${encodeURIComponent(
              p.slug
            )}" class="campaign-side-card group">
              <img src="${img}" alt="${p.title || ""}" class="campaign-side-image" />
              <div class="campaign-side-content">
                <h4 class="font-bold text-lg text-gray-800">${p.title || ""}</h4>
                <p class="text-sm text-gray-500 mb-3">${p.subtitle || ""}</p>
                <span class="font-semibold text-rose-700">${toIRR(p.price || 0)}</span>
              </div>
              <div class="campaign-side-arrow">
                <i data-feather="chevron-left"></i>
              </div>
            </a>
          `;
        });
      }

      refreshAOSAndIcons();
    } catch (e) {
      console.error("Failed to render campaign", e);
    }
  }
  await renderCampaign();

  // ----------------------- 9) Magazine article cards from backend -----------------------
  async function renderMagazine() {
    const scroller = document.getElementById("magazine-scroller");
    if (!scroller) return;

    try {
      const { items } = await api.magazinePosts();
      scroller.innerHTML = "";

      const faCat = (c) =>
        ({
          GUIDE: "راهنما",
          TUTORIAL: "آموزش",
          TRENDS: "ترندها",
          LIFESTYLE: "لایف‌استایل",
          GENERAL: "عمومی",
        })[String(c || "").toUpperCase()] || "مجله";

      (items || []).forEach((post) => {
        const href = `/magazine/${encodeURIComponent(post.slug)}`;
        const img =
          post.heroImageUrl ||
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1640&auto=format&fit=crop";
        const read = post.readTimeMinutes
          ? `${post.readTimeMinutes.toLocaleString("fa-IR")} دقیقه`
          : "";
        const dateFa = post.publishedAt ? formatDateFa(post.publishedAt) : "";

        scroller.innerHTML += `
          <a href="${href}" class="group relative block h-72 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 w-72 sm:w-80 md:w-96 lg:w-auto flex-shrink-0 snap-start">
            <img src="${img}" alt="${post.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div class="relative z-10 p-6 h-full flex flex-col justify-end text-white">
              <div class="flex items-center gap-2 text-sm text-rose-200">
                <i data-feather="tag" class="w-4 h-4"></i><span>${faCat(post.category)}</span>
              </div>
              <h3 class="mt-2 text-xl font-bold leading-8">${post.title}</h3>
              <div class="mt-3 flex items-center gap-4 text-sm text-rose-100/90">
                <span class="inline-flex items-center gap-1"><i data-feather="clock" class="w-4 h-4"></i>${read}</span>
                <span>${dateFa}</span>
              </div>
              <div class="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                <span>ادامه مطلب</span><i data-feather="arrow-left" class="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"></i>
              </div>
            </div>
          </a>
        `;
      });

      refreshAOSAndIcons();
    } catch (e) {
      console.error("Failed to load magazine posts", e);
    }
  }
  await renderMagazine();

  // ----------------------- Existing static sections (testimonials, instagram) -----------------------
  const tGrid = document.getElementById("testimonial-grid");
  if (tGrid) {
    [
      {
        d: 100,
        i: "1438761681033-6461ffad8d80",
        t: "«اکسیر درخشش طلایی پوست من را کاملاً متحول کرده...»",
        n: "سوفیا چن",
        s: "خریدار تایید شده • ۳ ماه پیش",
      },
      {
        d: 200,
        i: "1494790108377-be9c29b29330",
        t: "«به عنوان یک میکاپ آرتیست... کرم پودر کوالا یک تغییر بزرگ است.»",
        n: "اِما رودریگز",
        s: "میکاپ آرتیست حرفه‌ای • ۱ ماه پیش",
      },
      {
        d: 300,
        i: "1507003211169-0a1dd7228f2d",
        t: "«عطر راز نیمه‌شب حالا عطر امضای من است...»",
        n: "مایکل پارک",
        s: "مشتری وفادار • ۲ هفته پیش",
      },
    ].forEach((t) => {
      tGrid.innerHTML += `
        <div class="testimonial-card w-80 sm:w-96 lg:w-auto flex-shrink-0 snap-start" data-aos="fade-up" data-aos-delay="${t.d}">
          <div class="flex mb-6"><div class="flex text-yellow-400">${'<i data-feather="star" class="w-5 h-5 fill-current"></i>'.repeat(
            5
          )}</div></div>
          <p class="text-gray-600 mb-8 italic leading-relaxed">${t.t}</p>
          <div class="flex items-center">
            <img src="https://images.unsplash.com/photo-${t.i}?w=100&h=100&fit=crop" alt="مشتری" class="w-14 h-14 rounded-full object-cover ml-4">
            <div><h4 class="font-semibold text-gray-800">${t.n}</h4><p class="text-sm text-gray-500">${t.s}</p></div>
          </div>
        </div>`;
    });
    if (window.KUtils && KUtils.refreshIcons) KUtils.refreshIcons();
  }

  const ig = document.getElementById("instagram-grid");
  if (ig) {
    [
      { i: "1522335789203-aabd1fc54bc9", l: "۲.۳" },
      { i: "1512207736890-6ffca8dad650", l: "۳.۱" },
      { i: "1516975080664-ed2fc6a32937", l: "۱.۸" },
      { i: "1519699047748-de8e457a634e", l: "۴.۲" },
    ].forEach((p) => {
      ig.innerHTML += `
        <div class="relative group overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-${p.i}?w=400&h=400&fit=crop" alt="اینستاگرام" class="W-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items=end p-4">
            <div class="text-white"><i data-feather="heart" class="w-5 h-5 mb-1"></i><p class="text-sm">${p.l} هزار لایک</p></div>
          </div>
        </div>`;
    });
    if (window.KUtils && KUtils.refreshIcons) KUtils.refreshIcons();
  }
});
