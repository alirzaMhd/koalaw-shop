
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("articles-grid");
    if (!grid) return;

    window.AOS && AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 40 });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // Filters + search
    const searchBox = document.getElementById("article-search");
    const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
    const sentinel = document.getElementById("load-more-sentinel");

    const matchesFilter = (el, activeFilter) => activeFilter === "all" || el.getAttribute("data-category") === activeFilter;
    const matchesSearch = (el, q) => {
      if (!q) return true;
      const t = (el.getAttribute("data-title") || "").toLowerCase();
      return t.includes(q.toLowerCase());
    };

    function applyFilters() {
      const activeBtn = filterBtns.find(b => b.classList.contains("active")) || filterBtns[0];
      const activeFilter = activeBtn?.getAttribute("data-filter") || "all";
      const q = searchBox?.value.trim() || "";
      Array.from(grid.children).forEach(card => {
        if (!(card instanceof HTMLElement)) return;
        const show = matchesFilter(card, activeFilter) && matchesSearch(card, q);
        card.style.display = show ? "" : "none";
      });
    }

    filterBtns.forEach(btn => btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    }));
    searchBox && searchBox.addEventListener("input", KUtils.debounce(applyFilters, 150));

    // Infinite scroll (mock data)
    const moreArticles = [
      { title: "۱۰ اشتباه رایج در مراقبت از پوست", category:"guide",    img:"https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=800&auto=format&fit=crop", read:"۶ دقیقه", date:"۱۲ مرداد ۱۴۰۴" },
      { title: "ترفندهای ماندگاری آرایش در گرما",  category:"trends",   img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop", read:"۵ دقیقه", date:"۹ مرداد ۱۴۰۴" },
      { title: "روتین مینیمال صبحگاهی در ۵ قدم",   category:"tutorial", img:"https://images.unsplash.com/photo-1522335789203-9ed94e1b5e3e?q=80&w=800&auto=format&fit=crop", read:"۴ دقیقه", date:"۶ مرداد ۱۴۰۴" },
      { title: "انتخاب عطر بر اساس فصل",          category:"lifestyle", img:"https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop", read:"۷ دقیقه", date:"۳ مرداد ۱۴۰۴" },
      { title: "معرفی مواد مؤثره ترند ۲۰۲۵",       category:"trends",   img:"https://images.unsplash.com/photo-1508244132332-9c98d6b8b0de?q=80&w=800&auto=format&fit=crop", read:"۸ دقیقه", date:"۳۰ تیر ۱۴۰۴" },
      { title: "راهنمای انتخاب براش‌های آرایشی",   category:"guide",    img:"https://images.unsplash.com/photo-1596461404969-9ae70d2663f1?q=80&w=800&auto=format&fit=crop", read:"۵ دقیقه", date:"۲۷ تیر ۱۴۰۴" },
      { title: "اصول لایه‌بندی محصولات پوستی",    category:"tutorial", img:"https://images.unsplash.com/photo-1505575972945-3305d1b29f74?q=80&w=800&auto=format&fit=crop", read:"۹ دقیقه", date:"۲۴ تیر ۱۴۰۴" },
      { title: "سبک زندگی زیبایی-محور چیست؟",     category:"lifestyle", img:"https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop", read:"۶ دقیقه", date:"۲۰ تیر ۱۴۰۴" },
      { title: "روتین شبانه برای پوست‌های حساس",  category:"guide",    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", read:"۷ دقیقه", date:"۱۷ تیر ۱۴۰۴" },
      { title: "ترندهای میکاپ مینیمال ۱۴۰۴",      category:"trends",   img:"https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800&auto=format&fit=crop", read:"۵ دقیقه", date:"۱۴ تیر ۱۴۰۴" }
    ];
    let loadIndex = 0;
    const batchSize = 6;

    const makeCard = (item, delay = 100) => `
      <a href="#" class="group block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white"
         data-aos="fade-up" data-aos-delay="${delay}" data-category="${item.category}" data-title="${item.title}">
        <div class="relative h-64 overflow-hidden">
          <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 text-sm text-rose-600 font-semibold">
            <i data-feather="tag" class="w-4 h-4"></i><span>${
              item.category === "guide" ? "راهنما" :
              item.category === "tutorial" ? "آموزش" :
              item.category === "trends" ? "ترندها" : "لایف‌استایل"
            }</span>
          </div>
          <h3 class="mt-3 text-xl font-bold text-gray-800 leading-8 group-hover:text-rose-700 transition-colors">${item.title}</h3>
          <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
            <span class="inline-flex items-center gap-1"><i data-feather="clock" class="w-4 h-4"></i>${item.read} مطالعه</span>
            <span>${item.date}</span>
          </div>
        </div>
      </a>`;

    function appendBatch() {
      const end = Math.min(loadIndex + batchSize, moreArticles.length);
      const frag = document.createDocumentFragment();
      for (let i = loadIndex; i < end; i++) {
        const w = document.createElement("div");
        w.innerHTML = makeCard(moreArticles[i], 100 + (i % 3) * 50);
        frag.appendChild(w.firstElementChild);
      }
      grid.appendChild(frag);
      loadIndex = end;
      KUtils.refreshIcons();
      window.AOS && AOS.refreshHard && AOS.refreshHard();
      applyFilters();
      if (loadIndex >= moreArticles.length && observer) observer.disconnect();
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) appendBatch(); });
    }, { rootMargin: "300px 0px" });
    sentinel && observer.observe(sentinel);

    applyFilters();
  });
})();
