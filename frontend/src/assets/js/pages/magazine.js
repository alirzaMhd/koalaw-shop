// /assets/js/pages/magazine.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("articles-grid");
    if (!grid) return;

    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // State management
    let currentPage = 1;
    let totalPages = 1;
    let isLoading = false;
    let activeFilter = "all";
    let searchQuery = "";

    // UI elements
    const searchBox = document.getElementById("article-search");
    const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
    const sentinel = document.getElementById("load-more-sentinel");

    // Clear initial hardcoded articles
    grid.innerHTML = "";

    // Category mapping
    const categoryMap = {
      all: null,
      guide: "GUIDE",
      tutorial: "TUTORIAL",
      trends: "TRENDS",
      lifestyle: "LIFESTYLE",
      general: "GENERAL",
    };

    // Format date to Persian
    function formatPersianDate(dateString) {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Intl.DateTimeFormat("fa-IR", options).format(date);
    }

    // Create article card HTML
    function createArticleCard(article, delay = 100) {
      const categoryDisplay =
        article.category === "GUIDE"
          ? "راهنما"
          : article.category === "TUTORIAL"
          ? "آموزش"
          : article.category === "LIFESTYLE"
          ? "لایف‌استایل"
          : article.category === "TRENDS"
          ? "ترندها"
          : "عمومی";

      const readTime = article.readTimeMinutes || 5;
      const publishDate = article.publishedAt
        ? formatPersianDate(article.publishedAt)
        : "اخیراً";

      return `
        <a href="/magazine/${
          article.slug
        }" class="group block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white article-card"
           data-aos="fade-up" data-aos-delay="${delay}">
          <div class="relative h-64 overflow-hidden">
            <img src="${
              article.heroImageUrl ||
              "https://images.unsplash.com/photo-1556041136379-c3da31393693?q=80&w=800&auto=format&fit=crop"
            }" 
                 alt="${article.title}" 
                 class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          </div>
          <div class="p-6">
            <div class="flex items-center gap-2 text-sm text-rose-600 font-semibold">
              <i data-feather="tag" class="w-4 h-4"></i><span>${categoryDisplay}</span>
            </div>
            <h3 class="mt-3 text-xl font-bold text-gray-800 leading-8 group-hover:text-rose-700 transition-colors">
              ${article.title}
            </h3>
            <p class="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-2 h-10">
              ${article.excerpt || article.content.substring(0, 100) + "..."}
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
              <span class="inline-flex items-center gap-1">
                <i data-feather="clock" class="w-4 h-4"></i>${readTime} دقیقه مطالعه
              </span>
              <span>${publishDate}</span>
            </div>
          </div>
        </a>`;
    }

    // Fetch articles from API
    async function fetchArticles(page = 1, append = false) {
      if (isLoading) return;

      isLoading = true;

      try {
        let url;
        const params = new URLSearchParams({
          page: page.toString(),
          size: "9",
        });

        // Use search endpoint if there's a search query
        if (searchQuery) {
          url = "/api/search/magazine";
          params.append("q", searchQuery);
          if (activeFilter !== "all" && categoryMap[activeFilter]) {
            params.append("category", categoryMap[activeFilter]);
          }
        } else {
          // Use regular API for browsing
          url = "/api/magazine/posts";
          params.append("onlyPublished", "true");
          if (activeFilter !== "all" && categoryMap[activeFilter]) {
            params.append("category", categoryMap[activeFilter]);
          }
        }

        const response = await fetch(`${url}?${params}`);
        const data = await response.json();

        if (data.success || data.ok) {
          const items = data.items || data.data?.items || [];
          const meta = data.meta || {
            totalPages: Math.ceil((data.total || 0) / 9),
            page: data.page || page,
          };

          totalPages = meta.totalPages;
          currentPage = meta.page;

          if (!append) {
            grid.innerHTML = "";
          }

          // If no results
          if (items.length === 0 && !append) {
            grid.innerHTML = `
              <div class="col-span-full text-center py-12">
                <p class="text-gray-600">
                  ${
                    searchQuery
                      ? "نتیجه‌ای برای جستجوی شما یافت نشد."
                      : "مقاله‌ای موجود نیست."
                  }
                </p>
              </div>`;
            return;
          }

          // Create and append article cards
          const fragment = document.createDocumentFragment();
          items.forEach((article, index) => {
            const wrapper = document.createElement("div");

            // Handle highlights from search results
            if (article._highlights) {
              if (article._highlights.title) {
                article.title = article._highlights.title[0];
              }
              if (article._highlights.excerpt) {
                article.excerpt = article._highlights.excerpt[0];
              }
            }

            wrapper.innerHTML = createArticleCard(
              article,
              100 + (index % 3) * 50
            );
            fragment.appendChild(wrapper.firstElementChild);
          });

          grid.appendChild(fragment);

          // Refresh icons and AOS
          KUtils.refreshIcons();
          if (window.AOS && window.AOS.refreshHard) {
            window.AOS.refreshHard();
          }

          // Hide sentinel if no more pages
          if (currentPage >= totalPages) {
            if (sentinel) sentinel.style.display = "none";
          } else {
            if (sentinel) sentinel.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
        // Show error message to user
        if (!append) {
          grid.innerHTML = `
            <div class="col-span-full text-center py-12">
              <p class="text-gray-600">خطا در بارگذاری مقالات. لطفاً دوباره تلاش کنید.</p>
            </div>`;
        }
      } finally {
        isLoading = false;
      }
    }

    // Handle filter button clicks
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.getAttribute("data-filter") || "all";
        currentPage = 1;
        fetchArticles(1, false);
      });
    });

    // Handle search with debounce
    if (searchBox) {
      searchBox.addEventListener(
        "input",
        KUtils.debounce((e) => {
          searchQuery = e.target.value.trim();
          currentPage = 1;
          fetchArticles(1, false);
        }, 300)
      );
    }

    // Infinite scroll observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && currentPage < totalPages) {
            fetchArticles(currentPage + 1, true);
          }
        });
      },
      { rootMargin: "300px 0px" }
    );

    if (sentinel) {
      observer.observe(sentinel);
    }

    // Initial load
    fetchArticles(1, false);
  });
})();
