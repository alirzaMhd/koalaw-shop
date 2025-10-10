// /assets/js/pages/magazine.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("articles-grid");
    if (!grid) return;

    // Initialize AOS
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

    // Category display names
    const categoryNames = {
      GUIDE: "راهنما",
      TUTORIAL: "آموزش",
      LIFESTYLE: "لایف‌استایل",
      TRENDS: "ترندها",
      GENERAL: "عمومی",
    };

    /**
     * Format date to Persian
     */
    function formatPersianDate(dateString) {
      if (!dateString) return "اخیراً";
      try {
        const date = new Date(dateString);
        const options = { year: "numeric", month: "long", day: "numeric" };
        return new Intl.DateTimeFormat("fa-IR", options).format(date);
      } catch (e) {
        console.error("Date formatting error:", e);
        return "اخیراً";
      }
    }

    /**
     * Safely get excerpt text
     */
    function getExcerpt(article) {
      if (article.excerpt) {
        return article.excerpt;
      }
      if (article.content) {
        return article.content.substring(0, 100) + "...";
      }
      return "مقاله جذاب و آموزنده درباره زیبایی و مراقبت از پوست.";
    }

    /**
     * Create article card HTML
     */
    function createArticleCard(article, delay = 100) {
      const categoryDisplay = categoryNames[article.category] || "عمومی";
      const readTime = article.readTimeMinutes || 5;
      const publishDate = formatPersianDate(article.publishedAt);
      const excerpt = getExcerpt(article);

      // Use highlighted title if available (from search)
      const title = article._highlights?.title?.[0] || article.title;
      const highlightedExcerpt = article._highlights?.excerpt?.[0] || excerpt;

      return `
        <a href="/magazine/${article.slug}" 
           class="group block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white article-card"
           data-aos="fade-up" 
           data-aos-delay="${delay}">
          <div class="relative h-64 overflow-hidden">
            <img src="${
              article.heroImageUrl || "/assets/images/magazine/article1.jpg"
            }" 
                 alt="${article.title}" 
                 onerror="this.src='/assets/images/magazine/article1.jpg'"
                 class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          </div>
          <div class="p-6">
            <div class="flex items-center gap-2 text-sm text-rose-600 font-semibold">
              <i data-feather="tag" class="w-4 h-4"></i>
              <span>${categoryDisplay}</span>
            </div>
            <h3 class="mt-3 text-xl font-bold text-gray-800 leading-8 group-hover:text-rose-700 transition-colors">
              ${title}
            </h3>
            <p class="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
              ${highlightedExcerpt}
            </p>
            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
              <span class="inline-flex items-center gap-1">
                <i data-feather="clock" class="w-4 h-4"></i>
                ${readTime} دقیقه مطالعه
              </span>
              <span>${publishDate}</span>
            </div>
          </div>
        </a>`;
    }

    /**
     * Show loading indicator
     */
    function showLoading() {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="inline-flex items-center gap-3 text-gray-500">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            <span class="text-lg">در حال بارگذاری مقالات...</span>
          </div>
        </div>`;
    }

    /**
     * Show empty state
     */
    function showEmptyState(hasSearch = false) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="max-w-md mx-auto">
            <svg class="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-xl font-bold text-gray-700 mb-2">
              ${hasSearch ? "نتیجه‌ای یافت نشد" : "مقاله‌ای موجود نیست"}
            </h3>
            <p class="text-gray-500 mb-6">
              ${
                hasSearch
                  ? `نتیجه‌ای برای جستجوی "${searchQuery}" یافت نشد.`
                  : "در حال حاضر مقاله‌ای در این دسته‌بندی وجود ندارد."
              }
            </p>
            ${
              hasSearch
                ? `
              <button onclick="document.getElementById('article-search').value = ''; document.getElementById('article-search').dispatchEvent(new Event('input'))" 
                      class="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors">
                پاک کردن جستجو
              </button>
            `
                : ""
            }
          </div>
        </div>`;
    }

    /**
     * Show error state
     */
    function showErrorState(errorMessage = "خطا در بارگذاری مقالات") {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="max-w-md mx-auto">
            <svg class="w-24 h-24 mx-auto mb-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-xl font-bold text-gray-700 mb-2">خطا در بارگذاری</h3>
            <p class="text-gray-500 mb-6">${errorMessage}</p>
            <button onclick="location.reload()" 
                    class="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors">
              تلاش مجدد
            </button>
          </div>
        </div>`;
    }

    /**
     * Fetch articles from API
     */
    async function fetchArticles(page = 1, append = false) {
      if (isLoading) return;

      isLoading = true;

      // Show loading indicator if not appending
      if (!append) {
        showLoading();
      }

      try {
        let url;
        const params = new URLSearchParams({
          page: page.toString(),
          size: "9",
        });

        // Use search endpoint if there's a search query
        if (searchQuery && searchQuery.trim()) {
          url = "/api/search/magazine";
          params.append("q", searchQuery.trim());
          params.append("sort", "relevance");

          if (activeFilter !== "all" && categoryMap[activeFilter]) {
            params.append("category", categoryMap[activeFilter]);
          }
        } else {
          // Use regular API for browsing
          url = "/api/magazine/posts";
          params.append("onlyPublished", "true");
          params.append("sort", "newest");

          if (activeFilter !== "all" && categoryMap[activeFilter]) {
            params.append("category", categoryMap[activeFilter]);
          }
        }

        const fullUrl = `${url}?${params.toString()}`;
        console.log("🔍 Fetching articles:", fullUrl);

        const response = await fetch(fullUrl);
        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📦 Response data:", data);

        // Handle success response
        if (data.success || data.ok) {
          const items = data.items || data.data?.items || [];
          const meta = data.meta || {
            totalPages: Math.ceil((data.total || 0) / 9),
            page: data.page || page,
          };

          totalPages = meta.totalPages;
          currentPage = meta.page;

          console.log(
            `✅ Loaded ${items.length} articles (page ${currentPage}/${totalPages})`
          );

          // Clear grid if not appending
          if (!append) {
            grid.innerHTML = "";
          }

          // If no results
          if (items.length === 0 && !append) {
            showEmptyState(!!searchQuery);
            return;
          }

          // Create and append article cards
          const fragment = document.createDocumentFragment();
          items.forEach((article, index) => {
            const wrapper = document.createElement("div");
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

          // Manage infinite scroll sentinel
          if (sentinel) {
            if (currentPage >= totalPages) {
              sentinel.style.display = "none";
            } else {
              sentinel.style.display = "block";
            }
          }
        } else {
          throw new Error(data.message || "Failed to load articles");
        }
      } catch (error) {
        console.error("❌ Error fetching articles:", error);

        // Show error state if not appending
        if (!append) {
          showErrorState(
            error.message || "خطا در بارگذاری مقالات. لطفاً دوباره تلاش کنید."
          );
        } else {
          // Show toast notification for append errors
          if (typeof KUtils !== "undefined" && KUtils.toast) {
            KUtils.toast("خطا در بارگذاری مقالات بیشتر", "error");
          }
        }
      } finally {
        isLoading = false;
      }
    }

    /**
     * Handle filter button clicks
     */
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.getAttribute("data-filter") || "all";
        console.log("🔖 Filter changed to:", activeFilter);
        currentPage = 1;
        fetchArticles(1, false);
      });
    });

    /**
     * Handle search with debounce
     */
    if (searchBox) {
      searchBox.addEventListener(
        "input",
        KUtils.debounce((e) => {
          searchQuery = e.target.value.trim();
          console.log("🔎 Search query:", searchQuery || "(empty)");
          currentPage = 1;
          fetchArticles(1, false);
        }, 300)
      );

      // Clear search on Escape key
      searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          searchBox.value = "";
          searchQuery = "";
          currentPage = 1;
          fetchArticles(1, false);
        }
      });
    }

    /**
     * Infinite scroll observer
     */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && currentPage < totalPages) {
            console.log(
              `♾️ Loading more articles (page ${currentPage + 1}/${totalPages})...`
            );
            fetchArticles(currentPage + 1, true);
          }
        });
      },
      { rootMargin: "300px 0px" }
    );

    if (sentinel) {
      observer.observe(sentinel);
    }

    /**
     * Initial load
     */
    console.log("🚀 Initializing magazine page");
    fetchArticles(1, false);

    /**
     * Expose refresh function globally (for debugging)
     */
    window.refreshMagazine = () => {
      console.log("🔄 Manual refresh triggered");
      currentPage = 1;
      fetchArticles(1, false);
    };
  });
})();
