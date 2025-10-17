// frontend/src/assets/js/admin/admin.js
(function () {
  // ========== GLOBAL STATE ==========
  const state = {
    currentRoute: "dashboard",
    user: null,
    stats: null,
    products: [],
    orders: [],
    users: [],
    brands: [],
    collections: [],
    coupons: [],
    reviews: [],
    magazines: [],
    authors: [],
    tags: [],
    magazineCategories: [],
    colorThemes: [],
    badges: [],
    newsletterSubscribers: [],
    categories: [],
  };

  // ========== UTILITY FUNCTIONS ==========
  const utils = {
    toFa(num) {
      return Number(num || 0).toLocaleString("fa-IR");
    },

    toIRR(num) {
      return Number(num || 0).toLocaleString("fa-IR") + " تومان";
    },

    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    },

    formatDateTime(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },

    getStatusLabel(status) {
      const labels = {
        DRAFT: "پیش‌نویس",
        AWAITING_PAYMENT: "در انتظار پرداخت",
        PAID: "پرداخت شده",
        PROCESSING: "در حال پردازش",
        SHIPPED: "ارسال شده",
        DELIVERED: "تحویل شده",
        CANCELLED: "لغو شده",
        RETURNED: "مرجوع شده",
      };
      return labels[status] || status;
    },

    getStatusColor(status) {
      const colors = {
        DELIVERED: "success",
        PAID: "success",
        PROCESSING: "warning",
        SHIPPED: "info",
        AWAITING_PAYMENT: "warning",
        CANCELLED: "danger",
        RETURNED: "danger",
      };
      return colors[status] || "secondary";
    },

    getRoleLabel(role) {
      const labels = {
        ADMIN: "ادمین",
        STAFF: "کارمند",
        CUSTOMER: "مشتری",
      };
      return labels[role] || role;
    },

    getRoleColor(role) {
      const colors = {
        ADMIN: "danger",
        STAFF: "warning",
        CUSTOMER: "secondary",
      };
      return colors[role] || "secondary";
    },

    // ========== CATEGORY HELPERS (DB-backed + fallback) ==========
    categorySlug(val) {
      return String(val || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
    },
    getCategoryLabel(val) {
      const slug = this.categorySlug(val);
      const fromState = (state.categories || []).find(
        (c) => String(c.value || "").toLowerCase() === slug
      );
      if (fromState) return fromState.label || fromState.value;
      const fallback = {
        skincare: "مراقبت از پوست",
        makeup: "آرایش",
        fragrance: "عطر",
        haircare: "مراقبت از مو",
        "body-bath": "بدن و حمام",
      };
      return fallback[slug] || slug || "-";
    },
    categoryOptionsHtml(selectedSlug) {
      const opts = (state.categories || []).map(
        (c) =>
          `<option value="${c.id}" data-slug="${c.value}" ${(String(selectedSlug || "").toLowerCase() ===
            String(c.value || "").toLowerCase())
            ? "selected"
            : ""
          }>${c.label}</option>`
      );
      return ['<option value="">هیچکدام</option>', ...opts].join("");
    },

    showLoading() {
      return `
        <div class="text-center py-12">
          <div class="inline-flex items-center gap-3 text-gray-500">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            <span class="text-lg">در حال بارگذاری...</span>
          </div>
        </div>
      `;
    },

    showError(message) {
      return `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i data-feather="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
          <h3 class="text-lg font-bold text-red-800 mb-2">خطا</h3>
          <p class="text-red-600 mb-4">${message}</p>
          <button data-action="reload" class="admin-btn admin-btn-primary">
            تلاش مجدد
          </button>
        </div>
      `;
    },

    refreshIcons() {
      if (typeof feather !== "undefined") {
        feather.replace();
      }
    },

    toInputDate(isoDate) {
      if (!isoDate) return "";
      return new Date(isoDate).toISOString().split("T")[0];
    },

    toInputDateTime(isoDate) {
      if (!isoDate) return "";
      return new Date(isoDate).toISOString().slice(0, 16);
    },

    showToast(message, type = "info") {
      const toast = document.createElement("div");
      toast.className = `admin-toast admin-toast-${type}`;
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <i data-feather="${type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info"}"></i>
          <span>${message}</span>
        </div>
      `;
      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add("show"), 100);
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }, 3000);

      feather.replace();
    },

    // Unified image uploader (used by product/magazine/category/author)
    async uploadImage(file) {
      if (!file) throw new Error("فایلی انتخاب نشده است.");
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("حجم فایل نباید بیشتر از 5 مگابایت باشد.");
      }
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error("فقط فایل‌های تصویری (JPG, PNG, WebP, GIF) مجاز هستند.");
      }
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch { }
        throw new Error(err.message || "خطا در آپلود تصویر");
      }
      const json = await res.json();
      return json?.data?.imageUrl || json?.imageUrl;
    },
  };

  // ========== API CALLS ==========
  const api = {
    async fetch(endpoint, options = {}) {
      const response = await fetch(endpoint, {
        ...options,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login?redirect=/admin/dashboard";
        throw new Error("Unauthorized");
      }

      if (response.status === 403) {
        alert("شما دسترسی به این بخش ندارید.");
        window.location.href = "/";
        throw new Error("Forbidden");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    },

    // Dashboard
    getDashboard() {
      return this.fetch("/api/admin/dashboard");
    },

    // Products
    getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/products?${query}`);
    },
    getProduct(id) {
      return this.fetch(`/api/products/${id}`);
    },
    createProduct(data) {
      return this.fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateProduct(id, data) {
      return this.fetch(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    deleteProduct(id) {
      return this.fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    },

    getById(id) {
      return this.fetch(`/api/orders/${id}`);
    },

    // Orders
    getOrders(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/orders?${query}`);
    },
    updateOrderStatus(id, status) {
      return this.fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    // Users
    getUsers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/users?${query}`);
    },
    getUser(id) {
      return this.fetch(`/api/admin/users/${id}`);
    },
    updateUserRole(id, role) {
      return this.fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    updateUserTier(id, tier) {
      return this.fetch(`/api/admin/users/${id}/tier`, {
        method: "PATCH",
        body: JSON.stringify({ tier }),
      });
    },
    deleteUser(id) {
      return this.fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    },

    // Reviews
    getReviews(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/reviews/pending?${query}`);
    },
    updateReviewStatus(id, status) {
      return this.fetch(`/api/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    // Color Themes
    getColorThemesAdmin() {
      return this.fetch("/api/admin/color-themes");
    },
    createColorTheme(data) {
      return this.fetch("/api/admin/color-themes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateColorTheme(id, data) {
      return this.fetch(`/api/admin/color-themes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteColorTheme(id) {
      return this.fetch(`/api/admin/color-themes/${id}`, { method: "DELETE" });
    },
    // Brands
    getBrands() {
      return this.fetch("/api/admin/brands");
    },
    createBrand(data) {
      return this.fetch("/api/admin/brands", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateBrand(id, data) {
      return this.fetch(`/api/admin/brands/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteBrand(id) {
      return this.fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
    },

    // Collections
    getCollections() {
      return this.fetch("/api/admin/collections");
    },
    createCollection(data) {
      return this.fetch("/api/admin/collections", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateCollection(id, data) {
      return this.fetch(`/api/admin/collections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    deleteCollection(id) {
      return this.fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    },

    // Coupons
    getCoupons(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/coupons?${query}`);
    },
    createCoupon(data) {
      return this.fetch("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateCoupon(id, data) {
      return this.fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteCoupon(id) {
      return this.fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    },

    // Newsletter
    getNewsletterStats() {
      return this.fetch("/api/admin/newsletter/stats");
    },
    getNewsletterSubscribers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/newsletter/subscribers?${query}`);
    },
    sendNewsletter(data) {
      return this.fetch("/api/newsletter/send", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    // Magazine
    getMagazinePosts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/magazine/posts?${query}`);
    },
    getMagazinePost(id) {
      return this.fetch(`/api/magazine/admin/posts/${id}`);
    },
    createMagazinePost(data) {
      return this.fetch("/api/magazine/admin/posts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateMagazinePost(id, data) {
      return this.fetch(`/api/magazine/admin/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteMagazinePost(id) {
      return this.fetch(`/api/magazine/admin/posts/${id}`, {
        method: "DELETE",
      });
    },
    getMagazineAuthors() {
      return this.fetch("/api/magazine/admin/authors");
    },
    getMagazineTags() {
      return this.fetch("/api/magazine/admin/tags");
    },
    createMagazineAuthor(data) {
      return this.fetch("/api/magazine/admin/authors", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateMagazineAuthor(id, data) {
      return this.fetch(`/api/magazine/admin/authors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteMagazineAuthor(id) {
      return this.fetch(`/api/magazine/admin/authors/${id}`, {
        method: "DELETE",
      });
    },
    createMagazineTag(data) {
      return this.fetch("/api/magazine/admin/tags", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateMagazineTag(id, data) {
      return this.fetch(`/api/magazine/admin/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteMagazineTag(id) {
      return this.fetch(`/api/magazine/admin/tags/${id}`, {
        method: "DELETE",
      });
    },
    // Magazine Categories (Admin)
    getMagazineCategories() {
      return this.fetch("/api/magazine/admin/categories");
    },
    createMagazineCategory(data) {
      return this.fetch("/api/magazine/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateMagazineCategory(id, data) {
      return this.fetch(`/api/magazine/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteMagazineCategory(id) {
      return this.fetch(`/api/magazine/admin/categories/${id}`, {
        method: "DELETE",
      });
    },

    // Badges
    getBadges() {
      return this.fetch("/api/admin/badges");
    },
    createBadge(data) {
      return this.fetch("/api/admin/badges", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateBadge(id, data) {
      return this.fetch(`/api/admin/badges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteBadge(id) {
      return this.fetch(`/api/admin/badges/${id}`, { method: "DELETE" });
    },

    // Color Themes (for products)
    getColorThemes() {
      return this.fetch("/api/products/filters").then(
        (data) => data.colorThemes || []
      );
    },

    // ========== CATEGORIES (DB-backed) ==========
    getCategories() {
      return this.fetch("/api/admin/categories");
    },
    createCategory(data) {
      return this.fetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateCategory(id, data) {
      return this.fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteCategory(id) {
      return this.fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    },
  };

  // ========== SIDE PANEL SYSTEM ==========
  const panel = {
    open(content, title = "فرم") {
      const existing = document.getElementById("admin-side-panel");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "admin-side-panel";
      overlay.className = "admin-panel-overlay";
      overlay.innerHTML = `
        <div class="admin-panel">
          <div class="admin-panel-header">
            <h2 class="admin-panel-title">${title}</h2>
            <button class="admin-panel-close" data-action="closePanel">
              <i data-feather="x"></i>
            </button>
          </div>
          <div class="admin-panel-body">
            ${content}
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      utils.refreshIcons();

      setTimeout(() => overlay.classList.add("active"), 10);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.close();
      });
    },

    close() {
      const overlay = document.getElementById("admin-side-panel");
      if (overlay) {
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 300);
      }
    },

    showLoading() {
      this.open(utils.showLoading(), "در حال بارگذاری...");
    },
  };

  // ========== FORM GENERATORS ==========
  const forms = {
    // Magazine Author Form
    magazineAuthor(authorId = null) {
      const author = authorId
        ? (state.authors || []).find((a) => a.id === authorId)
        : null;
      const isEdit = !!authorId;
      const formHtml = `
        <form id="magazine-author-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">${isEdit ? "ویرایش نویسنده" : "افزودن نویسنده"}</h3>
            <div class="admin-form-group">
              <label class="admin-form-label required">نام</label>
              <input type="text" name="name" class="admin-form-input" value="${author?.name || ""}" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">اسلاگ (URL)</label>
              <input type="text" name="slug" class="admin-form-input" value="${author?.slug || ""}" />
              <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">آواتار</label>
              ${author?.avatarUrl
          ? `
                <div class="mb-3">
                  <img src="${author.avatarUrl}" alt="${author.name || ""}" class="w-16 h-16 rounded object-cover border" />
                  <small class="text-gray-500 block mt-1">آواتار فعلی</small>
                </div>
              `
          : ""
        }
              <input type="file" id="author-avatar-file" class="admin-form-input" accept="image/*" />
              <small class="text-gray-500">فرمت‌های مجاز: JPG, PNG, WebP, GIF (حداکثر 5MB)</small>
              <div id="author-avatar-preview" class="mt-3 hidden">
                <img id="author-avatar-preview-img" src="" alt="پیش‌نمایش" class="w-16 h-16 rounded object-cover border" />
              </div>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">بیو</label>
              <textarea name="bio" class="admin-form-input" rows="4">${author?.bio || ""}</textarea>
            </div>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">انصراف</button>
            <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? "ذخیره تغییرات" : "افزودن نویسنده"}</button>
          </div>
        </form>
      `;
      panel.open(
        formHtml,
        isEdit ? "ویرایش نویسنده مجله" : "افزودن نویسنده مجله"
      );
      // Preview selected avatar
      const avatarInput = document.getElementById("author-avatar-file");
      const previewWrap = document.getElementById("author-avatar-preview");
      const previewImg = document.getElementById("author-avatar-preview-img");
      avatarInput?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          previewWrap?.classList.add("hidden");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          utils.showToast("حجم فایل نباید بیشتر از 5 مگابایت باشد.", "error");
          avatarInput.value = "";
          previewWrap?.classList.add("hidden");
          return;
        }
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!validTypes.includes(file.type)) {
          utils.showToast(
            "فقط فایل‌های تصویری (JPG, PNG, WebP, GIF) مجاز هستند.",
            "error"
          );
          avatarInput.value = "";
          previewWrap?.classList.add("hidden");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (previewImg) previewImg.src = ev.target?.result || "";
          previewWrap?.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      });
      document
        .getElementById("magazine-author-form")
        ?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = {
            name: String(fd.get("name") || "").trim(),
            slug: (fd.get("slug") || "").toString().trim() || undefined,
            bio: (fd.get("bio") || "").toString().trim() || undefined,
          };

          // If a new file is selected, upload and set avatarUrl
          const fileInput = document.getElementById("author-avatar-file");
          const file = fileInput?.files?.[0];
          if (file) {
            try {
              const imageUrl = await utils.uploadImage(file);
              if (imageUrl) payload.avatarUrl = imageUrl;
            } catch (err) {
              utils.showToast(
                "خطا در آپلود تصویر: " + (err.message || err),
                "error"
              );
              return;
            }
          }

          try {
            if (isEdit) {
              await api.updateMagazineAuthor(authorId, payload);
              utils.showToast("نویسنده ویرایش شد", "success");
            } else {
              await api.createMagazineAuthor(payload);
              utils.showToast("نویسنده افزوده شد", "success");
            }
            panel.close();
            handlers.magazineAuthors();
          } catch (err) {
            utils.showToast("خطا: " + err.message, "error");
          }
        });
    },

    // Magazine Tag Form
    magazineTag(tagId = null) {
      const tag = tagId ? (state.tags || []).find((t) => t.id === tagId) : null;
      const isEdit = !!tagId;
      const formHtml = `
        <form id="magazine-tag-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">${isEdit ? "ویرایش برچسب" : "افزودن برچسب"}</h3>
            <div class="admin-form-group">
              <label class="admin-form-label required">نام</label>
              <input type="text" name="name" class="admin-form-input" value="${tag?.name || ""}" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">اسلاگ (URL)</label>
              <input type="text" name="slug" class="admin-form-input" value="${tag?.slug || ""}" />
              <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
            </div>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">انصراف</button>
            <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? "ذخیره تغییرات" : "افزودن برچسب"}</button>
          </div>
        </form>
      `;
      panel.open(formHtml, isEdit ? "ویرایش برچسب مجله" : "افزودن برچسب مجله");
      document
        .getElementById("magazine-tag-form")
        ?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = {
            name: String(fd.get("name") || "").trim(),
            slug: (fd.get("slug") || "").toString().trim() || undefined,
          };
          try {
            if (isEdit) {
              await api.updateMagazineTag(tagId, payload);
              utils.showToast("برچسب ویرایش شد", "success");
            } else {
              await api.createMagazineTag(payload);
              utils.showToast("برچسب افزوده شد", "success");
            }
            panel.close();
            handlers.magazineTags();
          } catch (err) {
            utils.showToast("خطا: " + err.message, "error");
          }
        });
    },
    // Magazine Category Form
    magazineCategory(categoryId = null) {
      const cat = categoryId
        ? (state.magazineCategories || []).find((c) => c.id === categoryId)
        : null;
      const isEdit = !!categoryId;
      const formHtml = `
        <form id="magazine-category-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">${isEdit ? "ویرایش دسته‌بندی مجله" : "افزودن دسته‌بندی مجله"}</h3>
            <div class="admin-form-group">
              <label class="admin-form-label required">کد (CODE)</label>
              <input type="text" name="code" class="admin-form-input uppercase-input" value="${cat?.code || ""}" placeholder="GUIDE, TUTORIAL, ..." required />
              <small class="text-gray-500">فقط حروف بزرگ انگلیسی و آندرلاین (مثال: GUIDE)</small>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label required">نام نمایشی</label>
              <input type="text" name="name" class="admin-form-input" value="${cat?.name || ""}" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">اسلاگ (slug)</label>
              <input type="text" name="slug" class="admin-form-input" value="${cat?.slug || ""}" placeholder="guide, tutorial, ..." />
              <small class="text-gray-500">خالی بگذارید تا بر اساس نام ساخته شود</small>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">توضیحات</label>
              <textarea name="description" class="admin-form-input" rows="3">${cat?.description || ""}</textarea>
            </div>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">انصراف</button>
            <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}</button>
          </div>
        </form>
      `;
      panel.open(formHtml, isEdit ? "ویرایش دسته‌بندی مجله" : "افزودن دسته‌بندی مجله");
      utils.refreshIcons();

      // Force uppercase for code input
      const codeInput = document.querySelector('#magazine-category-form input[name="code"]');
      codeInput?.addEventListener("input", () => {
        codeInput.value = codeInput.value.replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
      });

      document.getElementById("magazine-category-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
          code: String(fd.get("code") || "").trim().toUpperCase(),
          name: String(fd.get("name") || "").trim(),
          slug: (fd.get("slug") || "").toString().trim() || undefined,
          description: (fd.get("description") || "").toString().trim() || undefined,
        };
        if (!payload.code) return utils.showToast("کد دسته‌بندی الزامی است", "error");
        if (!payload.name) return utils.showToast("نام دسته‌بندی الزامی است", "error");
        try {
          if (isEdit) {
            await api.updateMagazineCategory(categoryId, payload);
            utils.showToast("دسته‌بندی ویرایش شد", "success");
          } else {
            await api.createMagazineCategory(payload);
            utils.showToast("دسته‌بندی افزوده شد", "success");
          }
          panel.close();
          handlers.magazineCategories();
        } catch (err) {
          utils.showToast("خطا: " + err.message, "error");
        }
      });
    },
    // Product Form
    async product(productId = null) {
      panel.showLoading();

      try {
        const [
          brands,
          collections,
          colorThemes,
          badges,
          allProducts,
          categoriesRes,
        ] = await Promise.all([
          api.getBrands(),
          api.getCollections(),
          api.getColorThemesAdmin(),
          api.getBadges(),
          api.getProducts({ page: 1, perPage: 200 }),
          api.getCategories(),
        ]);
        const categories = categoriesRes?.categories || categoriesRes || [];
        state.categories = categories;

        let product = null;
        if (productId) {
          try {
            const productData = await api.getProduct(productId);
            product = productData.product || productData;
          } catch (error) {
            console.error("Error fetching product:", error);
            throw new Error("خطا در بارگذاری اطلاعات محصول");
          }
        }

        const isEdit = !!productId;
        const data = product || {};
        const existingRelatedIds = Array.isArray(data.related)
          ? data.related.map((r) => r.id)
          : [];
        const formHtml = `
      <form id="product-form" class="admin-form" enctype="multipart/form-data">
        <input type="hidden" name="id" value="${data.id || ""}" />

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">اطلاعات اصلی</h3>

          <div class="admin-form-group">
            <label class="admin-form-label required">عنوان محصول</label>
            <input type="text" name="title" class="admin-form-input" value="${data.title || ""}" required />
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">زیرعنوان</label>
            <input type="text" name="subtitle" class="admin-form-input" value="${data.subtitle || ""}" />
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">اسلاگ (URL)</label>
            <input type="text" name="slug" class="admin-form-input" value="${data.slug || ""}" />
            <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label required">برند</label>
              <select name="brandId" class="admin-form-input" required>
                <option value="">انتخاب کنید</option>
                ${brands.brands
            .map(
              (b) => `
                  <option value="${b.id}" ${data.brandId === b.id ? "selected" : ""}>
                    ${b.name}
                  </option>
                `
            )
            .join("")}
              </select>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">کالکشن</label>
              <select name="collectionId" class="admin-form-input">
                <option value="">هیچکدام</option>
                ${collections.collections
            .map(
              (c) => `
                  <option value="${c.id}" ${data.collectionId === c.id ? "selected" : ""}>
                    ${c.name}
                  </option>
                `
            )
            .join("")}
              </select>
            </div>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">تم رنگی</label>
              <select name="colorThemeId" class="admin-form-input">
                <option value="">هیچکدام</option>
                ${(colorThemes?.colorThemes || [])
            .map(
              (ct) => `
                   <option value="${ct.id}" ${data.colorThemeId === ct.id ? "selected" : ""}>
                     ${ct.name}
                   </option>
                 `
            )
            .join("")}
              </select>
            </div>

          <div class="admin-form-group"> <label class="admin-form-label required">دسته‌بندی</label> <select name="categoryId" class="admin-form-input" required> <option value="">انتخاب کنید</option> ${categories.map((c) => ` <option value="${c.id}" ${data.categoryId === c.id || data.dbCategory?.id === c.id ? "selected" : ""}>${c.label} (${c.value})</option>`).join("")} </select> </div>

          <div class="admin-form-group">
            <label class="admin-form-label">نشان‌ها</label>
            <div class="space-y-2" id="badges-checklist">
              ${badges.badges
            .map(
              (b) => `
                <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input 
                    type="checkbox" 
                    name="badges" 
                    value="${b.id}" 
                    class="w-4 h-4"
                    ${(data.badges || []).some((db) => db.id === b.id) ? "checked" : ""}
                  />
                  <i data-feather="${b.icon}" class="w-4 h-4 text-rose-600"></i>
                  <span>${b.title}</span>
                </label>
              `
            )
            .join("")}
            </div>
          </div>

          <div class="admin-form-group">
  <label class="admin-form-label">توضیحات</label>
  <textarea name="description" class="admin-form-input" rows="6">${data.description || ""}</textarea>
  <small class="text-gray-500">می‌توانید از HTML و CSS استفاده کنید (مثال: &lt;p class="text-lg"&gt;متن&lt;/p&gt;)</small>
</div>

<div class="admin-form-group">
  <label class="admin-form-label">مواد تشکیل‌دهنده</label>
  <textarea name="ingredients" class="admin-form-input" rows="5">${data.ingredients || ""}</textarea>
  <small class="text-gray-500">می‌توانید از HTML و CSS استفاده کنید (مثال: &lt;ul&gt;&lt;li&gt;ویتامین C&lt;/li&gt;&lt;/ul&gt;)</small>
</div>

<div class="admin-form-group">
  <label class="admin-form-label">نحوه استفاده</label>
  <textarea name="howToUse" class="admin-form-input" rows="5">${data.howToUse || ""}</textarea>
  <small class="text-gray-500">می‌توانید از HTML و CSS استفاده کنید (مثال: &lt;ol&gt;&lt;li&gt;مرحله اول&lt;/li&gt;&lt;/ol&gt;)</small>
</div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">قیمت‌گذاری</h3>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label required">قیمت (تومان)</label>
              <input type="number" name="price" class="admin-form-input" value="${data.price || ""}" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">قیمت قبلی (تومان)</label>
              <input type="number" name="compareAtPrice" class="admin-form-input" value="${data.compareAtPrice || ""}" />
            </div>
          </div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">گالری تصاویر</h3>

          <div class="admin-form-group">
            <label class="admin-form-label">آپلود تصاویر</label>
            <input type="file" id="gallery-files-input" class="admin-form-input" accept="image/*" multiple />
            <small class="text-gray-500">می‌توانید چند تصویر انتخاب کنید. فرمت‌های مجاز: JPG, PNG, WebP, GIF (حداکثر 5MB)</small>
          </div>

          <div class="admin-form-divider">
            <span>یا</span>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">افزودن با آدرس URL</label>
            <div class="flex items-center gap-2">
              <input type="url" id="gallery-url-input" class="admin-form-input flex-1" placeholder="https://example.com/image.jpg" />
              <button type="button" id="add-gallery-url-btn" class="admin-btn admin-btn-secondary">
                <i data-feather="plus"></i>
                افزودن
              </button>
            </div>
          </div>

          <div id="gallery-list" class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3"></div>
        </div>
 
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">واریانت‌ها</h3>
          <div id="variants-list" class="space-y-3"></div>
          <button type="button" class="admin-btn admin-btn-secondary" id="add-variant-btn">
            <i data-feather="plus"></i>
            افزودن واریانت
          </button>
          <small class="text-gray-500 block mt-2">
            ترتیب نمایش بر اساس ترتیب لیست است.
          </small>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">محصولات مرتبط</h3>
          <div class="admin-form-group">
            <label class="admin-form-label">انتخاب محصولات مرتبط</label>
            <select name="relatedProductIds" id="related-products-select" class="admin-form-input" multiple size="8">
              ${(allProducts?.products || [])
            .filter((p) => !data.id || p.id !== data.id)
            .map(
              (p) => `
                <option value="${p.id}" ${existingRelatedIds.includes(p.id) ? "selected" : ""}>
                  ${p.title}
                </option>`
            )
            .join("")}
            </select>
            <small class="text-gray-500">برای انتخاب چند مورد، کلید Ctrl/⌘ را نگه دارید.</small>
          </div>
        </div>
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">تنظیمات</h3>

          <div class="admin-form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" class="w-4 h-4" ${data.isActive !== false ? "checked" : ""} />
              <span>فعال</span>
            </label>
          </div>

          <div class="admin-form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFeatured" class="w-4 h-4" ${data.isFeatured ? "checked" : ""} />
              <span>ویژه</span>
            </label>
          </div>

          <div class="admin-form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isBestseller" class="w-4 h-4" ${data.isBestseller ? "checked" : ""} />
              <span>پرفروش</span>
            </label>
          </div>

          <div class="admin-form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isSpecialProduct" class="w-4 h-4" ${data.isSpecialProduct ? "checked" : ""} />
              <span>محصول ویژه</span>
            </label>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">یادداشت‌های داخلی</label>
            <textarea name="internalNotes" class="admin-form-input" rows="2">${data.internalNotes || ""}</textarea>
          </div>
        </div>

        <div class="admin-form-actions">
          <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
            انصراف
          </button>
          <button type="submit" class="admin-btn admin-btn-primary" id="submit-product-btn">
            ${isEdit ? "ذخیره تغییرات" : "افزودن محصول"}
          </button>
        </div>
      </form>
    `;

        panel.open(formHtml, isEdit ? "ویرایش محصول" : "افزودن محصول");

        // Gallery state
        const galleryInput = document.getElementById("gallery-files-input");
        const galleryUrlInput = document.getElementById("gallery-url-input");
        const addGalleryUrlBtn = document.getElementById("add-gallery-url-btn");
        const galleryList = document.getElementById("gallery-list");

        let gallery = []; // [{ url, alt }]
        let heroIndex = 0;

        // Prefill existing images (edit mode)
        if (isEdit && Array.isArray(data.images) && data.images.length) {
          const sorted = data.images
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          gallery = sorted.map((img) => ({ url: img.url, alt: img.alt || "" }));
          const idx = gallery.findIndex((g) => g.url === data.heroImageUrl);
          heroIndex = idx >= 0 ? idx : 0;
        } else if (data.heroImageUrl) {
          gallery = [{ url: data.heroImageUrl, alt: "" }];
          heroIndex = 0;
        }

        function renderGallery() {
          if (!galleryList) return;
          if (!gallery.length) {
            galleryList.innerHTML =
              '<div class="text-center text-gray-500 col-span-full py-6">تصویری اضافه نشده است</div>';
            utils.refreshIcons();
            return;
          }
          galleryList.innerHTML = gallery
            .map(
              (img, idx) => `
              <div class="border rounded-lg p-2 flex flex-col gap-2" data-idx="${idx}">
                <img src="${img.url}" alt="${img.alt || ""}" class="w-full h-28 object-cover rounded" />
                <label class="flex items-center gap-2">
                  <input type="radio" name="heroImage" value="${idx}" ${heroIndex === idx ? "checked" : ""} />
                  <span class="text-sm">تصویر شاخص</span>
                </label>
                <input type="text" class="admin-form-input" data-role="alt" data-idx="${idx}" placeholder="متن جایگزین" value="${img.alt || ""}" />
                <div class="flex gap-2">
                  <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="moveUp" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>
                    <i data-feather="arrow-up"></i>
                  </button>
                  <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="moveDown" data-idx="${idx}" ${idx === gallery.length - 1 ? "disabled" : ""}>
                    <i data-feather="arrow-down"></i>
                  </button>
                  <button type="button" class="admin-btn admin-btn-danger" data-action="removeGallery" data-idx="${idx}">
                    <i data-feather="trash-2"></i>
                  </button>
                </div>
              </div>
            `
            )
            .join("");
          utils.refreshIcons();
        }

        renderGallery();

        const uploadImageFile = (file) => utils.uploadImage(file);

        galleryInput?.addEventListener("change", async (e) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            try {
              const url = await uploadImageFile(file);
              gallery.push({ url, alt: "" });
            } catch (err) {
              utils.showToast(err.message, "error");
            }
          }
          if (gallery.length && (heroIndex == null || heroIndex < 0))
            heroIndex = 0;
          renderGallery();
          galleryInput.value = "";
        });

        addGalleryUrlBtn?.addEventListener("click", () => {
          const url = (galleryUrlInput?.value || "").trim();
          if (!url) return;
          if (!(url.startsWith("/") || url.startsWith("http"))) {
            utils.showToast(
              "آدرس URL تصویر باید با / یا http شروع شود.",
              "error"
            );
            return;
          }
          gallery.push({ url, alt: "" });
          if (gallery.length === 1) heroIndex = 0;
          galleryUrlInput.value = "";
          renderGallery();
        });

        galleryList?.addEventListener("change", (e) => {
          if (e.target.name === "heroImage") {
            heroIndex = parseInt(e.target.value, 10);
          }
        });
        galleryList?.addEventListener("input", (e) => {
          const inp = e.target.closest('input[data-role="alt"]');
          if (inp) {
            const idx = parseInt(inp.dataset.idx, 10);
            if (!isNaN(idx) && gallery[idx]) gallery[idx].alt = inp.value;
          }
        });
        galleryList?.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-action]");
          if (!btn) return;
          const idx = parseInt(btn.dataset.idx, 10);
          const action = btn.dataset.action;
          if (Number.isNaN(idx)) return;
          if (action === "removeGallery") {
            gallery.splice(idx, 1);
            if (heroIndex === idx) heroIndex = Math.max(0, gallery.length - 1);
            if (heroIndex > idx) heroIndex -= 1;
            renderGallery();
          } else if (action === "moveUp" && idx > 0) {
            [gallery[idx - 1], gallery[idx]] = [gallery[idx], gallery[idx - 1]];
            if (heroIndex === idx) heroIndex = idx - 1;
            else if (heroIndex === idx - 1) heroIndex = idx;
            renderGallery();
          } else if (action === "moveDown" && idx < gallery.length - 1) {
            [gallery[idx + 1], gallery[idx]] = [gallery[idx], gallery[idx + 1]];
            if (heroIndex === idx) heroIndex = idx + 1;
            else if (heroIndex === idx + 1) heroIndex = idx;
            renderGallery();
          }
        });
        // ===== Variants UI =====
        const variantsList = document.getElementById("variants-list");
        const addVariantBtn = document.getElementById("add-variant-btn");
        let variantRowUid = 0;

        function addVariantRow(v = {}) {
          const uid = ++variantRowUid;
          const row = document.createElement("div");
          row.className = "variant-row border rounded-lg p-3";
          row.innerHTML = `
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label required">نام واریانت</label>
              <input type="text" name="variantName" class="admin-form-input" value="${v.variantName || ""}" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">SKU</label>
              <input type="text" name="sku" class="admin-form-input" value="${v.sku || ""}" />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">قیمت اختصاصی (تومان)</label>
              <input type="number" name="price" class="admin-form-input" min="0" value="${typeof v.price === "number" ? v.price : ""}" />
              <small class="text-gray-500">خالی = از قیمت محصول</small>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">موجودی</label>
              <input type="number" name="stock" class="admin-form-input" min="0" value="${typeof v.stock === "number" ? v.stock : 0}" />
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">نام رنگ</label>
              <input type="text" name="colorName" class="admin-form-input" value="${v.colorName || ""}" />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">کد رنگ</label>
              <div class="flex items-center gap-2">
                <input type="color" class="variant-hex-picker" id="variant-hex-picker-${uid}" value="${v.colorHexCode || "#ffffff"}">
                <input type="text" name="colorHexCode" class="admin-form-input variant-hex-input" placeholder="#RRGGBB" value="${v.colorHexCode || ""}" />
              </div>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">وضعیت</label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" class="w-4 h-4" ${v.isActive === false ? "" : "checked"} />
                <span>فعال</span>
              </label>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">&nbsp;</label>
              <button type="button" class="admin-btn admin-btn-danger w-full remove-variant-btn">
                <i data-feather="trash-2"></i>
                حذف واریانت
              </button>
            </div>
          </div>
        `;

          // Sync color picker <-> text input
          const hexPicker = row.querySelector(`#variant-hex-picker-${uid}`);
          const hexInput = row.querySelector(".variant-hex-input");
          hexPicker?.addEventListener("input", (e) => {
            hexInput.value = e.target.value;
          });
          hexInput?.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
              hexPicker.value = val;
            }
          });

          // Remove row
          row
            .querySelector(".remove-variant-btn")
            ?.addEventListener("click", () => {
              row.remove();
            });

          variantsList.appendChild(row);
          utils.refreshIcons();
        }

        // Prefill existing variants on edit
        if (isEdit && Array.isArray(data.variants) && data.variants.length) {
          data.variants.forEach((v) => addVariantRow(v));
        }

        // Add empty row for convenience on create
        if (!isEdit && variantsList && variantsList.children.length === 0) {
          addVariantRow();
        }

        addVariantBtn?.addEventListener("click", () => addVariantRow());

        // Form submit handler
        document
          .getElementById("product-form")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submit-product-btn");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML =
              '<i data-feather="loader" class="animate-spin"></i> در حال ذخیره...';
            utils.refreshIcons();

            try {
              const heroImageUrl = gallery[heroIndex]?.url || null;
              const formData = new FormData(e.target);

              // Helper functions
              const getStringValue = (key) => {
                const val = formData.get(key);
                if (val === null || val === undefined) return undefined;
                const str = val.toString().trim();
                return str === "" ? undefined : str;
              };

              const getNumberValue = (key) => {
                const str = getStringValue(key);
                if (str === undefined) return undefined;
                const num = parseInt(str, 10);
                return isNaN(num) ? undefined : num;
              };

              // Build payload
              const payload = {};

              // Required fields
              const title = getStringValue("title");
              const brandId = getStringValue("brandId");
              const price = getNumberValue("price");

              if (!title) throw new Error("عنوان محصول الزامی است.");
              if (!brandId) throw new Error("انتخاب برند الزامی است.");
              if (!price || price <= 0)
                throw new Error(
                  "قیمت محصول الزامی است و باید بیشتر از صفر باشد."
                );

              payload.title = title;
              payload.brandId = brandId;
              payload.price = price;

              // Optional fields
              const subtitle = getStringValue("subtitle");
              const slug = getStringValue("slug");
              const description = getStringValue("description");
              const ingredients = getStringValue("ingredients");
              const howToUse = getStringValue("howToUse");
              const internalNotes = getStringValue("internalNotes");
              const collectionId = getStringValue("collectionId");
              const colorThemeId = getStringValue("colorThemeId");
              const categoryId = getStringValue("categoryId");
              if (!categoryId) throw new Error("انتخاب دسته‌بندی الزامی است.");
              payload.categoryId = categoryId;

              // Keep legacy enum for backend compatibility (maps DB value -> ENUM e.g., skincare -> SKINCARE)
              const selCat = (state.categories || []).find(
                (c) => c.id === categoryId
              );
              if (selCat && selCat.value) {
                const enumVal = String(selCat.value)
                  .trim()
                  .toUpperCase()
                  .replace(/[^A-Z0-9]+/g, "_");
                payload.category = enumVal;
              }
              if (subtitle) payload.subtitle = subtitle;
              if (slug) payload.slug = slug;
              if (description) payload.description = description;
              if (ingredients) payload.ingredients = ingredients;
              if (howToUse) payload.howToUse = howToUse;
              if (internalNotes) payload.internalNotes = internalNotes;
              if (collectionId) payload.collectionId = collectionId;
              if (colorThemeId) payload.colorThemeId = colorThemeId;
              if (typeof categoryId !== "undefined") {
                payload.categoryId = categoryId || null;
              }

              const compareAtPrice = getNumberValue("compareAtPrice");
              if (compareAtPrice !== undefined && compareAtPrice > 0) {
                payload.compareAtPrice = compareAtPrice;
              }

              // Boolean fields
              payload.isActive = formData.get("isActive") === "on";
              payload.isFeatured = formData.get("isFeatured") === "on";
              payload.isBestseller = formData.get("isBestseller") === "on";
              payload.isSpecialProduct =
                formData.get("isSpecialProduct") === "on";

              // Related products
              const relatedSelect = document.getElementById(
                "related-products-select"
              );
              if (relatedSelect) {
                const selectedIds = Array.from(relatedSelect.selectedOptions)
                  .map((o) => o.value)
                  .filter((id) => id && (!data.id || id !== data.id));
                payload.relatedProductIds = selectedIds;
              }

              // Images (gallery) + hero
              if (gallery.length > 0) {
                payload.images = gallery.map((img, idx) => ({
                  url: img.url,
                  alt: img.alt || undefined,
                  position: idx,
                }));
              }
              if (heroImageUrl) {
                payload.heroImageUrl = heroImageUrl;
              }
              // Collect variants
              const variantRows = Array.from(
                document.querySelectorAll(".variant-row")
              );
              const variantsPayload = [];
              for (let i = 0; i < variantRows.length; i++) {
                const row = variantRows[i];
                const get = (sel) => row.querySelector(sel);
                const variantName = get(
                  'input[name="variantName"]'
                )?.value?.trim();
                if (!variantName) continue; // skip incomplete rows
                const sku = get('input[name="sku"]')?.value?.trim();
                const priceStr = get('input[name="price"]')?.value;
                const stockStr = get('input[name="stock"]')?.value;
                const colorName = get('input[name="colorName"]')?.value?.trim();
                const colorHexCode = get(
                  'input[name="colorHexCode"]'
                )?.value?.trim();
                const isActive = get('input[name="isActive"]')?.checked ?? true;

                const v = {
                  variantName,
                  ...(sku ? { sku } : {}),
                  ...(priceStr ? { price: parseInt(priceStr, 10) } : {}),
                  ...(stockStr
                    ? { stock: parseInt(stockStr, 10) }
                    : { stock: 0 }),
                  ...(colorName ? { colorName } : {}),
                  ...(colorHexCode && /^#[0-9A-Fa-f]{6}$/.test(colorHexCode)
                    ? { colorHexCode }
                    : {}),
                  isActive,
                  position: i,
                };
                variantsPayload.push(v);
              }
              if (variantsPayload.length > 0) {
                payload.variants = variantsPayload;
              }

              // Badges
              const selectedBadges = Array.from(
                document.querySelectorAll('input[name="badges"]:checked')
              ).map((cb) => cb.value);

              payload.badgeIds = selectedBadges;


              if (isEdit) {
                await api.updateProduct(productId, payload);
                utils.showToast("محصول با موفقیت ویرایش شد", "success");
              } else {
                await api.createProduct(payload);
                utils.showToast("محصول با موفقیت افزوده شد", "success");
              }

              panel.close();
              handlers.products();
            } catch (error) {
              console.error("Product save error:", error);
              utils.showToast("خطا: " + error.message, "error");
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
              utils.refreshIcons();
            }
          });

        utils.refreshIcons();
      } catch (error) {
        console.error("Product form error:", error);
        panel.open(
          utils.showError(error.message || "خطا در بارگذاری فرم"),
          "خطا"
        );
      }
    },
    category(categoryId = null) {
      const cat = categoryId
        ? (state.categories || []).find((c) => c.id === categoryId)
        : null;
      const isEdit = !!categoryId;
      const formHtml = `
        <form id="category-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">${isEdit ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}</h3>
            <div class="admin-form-group">
              <label class="admin-form-label required">مقدار (slug)</label>
              <input type="text" name="value" class="admin-form-input" value="${cat?.value || ""}" placeholder="مثال: skincare (در صورت خالی، از عنوان ساخته می‌شود)" />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label required">عنوان/برچسب</label>
              <input type="text" name="label" class="admin-form-input" value="${cat?.label || ""}" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">آیکون (Feather)</label>
              <div class="flex items-center gap-3">
                <i id="cat-icon-preview" data-feather="${cat?.icon || "grid"}" class="w-6 h-6 text-rose-600"></i>
                <input type="text" name="icon" class="admin-form-input" value="${cat?.icon || "grid"}" placeholder="shield, pen-tool, wind ..." />
              </div>
              <small class="text-gray-500">نام آیکون Feather را وارد کنید. لیست: feathericons.com</small>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">تصویر قهرمان (Hero)</label>
              <!-- EXACTLY like product images: upload multiple, add URL, manage gallery and pick hero -->
              <div class="admin-form-group">
                <label class="admin-form-label">آپلود تصاویر</label>
                <input type="file" id="cat-gallery-files-input" class="admin-form-input" accept="image/*" multiple />
                <small class="text-gray-500">می‌توانید چند تصویر انتخاب کنید. فرمت‌های مجاز: JPG, PNG, WebP, GIF (حداکثر 5MB)</small>
              </div>

              <div class="admin-form-divider">
                <span>یا</span>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">افزودن با آدرس URL</label>
                <div class="flex items-center gap-2">
                  <input type="url" id="cat-gallery-url-input" class="admin-form-input flex-1" placeholder="https://example.com/image.jpg" />
                  <button type="button" id="cat-add-gallery-url-btn" class="admin-btn admin-btn-secondary">
                    <i data-feather="plus"></i>
                    افزودن
                  </button>
                </div>
              </div>

              <div id="cat-gallery-list" class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3"></div>

              <div class="admin-form-divider">
                <span>یا</span>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">آدرس URL مستقیم (اختیاری)</label>
                <input type="url" name="heroImageUrl" class="admin-form-input" value="${cat?.heroImageUrl || ""}" placeholder="اگر این فیلد پر شود، بر انتخاب گالری اولویت خواهد داشت" />
              </div>
            </div>
          </div>
          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">انصراف</button>
            <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}</button>
          </div>
        </form>
      `;
      panel.open(formHtml, isEdit ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی");
      utils.refreshIcons();
      // icon live preview
      const iconInput = document.querySelector('input[name="icon"]');
      const iconPreview = document.getElementById("cat-icon-preview");
      iconInput?.addEventListener("input", () => {
        const val = (iconInput.value || "").trim() || "grid";
        iconPreview?.setAttribute("data-feather", val);
        utils.refreshIcons();
      });

      // ===== Category gallery (EXACTLY like product images flow) =====
      const catGalleryInput = document.getElementById(
        "cat-gallery-files-input"
      );
      const catGalleryUrlInput = document.getElementById(
        "cat-gallery-url-input"
      );
      const catAddGalleryUrlBtn = document.getElementById(
        "cat-add-gallery-url-btn"
      );
      const catGalleryList = document.getElementById("cat-gallery-list");

      let catGallery = []; // [{ url, alt }]
      let catHeroIndex = 0;

      // Prefill if category has a hero image
      if (cat?.heroImageUrl) {
        catGallery = [{ url: cat.heroImageUrl, alt: "" }];
        catHeroIndex = 0;
      }

      function catRenderGallery() {
        if (!catGalleryList) return;
        if (!catGallery.length) {
          catGalleryList.innerHTML =
            '<div class="text-center text-gray-500 col-span-full py-6">تصویری اضافه نشده است</div>';
          utils.refreshIcons();
          return;
        }
        catGalleryList.innerHTML = catGallery
          .map(
            (img, idx) => `
            <div class="border rounded-lg p-2 flex flex-col gap-2" data-idx="${idx}">
              <img src="${img.url}" alt="${img.alt || ""}" class="w-full h-28 object-cover rounded" />
              <label class="flex items-center gap-2">
                <input type="radio" name="catHeroImage" value="${idx}" ${catHeroIndex === idx ? "checked" : ""} />
                <span class="text-sm">تصویر شاخص</span>
              </label>
              <input type="text" class="admin-form-input" data-role="alt" data-idx="${idx}" placeholder="متن جایگزین" value="${img.alt || ""}" />
              <div class="flex gap-2">
                <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="catMoveUp" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>
                  <i data-feather="arrow-up"></i>
                </button>
                <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="catMoveDown" data-idx="${idx}" ${idx === catGallery.length - 1 ? "disabled" : ""}>
                  <i data-feather="arrow-down"></i>
                </button>
                <button type="button" class="admin-btn admin-btn-danger" data-action="catRemoveGallery" data-idx="${idx}">
                  <i data-feather="trash-2"></i>
                </button>
              </div>
            </div>
          `
          )
          .join("");
        utils.refreshIcons();
      }
      catRenderGallery();

      // Upload multiple files (use same method as product)
      catGalleryInput?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          try {
            const url = await utils.uploadImage(file);
            catGallery.push({ url, alt: "" });
          } catch (err) {
            utils.showToast(err.message, "error");
          }
        }
        if (catGallery.length && (catHeroIndex == null || catHeroIndex < 0))
          catHeroIndex = 0;
        catRenderGallery();
        catGalleryInput.value = "";
      });

      // Add by URL
      catAddGalleryUrlBtn?.addEventListener("click", () => {
        const url = (catGalleryUrlInput?.value || "").trim();
        if (!url) return;
        if (!(url.startsWith("/") || url.startsWith("http"))) {
          utils.showToast(
            "آدرس URL تصویر باید با / یا http شروع شود.",
            "error"
          );
          return;
        }
        catGallery.push({ url, alt: "" });
        if (catGallery.length === 1) catHeroIndex = 0;
        catGalleryUrlInput.value = "";
        catRenderGallery();
      });

      // Gallery interactions (hero select, alt edit, move/remove)
      catGalleryList?.addEventListener("change", (e) => {
        if (e.target.name === "catHeroImage") {
          catHeroIndex = parseInt(e.target.value, 10);
        }
      });
      catGalleryList?.addEventListener("input", (e) => {
        const inp = e.target.closest('input[data-role="alt"]');
        if (inp) {
          const idx = parseInt(inp.dataset.idx, 10);
          if (!isNaN(idx) && catGallery[idx]) catGallery[idx].alt = inp.value;
        }
      });
      catGalleryList?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx, 10);
        const action = btn.dataset.action;
        if (Number.isNaN(idx)) return;
        if (action === "catRemoveGallery") {
          catGallery.splice(idx, 1);
          if (catHeroIndex === idx)
            catHeroIndex = Math.max(0, catGallery.length - 1);
          if (catHeroIndex > idx) catHeroIndex -= 1;
          catRenderGallery();
        } else if (action === "catMoveUp" && idx > 0) {
          [catGallery[idx - 1], catGallery[idx]] = [
            catGallery[idx],
            catGallery[idx - 1],
          ];
          if (catHeroIndex === idx) catHeroIndex = idx - 1;
          else if (catHeroIndex === idx - 1) catHeroIndex = idx;
          catRenderGallery();
        } else if (action === "catMoveDown" && idx < catGallery.length - 1) {
          [catGallery[idx + 1], catGallery[idx]] = [
            catGallery[idx],
            catGallery[idx + 1],
          ];
          if (catHeroIndex === idx) catHeroIndex = idx + 1;
          else if (catHeroIndex === idx + 1) catHeroIndex = idx;
          catRenderGallery();
        }
      });
      document
        .getElementById("category-form")
        ?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = {
            value: String(fd.get("value") || "").trim() || undefined,
            label: String(fd.get("label") || "").trim(),
            icon: String(fd.get("icon") || "grid").trim() || "grid",
            // Prefer manual URL if provided; otherwise use selected hero from gallery
            heroImageUrl:
              String(fd.get("heroImageUrl") || "").trim() ||
              (catGallery[catHeroIndex]?.url || "").trim() ||
              undefined,
          };
          try {
            if (isEdit) {
              await api.updateCategory(categoryId, payload);
              utils.showToast("دسته‌بندی ویرایش شد", "success");
            } else {
              await api.createCategory(payload);
              utils.showToast("دسته‌بندی افزوده شد", "success");
            }
            panel.close();
            handlers.categories();
          } catch (err) {
            utils.showToast("خطا: " + err.message, "error");
          }
        });
    },
    // Add this new form method inside the `forms` object
    colorTheme(themeId = null) {
      const theme = themeId
        ? state.colorThemes.find((t) => t.id === themeId)
        : null;
      const isEdit = !!themeId;

      const formHtml = `
    <form id="colorTheme-form" class="admin-form">
      <div class="admin-form-section">
        <h3 class="admin-form-section-title">اطلاعات تم رنگی</h3>
        <div class="admin-form-group">
          <label class="admin-form-label required">نام</label>
          <input type="text" name="name" class="admin-form-input" value="${theme?.name || ""}" required />
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">اسلاگ (URL)</label>
          <input type="text" name="slug" class="admin-form-input" value="${theme?.slug || ""}" />
          <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">کد رنگ Hex</label>
          <div class="flex items-center gap-2">
              <input type="color" id="hex-color-picker" value="${theme?.hexCode || "#ffffff"}">
              <input type="text" name="hexCode" id="hex-color-input" class="admin-form-input" value="${theme?.hexCode || ""}" placeholder="#RRGGBB" />
          </div>
        </div>
      </div>
      <div class="admin-form-actions">
        <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">انصراف</button>
        <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? "ذخیره تغییرات" : "افزودن تم رنگی"}</button>
      </div>
    </form>
  `;

      panel.open(formHtml, isEdit ? "ویرایش تم رنگی" : "افزودن تم رنگی");

      // Link color picker and text input
      const colorPicker = document.getElementById("hex-color-picker");
      const colorInput = document.getElementById("hex-color-input");
      colorPicker.addEventListener(
        "input",
        (e) => (colorInput.value = e.target.value)
      );
      colorInput.addEventListener(
        "input",
        (e) => (colorPicker.value = e.target.value)
      );

      document
        .getElementById("colorTheme-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const payload = {
            name: formData.get("name"),
            slug: formData.get("slug") || undefined,
            hexCode: formData.get("hexCode") || undefined,
          };

          try {
            if (isEdit) {
              await api.updateColorTheme(themeId, payload);
              utils.showToast("تم رنگی با موفقیت ویرایش شد", "success");
            } else {
              await api.createColorTheme(payload);
              utils.showToast("تم رنگی با موفقیت افزوده شد", "success");
            }
            panel.close();
            handlers.colorThemes();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });
    },

    // User Form
    async user(userId) {
      panel.showLoading();

      try {
        const users = await api.getUsers();
        const user = users.users.find((u) => u.id === userId);

        if (!user) {
          throw new Error("کاربر یافت نشد");
        }

        const formHtml = `
          <form id="user-form" class="admin-form">
            <div class="admin-form-section">
              <h3 class="admin-form-section-title">اطلاعات کاربر</h3>

              <div class="admin-form-group">
                <label class="admin-form-label">ایمیل</label>
                <input type="email" class="admin-form-input" value="${user.email}" disabled />
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">نام</label>
                <input type="text" class="admin-form-input" value="${user.firstName || ""} ${user.lastName || ""}" disabled />
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">تلفن</label>
                <input type="text" class="admin-form-input" value="${user.phone || "-"}" disabled />
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">تعداد سفارش‌ها</label>
                  <input type="text" class="admin-form-input" value="${user._count?.orders || 0}" disabled />
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">تعداد نظرات</label>
                  <input type="text" class="admin-form-input" value="${user._count?.productReviews || 0}" disabled />
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label required">نقش</label>
                <select name="role" class="admin-form-input" required>
                  <option value="CUSTOMER" ${user.role === "CUSTOMER" ? "selected" : ""}>مشتری</option>
                  <option value="STAFF" ${user.role === "STAFF" ? "selected" : ""}>کارمند</option>
                  <option value="ADMIN" ${user.role === "ADMIN" ? "selected" : ""}>ادمین</option>
                </select>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label required">سطح</label>
                <select name="tier" class="admin-form-input" required>
                  <option value="STANDARD" ${user.customerTier === "STANDARD" ? "selected" : ""}>عادی</option>
                  <option value="VIP" ${user.customerTier === "VIP" ? "selected" : ""}>VIP</option>
                </select>
              </div>
            </div>

            <div class="admin-form-actions">
              <button type="button" class="admin-btn admin-btn-danger" data-action="deleteUserConfirm" data-id="${userId}">
                <i data-feather="trash-2" class="w-4 h-4"></i>
                حذف کاربر
              </button>
              <div class="flex-1"></div>
              <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
                انصراف
              </button>
              <button type="submit" class="admin-btn admin-btn-primary">
                ذخیره تغییرات
              </button>
            </div>
          </form>
        `;

        panel.open(formHtml, "ویرایش کاربر");

        document
          .getElementById("user-form")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
              await api.updateUserRole(userId, formData.get("role"));
              await api.updateUserTier(userId, formData.get("tier"));
              utils.showToast("کاربر با موفقیت ویرایش شد", "success");
              panel.close();
              handlers.users();
            } catch (error) {
              utils.showToast("خطا: " + error.message, "error");
            }
          });

        utils.refreshIcons();
      } catch (error) {
        panel.open(utils.showError(error.message), "خطا");
      }
    },
    // Order Detail Panel
    async orderDetail(orderId) {
      panel.showLoading();

      try {
        const response = await api.getById(orderId);
        const order = response.order || response;
        const statusOptions = [
          { value: "DRAFT", label: "پیش‌نویس" },
          { value: "AWAITING_PAYMENT", label: "در انتظار پرداخت" },
          { value: "PAID", label: "پرداخت شده" },
          { value: "PROCESSING", label: "در حال پردازش" },
          { value: "SHIPPED", label: "ارسال شده" },
          { value: "DELIVERED", label: "تحویل شده" },
          { value: "CANCELLED", label: "لغو شده" },
          { value: "RETURNED", label: "مرجوع شده" },
        ];

        const shippingMethodLabels = {
          standard: "عادی",
          express: "فوری",
        };

        const paymentMethodLabels = {
          gateway: "درگاه پرداخت",
          cod: "پرداخت در محل",
        };

        const genderLabels = {
          MALE: "مرد",
          FEMALE: "زن",
          UNDISCLOSED: "نامشخص",
        };

        const itemsHtml = (order.items || [])
          .map(
            (item) => `
      <div class="flex gap-4 p-3 border rounded-lg">
        <img src="${item.imageUrl || "/assets/images/product.png"}" alt="${item.title}" class="w-16 h-16 rounded object-cover" />
        <div class="flex-1">
          <h5 class="font-semibold">${item.title}</h5>
          ${item.variantName ? `<p class="text-sm text-gray-600">${item.variantName}</p>` : ""}
          <p class="text-sm text-gray-600">تعداد: ${utils.toFa(item.quantity)} × ${utils.toIRR(item.unitPrice)}</p>
          <p class="text-sm font-semibold text-primary">${utils.toIRR(item.lineTotal)}</p>
        </div>
      </div>
    `
          )
          .join("");

        const paymentsHtml = (order.payments || [])
          .map(
            (payment) => `
      <div class="p-3 border rounded-lg">
        <div class="flex justify-between items-start mb-2">
          <span class="font-semibold">${paymentMethodLabels[payment.method] || payment.method}</span>
          <span class="admin-badge-${payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "danger" : "warning"}">
            ${payment.status === "PAID" ? "پرداخت شده" : payment.status === "FAILED" ? "ناموفق" : "در انتظار"}
          </span>
        </div>
        <p class="text-sm text-gray-600">مبلغ: ${utils.toIRR(payment.amount)}</p>
        ${payment.transactionRef ? `<p class="text-sm text-gray-600">شناسه تراکنش: ${payment.transactionRef}</p>` : ""}
        ${payment.authority ? `<p class="text-sm text-gray-600">Authority: ${payment.authority}</p>` : ""}
        <p class="text-sm text-gray-500">تاریخ: ${utils.formatDateTime(payment.createdAt)}</p>
      </div>
    `
          )
          .join("");

        const formHtml = `
      <form id="order-detail-form" class="admin-form">
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">اطلاعات سفارش</h3>

          <div class="admin-form-group">
            <label class="admin-form-label">شماره سفارش</label>
            <input type="text" class="admin-form-input" value="${order.orderNumber}" disabled />
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">تاریخ ثبت</label>
              <input type="text" class="admin-form-input" value="${utils.formatDateTime(order.createdAt)}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">تاریخ تحویل</label>
              <input type="text" class="admin-form-input" value="${order.placedAt ? utils.formatDateTime(order.placedAt) : "-"}" disabled />
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">وضعیت سفارش</label>
            <select name="status" class="admin-form-input">
              ${statusOptions
            .map(
              (opt) => `
                <option value="${opt.value}" ${order.status === opt.value ? "selected" : ""}>
                  ${opt.label}
                </option>
              `
            )
            .join("")}
            </select>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">روش ارسال</label>
              <input type="text" class="admin-form-input" value="${shippingMethodLabels[order.shippingMethod] || order.shippingMethod || "-"}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">روش پرداخت</label>
              <input type="text" class="admin-form-input" value="${paymentMethodLabels[order.paymentMethod] || order.paymentMethod || "-"}" disabled />
            </div>
          </div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">اطلاعات مشتری</h3>

          <div class="admin-form-group">
            <label class="admin-form-label">ایمیل</label>
            <input type="text" class="admin-form-input" value="${order.email || "-"}" disabled />
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">تاریخ تولد</label>
              <input type="text" class="admin-form-input" value="${order.birthDate ? utils.formatDate(order.birthDate) : "-"}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">جنسیت</label>
              <input type="text" class="admin-form-input" value="${genderLabels[order.gender] || "-"}" disabled />
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">سطح مشتری</label>
            <input type="text" class="admin-form-input" value="${order.customerTier || "-"}" disabled />
          </div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">آدرس ارسال</h3>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">نام</label>
              <input type="text" class="admin-form-input" value="${order.shippingFirstName || "-"}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">نام خانوادگی</label>
              <input type="text" class="admin-form-input" value="${order.shippingLastName || "-"}" disabled />
            </div>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">استان</label>
              <input type="text" class="admin-form-input" value="${order.shippingProvince || "-"}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">شهر</label>
              <input type="text" class="admin-form-input" value="${order.shippingCity || "-"}" disabled />
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">آدرس</label>
            <textarea class="admin-form-input" rows="2" disabled>${order.shippingAddressLine1 || "-"}</textarea>
          </div>

          ${order.shippingAddressLine2
            ? `
          <div class="admin-form-group">
            <label class="admin-form-label">جزئیات آدرس</label>
            <textarea class="admin-form-input" rows="2" disabled>${order.shippingAddressLine2}</textarea>
          </div>
          `
            : ""
          }

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">تلفن</label>
              <input type="text" class="admin-form-input" value="${order.shippingPhone || "-"}" disabled />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">کد پستی</label>
              <input type="text" class="admin-form-input" value="${order.shippingPostalCode || "-"}" disabled />
            </div>
          </div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">محصولات</h3>
          <div class="space-y-3">
            ${itemsHtml || '<p class="text-gray-500 text-center py-4">محصولی وجود ندارد</p>'}
          </div>
        </div>

        ${order.payments && order.payments.length
            ? `
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">پرداخت‌ها</h3>
          <div class="space-y-3">
            ${paymentsHtml}
          </div>
        </div>
        `
            : ""
          }

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">مالی</h3>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span>جمع محصولات:</span>
              <span class="font-semibold">${utils.toIRR(order.subtotal)}</span>
            </div>

            ${order.discountTotal > 0
            ? `
            <div class="flex justify-between text-green-600">
              <span>تخفیف:</span>
              <span class="font-semibold">- ${utils.toIRR(order.discountTotal)}</span>
            </div>
            `
            : ""
          }

            <div class="flex justify-between">
              <span>هزینه ارسال:</span>
              <span class="font-semibold">${order.shippingTotal > 0 ? utils.toIRR(order.shippingTotal) : "رایگان"}</span>
            </div>

            ${order.giftWrapTotal > 0
            ? `
            <div class="flex justify-between">
              <span>بسته‌بندی هدیه:</span>
              <span class="font-semibold">${utils.toIRR(order.giftWrapTotal)}</span>
            </div>
            `
            : ""
          }

            <div class="flex justify-between pt-2 border-t text-lg">
              <span class="font-bold">مجموع:</span>
              <span class="font-bold text-primary">${utils.toIRR(order.total)}</span>
            </div>
          </div>

          ${order.giftWrap
            ? `
          <div class="mt-4 p-3 bg-pink-50 rounded-lg">
            <p class="text-sm font-semibold text-pink-800">🎁 بسته‌بندی هدیه فعال است</p>
          </div>
          `
            : ""
          }
        </div>

        ${order.note
            ? `
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">یادداشت مشتری</h3>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-gray-700">${order.note}</p>
          </div>
        </div>
        `
            : ""
          }

        <div class="admin-form-actions">
          <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
            بستن
          </button>
          <button type="submit" class="admin-btn admin-btn-primary">
            بروزرسانی وضعیت
          </button>
        </div>
      </form>
    `;

        panel.open(formHtml, `جزئیات سفارش ${order.orderNumber}`);

        // Handle status update
        document
          .getElementById("order-detail-form")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newStatus = formData.get("status");

            if (newStatus === order.status) {
              utils.showToast("وضعیت تغییری نکرده است", "info");
              return;
            }

            try {
              await api.updateOrderStatus(orderId, newStatus);
              utils.showToast("وضعیت سفارش بروزرسانی شد", "success");
              panel.close();
              handlers.orders();
            } catch (error) {
              utils.showToast("خطا: " + error.message, "error");
            }
          });

        utils.refreshIcons();
      } catch (error) {
        panel.open(utils.showError(error.message), "خطا");
      }
    },
    // Magazine Form
    async magazine(postId = null) {
      panel.showLoading();

      try {
        const [authorsResponse, tagsResponse, postsResponse] =
          await Promise.all([
            api.getMagazineAuthors(),
            api.getMagazineTags(),
            api.getMagazinePosts({
              page: 1,
              pageSize: 100,
              onlyPublished: false,
            }),
          ]);

        const authors = authorsResponse?.data || authorsResponse || [];
        const tags = tagsResponse?.data || tagsResponse || [];
        const allPosts =
          postsResponse?.items || postsResponse?.data?.items || [];

        let post = null;
        if (postId) {
          try {
            const postData = await api.getMagazinePost(postId);
            post = postData.data || postData;
          } catch (error) {
            console.error("Error fetching post:", error);
            throw new Error("خطا در بارگذاری اطلاعات مقاله");
          }
        }

        const isEdit = !!postId;
        const data = post || {};
        const existingRelatedIds = Array.isArray(data.related)
          ? data.related.map((r) => r.id)
          : [];

        const formHtml = `
      <form id="magazine-form" class="admin-form" enctype="multipart/form-data">
        <input type="hidden" name="id" value="${data.id || ""}" />

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">اطلاعات مقاله</h3>

          <div class="admin-form-group">
            <label class="admin-form-label required">عنوان</label>
            <input type="text" name="title" class="admin-form-input" value="${data.title || ""}" required />
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">اسلاگ (URL)</label>
            <input type="text" name="slug" class="admin-form-input" value="${data.slug || ""}" />
            <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">نویسنده</label>
            <select name="authorId" class="admin-form-input">
              <option value="">هیچکدام</option>
              ${Array.isArray(authors)
            ? authors
              .map(
                (a) => `
                <option value="${a.id}" ${data.authorId === a.id ? "selected" : ""}>
                  ${a.name}
                </option>
              `
              )
              .join("")
            : ""
          }
            </select>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label required">دسته‌بندی</label>
            <select name="category" class="admin-form-input" required>
              <option value="GUIDE" ${data.category === "GUIDE" ? "selected" : ""}>راهنما</option>
              <option value="TUTORIAL" ${data.category === "TUTORIAL" ? "selected" : ""}>آموزش</option>
              <option value="TRENDS" ${data.category === "TRENDS" ? "selected" : ""}>ترندها</option>
              <option value="LIFESTYLE" ${data.category === "LIFESTYLE" ? "selected" : ""}>سبک زندگی</option>
              <option value="GENERAL" ${data.category === "GENERAL" ? "selected" : ""}>عمومی</option>
            </select>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">خلاصه</label>
            <textarea name="excerpt" class="admin-form-input" rows="3">${data.excerpt || ""}</textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label required">محتوا</label>
            <textarea name="content" class="admin-form-input" rows="10" required>${data.content || ""}</textarea>
          </div>
        </div>

        <div class="admin-form-section">
          <h3 class="admin-form-section-title">تصویر شاخص</h3>

          ${data.heroImageUrl
            ? `
            <div class="admin-form-group">
              <label class="admin-form-label">تصویر فعلی</label>
              <div class="admin-image-preview">
                <img src="${data.heroImageUrl}" alt="Current hero image" id="current-hero-preview" />
              </div>
            </div>
          `
            : ""
          }

          <div class="admin-form-group">
            <label class="admin-form-label">آپلود تصویر جدید</label>
            <input type="file" name="heroImageFile" id="hero-image-input" class="admin-form-input" accept="image/*" />
            <small class="text-gray-500">فرمت‌های مجاز: JPG, PNG, WebP (حداکثر 5MB)</small>
          </div>

          <div id="new-hero-preview" class="admin-image-preview" style="display: none;">
            <img src="" alt="Preview" id="new-hero-preview-img" />
            <button type="button" class="admin-btn-remove-preview" id="remove-hero-preview-btn">
              <i data-feather="x"></i>
              حذف
            </button>
          </div>

          <div class="admin-form-divider">
            <span>یا</span>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">آدرس URL تصویر</label>
            <input type="url" name="heroImageUrl" id="hero-url-input" class="admin-form-input" value="${data.heroImageUrl || ""}" placeholder="https://example.com/image.jpg" />
            <small class="text-gray-500">در صورت آپلود فایل، این فیلد نادیده گرفته می‌شود</small>
          </div>
        </div>
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">مقالات مرتبط</h3>
          <div class="admin-form-group">
            <label class="admin-form-label">انتخاب مقالات مرتبط</label>
            <select name="relatedPostIds" id="related-posts-select" class="admin-form-input" multiple size="8">
              ${Array.isArray(allPosts)
            ? allPosts
              .filter((p) => !data.id || p.id !== data.id)
              .map(
                (p) => `
                <option value="${p.id}" ${existingRelatedIds.includes(p.id) ? "selected" : ""}>
                  ${p.title}
                </option>`
              )
              .join("")
            : ""
          }
            </select>
            <small class="text-gray-500">برای انتخاب چند مورد، کلید Ctrl/⌘ را نگه دارید.</small>
          </div>
        </div>
        <div class="admin-form-section">
          <h3 class="admin-form-section-title">تنظیمات اضافی</h3>

          <div class="admin-form-group">
            <label class="admin-form-label">زمان خواندن (دقیقه)</label>
            <input type="number" name="readTimeMinutes" class="admin-form-input" value="${data.readTimeMinutes || ""}" />
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">تاریخ انتشار</label>
            <input type="datetime-local" name="publishedAt" class="admin-form-input" value="${utils.toInputDateTime(data.publishedAt)}" />
          </div>

          <div class="admin-form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isPublished" class="w-4 h-4" ${data.isPublished !== false ? "checked" : ""} />
              <span>منتشر شده</span>
            </label>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">برچسب‌ها (با کاما جدا کنید)</label>
            <input type="text" name="tags" class="admin-form-input" value="${data.tags?.map((t) => t.tag?.name || t.name).join(", ") || ""}" />
            ${Array.isArray(tags) && tags.length
            ? `
              <small class="text-gray-500">برچسب‌های موجود: ${tags.map((t) => t.name).join(", ")}</small>
            `
            : ""
          }
          </div>
        </div>

        <div class="admin-form-actions">
          <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
            انصراف
          </button>
          <button type="submit" class="admin-btn admin-btn-primary" id="submit-magazine-btn">
            ${isEdit ? "ذخیره تغییرات" : "افزودن مقاله"}
          </button>
        </div>
      </form>
    `;

        panel.open(formHtml, isEdit ? "ویرایش مقاله" : "افزودن مقاله");

        const fileInput = document.getElementById("hero-image-input");
        const newPreview = document.getElementById("new-hero-preview");
        const newPreviewImg = document.getElementById("new-hero-preview-img");
        const removePreviewBtn = document.getElementById(
          "remove-hero-preview-btn"
        );
        const urlInput = document.getElementById("hero-url-input");

        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              alert("حجم فایل نباید بیشتر از 5 مگابایت باشد.");
              fileInput.value = "";
              return;
            }

            const validTypes = [
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/webp",
              "image/gif",
            ];
            if (!validTypes.includes(file.type)) {
              alert("فقط فایل‌های تصویری (JPG, PNG, WebP, GIF) مجاز هستند.");
              fileInput.value = "";
              return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
              newPreviewImg.src = event.target.result;
              newPreview.style.display = "block";
              urlInput.value = "";
            };
            reader.readAsDataURL(file);
          }
        });

        removePreviewBtn?.addEventListener("click", () => {
          fileInput.value = "";
          newPreview.style.display = "none";
          newPreviewImg.src = "";
        });

        document
          .getElementById("magazine-form")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submit-magazine-btn");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML =
              '<i data-feather="loader" class="animate-spin"></i> در حال ذخیره...';
            utils.refreshIcons();

            try {
              const formData = new FormData(e.target);
              const imageFile = formData.get("heroImageFile");

              let heroImageUrl = null;

              if (imageFile && imageFile.size > 0) {
                try {
                  heroImageUrl = await utils.uploadImage(imageFile);
                } catch (uploadError) {
                  throw new Error("خطا در آپلود تصویر: " + uploadError.message);
                }
              } else {
                const urlValue = formData.get("heroImageUrl");
                if (urlValue && typeof urlValue === "string") {
                  const trimmedUrl = urlValue.trim();
                  if (trimmedUrl !== "") {
                    heroImageUrl = trimmedUrl;
                  } else if (isEdit && data.heroImageUrl) {
                    heroImageUrl = data.heroImageUrl;
                  }
                } else if (isEdit && data.heroImageUrl) {
                  heroImageUrl = data.heroImageUrl;
                }
              }

              const tagsInput = formData.get("tags");
              const tagsArray = tagsInput
                ? tagsInput
                  .toString()
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                : [];

              const authorIdValue = formData.get("authorId");
              const authorId =
                authorIdValue && authorIdValue !== "" ? authorIdValue : null;

              const payload = {
                title: formData.get("title"),
                category: formData.get("category"),
                content: formData.get("content"),
                authorId: authorId,
                isPublished: formData.get("isPublished") === "on",
              };

              const slug = formData.get("slug");
              if (slug && slug.toString().trim() !== "") {
                payload.slug = slug.toString().trim();
              }

              const excerpt = formData.get("excerpt");
              if (excerpt && excerpt.toString().trim() !== "") {
                payload.excerpt = excerpt.toString().trim();
              }

              if (heroImageUrl) {
                payload.heroImageUrl = heroImageUrl;
              }

              const readTimeMinutes = formData.get("readTimeMinutes");
              if (readTimeMinutes && readTimeMinutes !== "") {
                payload.readTimeMinutes = parseInt(readTimeMinutes);
              }

              const publishedAt = formData.get("publishedAt");
              if (publishedAt && publishedAt !== "") {
                payload.publishedAt = new Date(publishedAt).toISOString();
              }

              if (tagsArray.length) {
                payload.tags = tagsArray;
              }

              // Related posts
              const relatedSelect = document.getElementById(
                "related-posts-select"
              );
              if (relatedSelect) {
                const selectedIds = Array.from(relatedSelect.selectedOptions)
                  .map((o) => o.value)
                  .filter((id) => id && (!data.id || id !== data.id));
                payload.relatedPostIds = selectedIds;
              }


              if (isEdit) {
                await api.updateMagazinePost(postId, payload);
                utils.showToast("مقاله با موفقیت ویرایش شد", "success");
              } else {
                await api.createMagazinePost(payload);
                utils.showToast("مقاله با موفقیت افزوده شد", "success");
              }

              panel.close();
              handlers.magazine();
            } catch (error) {
              console.error("Magazine save error:", error);
              utils.showToast("خطا: " + error.message, "error");
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
              utils.refreshIcons();
            }
          });

        utils.refreshIcons();
      } catch (error) {
        console.error("Magazine form error:", error);
        panel.open(
          utils.showError(error.message || "خطا در بارگذاری فرم"),
          "خطا"
        );
      }
    },

    // Newsletter Form
    newsletter() {
      const formHtml = `
        <form id="newsletter-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">ایجاد خبرنامه</h3>

            <div class="admin-form-group">
              <label class="admin-form-label required">عنوان ایمیل</label>
              <input type="text" name="subject" class="admin-form-input" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label required">محتوای HTML</label>
              <textarea name="htmlContent" class="admin-form-input" rows="15" required placeholder="<h1>سلام!</h1><p>محتوای خبرنامه...</p>"></textarea>
              <small class="text-gray-500">از تگ‌های HTML استفاده کنید</small>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">محتوای متنی (اختیاری)</label>
              <textarea name="textContent" class="admin-form-input" rows="5" placeholder="نسخه متنی برای ایمیل کلاینت‌هایی که HTML نمایش نمی‌دهند"></textarea>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">ایمیل تستی</label>
              <input type="email" name="testEmail" class="admin-form-input" placeholder="برای ارسال تست، ایمیل خود را وارد کنید" />
              <small class="text-gray-500">برای ارسال به همه مشترکین، این فیلد را خالی بگذارید</small>
            </div>
          </div>

          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
              انصراف
            </button>
            <button type="submit" class="admin-btn admin-btn-primary">
              <i data-feather="send" class="w-4 h-4"></i>
              ارسال خبرنامه
            </button>
          </div>
        </form>
      `;

      panel.open(formHtml, "ایجاد خبرنامه");

      document
        .getElementById("newsletter-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const payload = {
            subject: formData.get("subject"),
            htmlContent: formData.get("htmlContent"),
            textContent: formData.get("textContent") || undefined,
            testEmail: formData.get("testEmail") || undefined,
          };

          if (
            !payload.testEmail &&
            !confirm("آیا مطمئن هستید که می‌خواهید به همه مشترکین ارسال کنید؟")
          ) {
            return;
          }

          try {
            const result = await api.sendNewsletter(payload);
            utils.showToast(
              payload.testEmail
                ? "ایمیل تستی ارسال شد"
                : `خبرنامه برای ${result.sent} مشترک ارسال شد`,
              "success"
            );
            panel.close();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });

      utils.refreshIcons();
    },

    // Brand Form
    brand(brandId = null) {
      const brand = brandId ? state.brands.find((b) => b.id === brandId) : null;
      const isEdit = !!brandId;

      const formHtml = `
        <form id="brand-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">اطلاعات برند</h3>

            <div class="admin-form-group">
              <label class="admin-form-label required">نام برند</label>
              <input type="text" name="name" class="admin-form-input" value="${brand?.name || ""}" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">اسلاگ (URL)</label>
              <input type="text" name="slug" class="admin-form-input" value="${brand?.slug || ""}" />
              <small class="text-gray-500">خالی بگذارید تا خودکار ساخته شود</small>
            </div>
          </div>

          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
              انصراف
            </button>
            <button type="submit" class="admin-btn admin-btn-primary">
              ${isEdit ? "ذخیره تغییرات" : "افزودن برند"}
            </button>
          </div>
        </form>
      `;

      panel.open(formHtml, isEdit ? "ویرایش برند" : "افزودن برند");

      document
        .getElementById("brand-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const payload = {
            name: formData.get("name"),
            slug: formData.get("slug") || undefined,
          };

          try {
            if (isEdit) {
              await api.updateBrand(brandId, payload);
              utils.showToast("برند با موفقیت ویرایش شد", "success");
            } else {
              await api.createBrand(payload);
              utils.showToast("برند با موفقیت افزوده شد", "success");
            }
            panel.close();
            handlers.brands();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });
    },

    // Collection Form
    collection(collectionId = null) {
      const collection = collectionId
        ? state.collections.find((c) => c.id === collectionId)
        : null;
      const isEdit = !!collectionId;

      const formHtml = `
    <form id="collection-form" class="admin-form">
      <div class="admin-form-section">
        <h3 class="admin-form-section-title">اطلاعات کالکشن</h3>

        <div class="admin-form-group">
          <label class="admin-form-label required">نام کالکشن</label>
          <input type="text" name="name" class="admin-form-input" value="${collection?.name || ""}" required />
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">متن توضیحات (برای صفحه اصلی)</label>
          <textarea name="subtitle" class="admin-form-input" rows="3" placeholder="مثال: منتخب محصولات از کالکشن پاییزی">${collection?.subtitle || ""}</textarea>
          <small class="text-gray-500">این متن زیر عنوان کالکشن در صفحه اصلی نمایش داده می‌شود</small>
        </div>

        <div class="admin-form-group">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isFeatured" class="w-4 h-4" ${collection?.isFeatured ? "checked" : ""} />
            <span>نمایش در صفحه اصلی</span>
          </label>
          <small class="text-gray-500">فقط 3 کالکشن با بالاترین ترتیب نمایش در صفحه اصلی نشان داده می‌شوند</small>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">ترتیب نمایش</label>
          <input type="number" name="displayOrder" class="admin-form-input" value="${collection?.displayOrder ?? 0}" min="0" />
          <small class="text-gray-500">عدد بزرگتر = اولویت بیشتر (کالکشن بزرگ سمت چپ)</small>
        </div>
      </div>

      <div class="admin-form-section">
        <h3 class="admin-form-section-title">گالری تصاویر</h3>

        <div class="admin-form-group">
          <label class="admin-form-label">آپلود تصاویر</label>
          <input type="file" id="collection-gallery-files-input" class="admin-form-input" accept="image/*" multiple />
          <small class="text-gray-500">می‌توانید چند تصویر انتخاب کنید. فرمت‌های مجاز: JPG, PNG, WebP, GIF (حداکثر 5MB)</small>
        </div>

        <div class="admin-form-divider">
          <span>یا</span>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">افزودن با آدرس URL</label>
          <div class="flex items-center gap-2">
            <input type="url" id="collection-gallery-url-input" class="admin-form-input flex-1" placeholder="https://example.com/image.jpg" />
            <button type="button" id="collection-add-gallery-url-btn" class="admin-btn admin-btn-secondary">
              <i data-feather="plus"></i>
              افزودن
            </button>
          </div>
        </div>

        <div id="collection-gallery-list" class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3"></div>
        <small class="text-gray-500 block mt-2">ترتیب نمایش بر اساس ترتیب لیست است. تصویر شاخص را انتخاب کنید.</small>
      </div>

      <div class="admin-form-actions">
        <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
          انصراف
        </button>
        <button type="submit" class="admin-btn admin-btn-primary">
          ${isEdit ? "ذخیره تغییرات" : "افزودن کالکشن"}
        </button>
      </div>
    </form>
  `;

      panel.open(formHtml, isEdit ? "ویرایش کالکشن" : "افزودن کالکشن");

      // [Keep all existing gallery code unchanged...]
      const collectionGalleryInput = document.getElementById(
        "collection-gallery-files-input"
      );
      const collectionGalleryUrlInput = document.getElementById(
        "collection-gallery-url-input"
      );
      const collectionAddGalleryUrlBtn = document.getElementById(
        "collection-add-gallery-url-btn"
      );
      const collectionGalleryList = document.getElementById(
        "collection-gallery-list"
      );

      let collectionGallery = [];
      let collectionHeroIndex = 0;

      if (isEdit && collection?.heroImageUrl) {
        collectionGallery = [{ url: collection.heroImageUrl, alt: "" }];
        collectionHeroIndex = 0;
      }

      function collectionRenderGallery() {
        if (!collectionGalleryList) return;
        if (!collectionGallery.length) {
          collectionGalleryList.innerHTML =
            '<div class="text-center text-gray-500 col-span-full py-6">تصویری اضافه نشده است</div>';
          utils.refreshIcons();
          return;
        }
        collectionGalleryList.innerHTML = collectionGallery
          .map(
            (img, idx) => `
        <div class="border rounded-lg p-2 flex flex-col gap-2" data-idx="${idx}">
          <img src="${img.url}" alt="${img.alt || ""}" class="w-full h-28 object-cover rounded" />
          <label class="flex items-center gap-2">
            <input type="radio" name="collectionHeroImage" value="${idx}" ${collectionHeroIndex === idx ? "checked" : ""} />
            <span class="text-sm">تصویر شاخص</span>
          </label>
          <input type="text" class="admin-form-input" data-role="alt" data-idx="${idx}" placeholder="متن جایگزین" value="${img.alt || ""}" />
          <div class="flex gap-2">
            <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="collectionMoveUp" data-idx="${idx}" ${idx === 0 ? "disabled" : ""}>
              <i data-feather="arrow-up"></i>
            </button>
            <button type="button" class="admin-btn admin-btn-secondary flex-1" data-action="collectionMoveDown" data-idx="${idx}" ${idx === collectionGallery.length - 1 ? "disabled" : ""}>
              <i data-feather="arrow-down"></i>
            </button>
            <button type="button" class="admin-btn admin-btn-danger" data-action="collectionRemoveGallery" data-idx="${idx}">
              <i data-feather="trash-2"></i>
            </button>
          </div>
        </div>
      `
          )
          .join("");
        utils.refreshIcons();
      }

      collectionRenderGallery();

      const uploadCollectionImageFile = (file) => utils.uploadImage(file);

      collectionGalleryInput?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          try {
            const url = await uploadCollectionImageFile(file);
            collectionGallery.push({ url, alt: "" });
          } catch (err) {
            utils.showToast(err.message, "error");
          }
        }
        if (
          collectionGallery.length &&
          (collectionHeroIndex == null || collectionHeroIndex < 0)
        )
          collectionHeroIndex = 0;
        collectionRenderGallery();
        collectionGalleryInput.value = "";
      });

      collectionAddGalleryUrlBtn?.addEventListener("click", () => {
        const url = (collectionGalleryUrlInput?.value || "").trim();
        if (!url) return;
        if (!(url.startsWith("/") || url.startsWith("http"))) {
          utils.showToast(
            "آدرس URL تصویر باید با / یا http شروع شود.",
            "error"
          );
          return;
        }
        collectionGallery.push({ url, alt: "" });
        if (collectionGallery.length === 1) collectionHeroIndex = 0;
        collectionGalleryUrlInput.value = "";
        collectionRenderGallery();
      });

      collectionGalleryList?.addEventListener("change", (e) => {
        if (e.target.name === "collectionHeroImage") {
          collectionHeroIndex = parseInt(e.target.value, 10);
        }
      });
      collectionGalleryList?.addEventListener("input", (e) => {
        const inp = e.target.closest('input[data-role="alt"]');
        if (inp) {
          const idx = parseInt(inp.dataset.idx, 10);
          if (!isNaN(idx) && collectionGallery[idx])
            collectionGallery[idx].alt = inp.value;
        }
      });
      collectionGalleryList?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx, 10);
        const action = btn.dataset.action;
        if (Number.isNaN(idx)) return;
        if (action === "collectionRemoveGallery") {
          collectionGallery.splice(idx, 1);
          if (collectionHeroIndex === idx)
            collectionHeroIndex = Math.max(0, collectionGallery.length - 1);
          if (collectionHeroIndex > idx) collectionHeroIndex -= 1;
          collectionRenderGallery();
        } else if (action === "collectionMoveUp" && idx > 0) {
          [collectionGallery[idx - 1], collectionGallery[idx]] = [
            collectionGallery[idx],
            collectionGallery[idx - 1],
          ];
          if (collectionHeroIndex === idx) collectionHeroIndex = idx - 1;
          else if (collectionHeroIndex === idx - 1) collectionHeroIndex = idx;
          collectionRenderGallery();
        } else if (
          action === "collectionMoveDown" &&
          idx < collectionGallery.length - 1
        ) {
          [collectionGallery[idx + 1], collectionGallery[idx]] = [
            collectionGallery[idx],
            collectionGallery[idx + 1],
          ];
          if (collectionHeroIndex === idx) collectionHeroIndex = idx + 1;
          else if (collectionHeroIndex === idx + 1) collectionHeroIndex = idx;
          collectionRenderGallery();
        }
      });

      // Submit with new fields
      document
        .getElementById("collection-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const payload = {
            name: formData.get("name"),
            subtitle: formData.get("subtitle") || null,
            isFeatured: formData.get("isFeatured") === "on",
            displayOrder: parseInt(formData.get("displayOrder")) || 0,
          };

          const heroImageUrl =
            collectionGallery[collectionHeroIndex]?.url || null;
          payload.heroImageUrl = heroImageUrl;

          try {
            if (isEdit) {
              await api.updateCollection(collectionId, payload);
              utils.showToast("کالکشن با موفقیت ویرایش شد", "success");
            } else {
              await api.createCollection(payload);
              utils.showToast("کالکشن با موفقیت افزوده شد", "success");
            }
            panel.close();
            handlers.collections();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });
    },

    // Coupon Form
    coupon(couponId = null) {
      const coupon = couponId
        ? state.coupons.find((c) => c.id === couponId)
        : null;
      const isEdit = !!couponId;

      const formHtml = `
        <form id="coupon-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">اطلاعات کوپن</h3>

            <div class="admin-form-group">
              <label class="admin-form-label required">کد کوپن</label>
              <input type="text" name="code" class="admin-form-input" value="${coupon?.code || ""}" required style="text-transform: uppercase;" />
              <small class="text-gray-500">حروف بزرگ انگلیسی و اعداد</small>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label required">نوع تخفیف</label>
              <select name="type" class="admin-form-input" id="coupon-type" required>
                <option value="PERCENT" ${coupon?.type === "PERCENT" ? "selected" : ""}>درصدی</option>
                <option value="AMOUNT" ${coupon?.type === "AMOUNT" ? "selected" : ""}>مبلغ ثابت</option>
                <option value="FREE_SHIPPING" ${coupon?.type === "FREE_SHIPPING" ? "selected" : ""}>ارسال رایگان</option>
              </select>
            </div>

            <div class="admin-form-group" id="percent-group" style="display: ${coupon?.type === "PERCENT" || !coupon ? "block" : "none"};">
              <label class="admin-form-label">درصد تخفیف</label>
              <input type="number" name="percentValue" class="admin-form-input" min="0" max="100" value="${coupon?.percentValue || ""}" />
              <small class="text-gray-500">بین 0 تا 100</small>
            </div>

            <div class="admin-form-group" id="amount-group" style="display: ${coupon?.type === "AMOUNT" ? "block" : "none"};">
              <label class="admin-form-label">مبلغ تخفیف (تومان)</label>
              <input type="number" name="amountValue" class="admin-form-input" min="0" value="${coupon?.amountValue || ""}" />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">حداقل خرید (تومان)</label>
              <input type="number" name="minSubtotal" class="admin-form-input" min="0" value="${coupon?.minSubtotal || 0}" />
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">حداکثر تعداد استفاده</label>
                <input type="number" name="maxUses" class="admin-form-input" min="1" value="${coupon?.maxUses || ""}" />
                <small class="text-gray-500">خالی = نامحدود</small>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">حداکثر برای هر کاربر</label>
                <input type="number" name="maxUsesPerUser" class="admin-form-input" min="1" value="${coupon?.maxUsesPerUser || ""}" />
                <small class="text-gray-500">خالی = نامحدود</small>
              </div>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">تاریخ شروع</label>
                <input type="datetime-local" name="startsAt" class="admin-form-input" value="${utils.toInputDateTime(coupon?.startsAt)}" />
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">تاریخ پایان</label>
                <input type="datetime-local" name="endsAt" class="admin-form-input" value="${utils.toInputDateTime(coupon?.endsAt)}" />
              </div>
            </div>

            <div class="admin-form-group">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" class="w-4 h-4" ${coupon?.isActive !== false ? "checked" : ""} />
                <span>فعال</span>
              </label>
            </div>
          </div>

          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
              انصراف
            </button>
            <button type="submit" class="admin-btn admin-btn-primary">
              ${isEdit ? "ذخیره تغییرات" : "افزودن کوپن"}
            </button>
          </div>
        </form>
      `;

      panel.open(formHtml, isEdit ? "ویرایش کوپن" : "افزودن کوپن");

      document.getElementById("coupon-type").addEventListener("change", (e) => {
        const type = e.target.value;
        document.getElementById("percent-group").style.display =
          type === "PERCENT" ? "block" : "none";
        document.getElementById("amount-group").style.display =
          type === "AMOUNT" ? "block" : "none";
      });

      document
        .getElementById("coupon-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const type = formData.get("type");
          const payload = {
            code: formData.get("code").toUpperCase(),
            type: type,
            percentValue:
              type === "PERCENT"
                ? parseInt(formData.get("percentValue"))
                : undefined,
            amountValue:
              type === "AMOUNT"
                ? parseInt(formData.get("amountValue"))
                : undefined,
            minSubtotal: parseInt(formData.get("minSubtotal")) || 0,
            maxUses: formData.get("maxUses")
              ? parseInt(formData.get("maxUses"))
              : undefined,
            maxUsesPerUser: formData.get("maxUsesPerUser")
              ? parseInt(formData.get("maxUsesPerUser"))
              : undefined,
            startsAt: formData.get("startsAt") || undefined,
            endsAt: formData.get("endsAt") || undefined,
            isActive: formData.get("isActive") === "on",
          };

          try {
            if (isEdit) {
              await api.updateCoupon(couponId, payload);
              utils.showToast("کوپن با موفقیت ویرایش شد", "success");
            } else {
              await api.createCoupon(payload);
              utils.showToast("کوپن با موفقیت افزوده شد", "success");
            }
            panel.close();
            handlers.coupons();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });
    },

    // Badge Form
    badge(badgeId = null) {
      const badge = badgeId ? state.badges.find((b) => b.id === badgeId) : null;
      const isEdit = !!badgeId;

      const formHtml = `
        <form id="badge-form" class="admin-form">
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">اطلاعات نشان</h3>

            <div class="admin-form-group">
              <label class="admin-form-label required">عنوان نشان</label>
              <input type="text" name="title" class="admin-form-input" value="${badge?.title || ""}" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label required">آیکون (Feather Icon)</label>
              <input type="text" name="icon" class="admin-form-input" value="${badge?.icon || ""}" required placeholder="award" />
              <small class="text-gray-500">
                نام آیکون Feather مثل: award, shield, star, check-circle
                <a href="https://feathericons.com/" target="_blank" class="text-rose-600">مشاهده لیست</a>
              </small>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">پیش‌نمایش آیکون</label>
              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <i id="icon-preview" data-feather="${badge?.icon || "award"}" class="w-8 h-8 text-rose-600"></i>
                <span id="icon-name" class="font-medium">${badge?.icon || "award"}</span>
              </div>
            </div>
          </div>

          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-secondary" data-action="closePanel">
              انصراف
            </button>
            <button type="submit" class="admin-btn admin-btn-primary">
              ${isEdit ? "ذخیره تغییرات" : "افزودن نشان"}
            </button>
          </div>
        </form>
      `;

      panel.open(formHtml, isEdit ? "ویرایش نشان" : "افزودن نشان");

      const iconInput = document.querySelector('input[name="icon"]');
      const iconPreview = document.getElementById("icon-preview");
      const iconName = document.getElementById("icon-name");

      iconInput?.addEventListener("input", (e) => {
        const iconValue = e.target.value.trim();
        if (iconValue) {
          iconPreview?.setAttribute("data-feather", iconValue);
          iconName.textContent = iconValue;
          utils.refreshIcons();
        }
      });

      document
        .getElementById("badge-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const payload = {
            title: formData.get("title"),
            icon: formData.get("icon"),
          };

          try {
            if (isEdit) {
              await api.updateBadge(badgeId, payload);
              utils.showToast("نشان با موفقیت ویرایش شد", "success");
            } else {
              await api.createBadge(payload);
              utils.showToast("نشان با موفقیت افزوده شد", "success");
            }
            panel.close();
            handlers.badges();
          } catch (error) {
            utils.showToast("خطا: " + error.message, "error");
          }
        });

      utils.refreshIcons();
    },
  };

  // ========== EVENT DELEGATION SYSTEM ==========
  const eventHandlers = {
    init() {
      document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;
        const handler = this.actions[action];

        if (handler) {
          e.preventDefault();
          handler.call(this, id, target);
        }
      });
      // Inline product category update (DB-backed)
      document.addEventListener("change", (e) => {
        const select = e.target.closest(".product-category-select");
        if (!select) return;
        const productId = select.dataset.id;
        const newCategoryId = select.value || null;
        const labelSpan = select.parentElement?.querySelector("span");
        select.disabled = true;
        api
          .updateProduct(productId, { categoryId: newCategoryId })
          .then(() => {
            utils.showToast("دسته‌بندی بروزرسانی شد", "success");
            if (labelSpan) {
              const found = (state.categories || []).find((c) => c.id === newCategoryId);
              labelSpan.textContent = found ? found.label : "-";
            }
          })
          .catch((err) => utils.showToast("خطا: " + err.message, "error"))
          .finally(() => (select.disabled = false));
      });
    },

    actions: {
      reload() {
        location.reload();
      },

      closePanel() {
        panel.close();
      },

      // Product actions
      createProduct() {
        forms.product();
      },

      editProduct(id) {
        forms.product(id);
      },

      deleteProduct(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟")) {
          api
            .deleteProduct(id)
            .then(() => {
              utils.showToast("محصول با موفقیت حذف شد", "success");
              handlers.products();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Order actions
      viewOrder(id) {
        forms.orderDetail(id);
      },

      // User actions
      editUser(id) {
        forms.user(id);
      },

      deleteUserConfirm(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟")) {
          api
            .deleteUser(id)
            .then(() => {
              utils.showToast("کاربر با موفقیت حذف شد", "success");
              panel.close();
              handlers.users();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Review actions
      approveReview(id) {
        api
          .updateReviewStatus(id, "APPROVED")
          .then(() => {
            utils.showToast("نظر تایید شد", "success");
            handlers.reviews();
          })
          .catch((error) => utils.showToast("خطا: " + error.message, "error"));
      },

      rejectReview(id) {
        api
          .updateReviewStatus(id, "REJECTED")
          .then(() => {
            utils.showToast("نظر رد شد", "success");
            handlers.reviews();
          })
          .catch((error) => utils.showToast("خطا: " + error.message, "error"));
      },

      // Magazine actions
      createMagazine() {
        forms.magazine();
      },

      editMagazine(id) {
        forms.magazine(id);
      },

      // Magazine Authors
      createMagazineAuthor() {
        forms.magazineAuthor();
      },
      editMagazineAuthor(id) {
        forms.magazineAuthor(id);
      },
      deleteMagazineAuthor(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این نویسنده را حذف کنید؟")) {
          api
            .deleteMagazineAuthor(id)
            .then(() => {
              utils.showToast("نویسنده حذف شد", "success");
              handlers.magazineAuthors();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },
      // Magazine Tags
      createMagazineTag() {
        forms.magazineTag();
      },
      editMagazineTag(id) {
        forms.magazineTag(id);
      },
      deleteMagazineTag(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این برچسب را حذف کنید؟")) {
          api
            .deleteMagazineTag(id)
            .then(() => {
              utils.showToast("برچسب حذف شد", "success");
              handlers.magazineTags();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },
      // Magazine Categories actions
      createMagazineCategory() {
        forms.magazineCategory();
      },
      editMagazineCategory(id) {
        forms.magazineCategory(id);
      },
      deleteMagazineCategory(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟")) {
          api
            .deleteMagazineCategory(id)
            .then(() => {
              utils.showToast("دسته‌بندی حذف شد", "success");
              handlers.magazineCategories();
            })
            .catch((error) => utils.showToast("خطا: " + error.message, "error"));
        }
      },

      deleteMagazine(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این مقاله را حذف کنید؟")) {
          api
            .deleteMagazinePost(id)
            .then(() => {
              utils.showToast("مقاله حذف شد", "success");
              handlers.magazine();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Newsletter actions
      createNewsletter() {
        forms.newsletter();
      },

      // Brand actions
      createBrand() {
        forms.brand();
      },

      editBrand(id) {
        forms.brand(id);
      },

      deleteBrand(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این برند را حذف کنید؟")) {
          api
            .deleteBrand(id)
            .then(() => {
              utils.showToast("برند حذف شد", "success");
              handlers.brands();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Add inside eventHandlers.actions object
      createColorTheme() {
        forms.colorTheme();
      },
      editColorTheme(id) {
        forms.colorTheme(id);
      },
      deleteColorTheme(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این تم رنگی را حذف کنید؟")) {
          api
            .deleteColorTheme(id)
            .then(() => {
              utils.showToast("تم رنگی حذف شد", "success");
              handlers.colorThemes();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },
      // Collection actions
      createCollection() {
        forms.collection();
      },

      editCollection(id) {
        forms.collection(id);
      },

      deleteCollection(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این کالکشن را حذف کنید؟")) {
          api
            .deleteCollection(id)
            .then(() => {
              utils.showToast("کالکشن حذف شد", "success");
              handlers.collections();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Coupon actions
      createCoupon() {
        forms.coupon();
      },

      editCoupon(id) {
        forms.coupon(id);
      },

      deleteCoupon(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این کوپن را حذف کنید؟")) {
          api
            .deleteCoupon(id)
            .then(() => {
              utils.showToast("کوپن حذف شد", "success");
              handlers.coupons();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },

      // Badge actions
      createBadge() {
        forms.badge();
      },

      editBadge(id) {
        forms.badge(id);
      },

      deleteBadge(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این نشان را حذف کنید؟")) {
          api
            .deleteBadge(id)
            .then(() => {
              utils.showToast("نشان حذف شد", "success");
              handlers.badges();
            })
            .catch((error) =>
              utils.showToast("خطا: " + error.message, "error")
            );
        }
      },
      // Categories actions
      createCategory() {
        forms.category();
      },
      editCategory(id) {
        forms.category(id);
      },
      deleteCategory(id) {
        if (confirm("آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟")) {
          api
            .deleteCategory(id)
            .then(() => {
              utils.showToast("دسته‌بندی حذف شد", "success");
              handlers.categories();
            })
            .catch((error) => utils.showToast("خطا: " + error.message, "error"));
        }
      },
    },
  };

  // ========== VIEW RENDERERS ==========
  const views = {
    categories() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت دسته‌بندی‌ها</h2>
          <button data-action="createCategory" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن دسته‌بندی</span>
          </button>
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>تصویر</th>
                    <th>آیکون</th>
                    <th>مقدار</th>
                    <th>برچسب</th>
                    <th>تعداد محصولات</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="categories-tbody">
                  <tr><td colspan="5">${utils.showLoading()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
    magazineAuthors() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">نویسندگان مجله</h2>
          <button data-action="createMagazineAuthor" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن نویسنده</span>
          </button>
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>اسلاگ</th>
                    <th>آواتار</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="magazine-authors-tbody">
                  <tr><td colspan="4">${utils.showLoading()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
    magazineTags() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">برچسب‌های مجله</h2>
          <button data-action="createMagazineTag" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن برچسب</span>
          </button>
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>اسلاگ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="magazine-tags-tbody">
                  <tr><td colspan="3">${utils.showLoading()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
    magazineCategories() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">دسته‌بندی‌های مجله</h2>
          <button data-action="createMagazineCategory" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن دسته‌بندی</span>
          </button>
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>نام</th>
                    <th>اسلاگ</th>
                    <th>تعداد مقالات</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="magazine-cats-tbody">
                  <tr><td colspan="5">${utils.showLoading()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
    dashboard() {
      return `
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-blue-100 text-blue-600">
              <i data-feather="package"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">کل محصولات</div>
              <div class="admin-stat-value" id="stat-products">0</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-green-100 text-green-600">
              <i data-feather="shopping-cart"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">کل سفارش‌ها</div>
              <div class="admin-stat-value" id="stat-orders">0</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-purple-100 text-purple-600">
              <i data-feather="users"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">کل کاربران</div>
              <div class="admin-stat-value" id="stat-users">0</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-yellow-100 text-yellow-600">
              <i data-feather="dollar-sign"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">کل درآمد</div>
              <div class="admin-stat-value" id="stat-revenue">0 تومان</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">آخرین سفارش‌ها</h3>
              <a href="#orders" class="admin-link">مشاهده همه</a>
            </div>
            <div class="admin-card-body">
              <div id="recent-orders-list" class="space-y-3">
                ${utils.showLoading()}
              </div>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">محصولات برتر</h3>
              <a href="#products" class="admin-link">مشاهده همه</a>
            </div>
            <div class="admin-card-body">
              <div id="top-products-list" class="space-y-3">
                ${utils.showLoading()}
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card mt-6">
          <div class="admin-card-header">
            <h3 class="admin-card-title">کاربران جدید</h3>
            <a href="#users" class="admin-link">مشاهده همه</a>
          </div>
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ایمیل</th>
                    <th>نام</th>
                    <th>نقش</th>
                    <th>تاریخ عضویت</th>
                  </tr>
                </thead>
                <tbody id="recent-users-tbody">
                  <tr>
                    <td colspan="4">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    products() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <div class="flex gap-4">
            <input 
              type="search" 
              id="product-search" 
              placeholder="جستجوی محصول..." 
              class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <select id="product-category-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option value="">همه دسته‌ها</option>
              <option value="SKINCARE">مراقبت از پوست</option>
              <option value="MAKEUP">آرایش</option>
              <option value="FRAGRANCE">عطر</option>
              <option value="HAIRCARE">مراقبت از مو</option>
              <option value="BODY_BATH">بدن و حمام</option>
            </select>
          </div>
          <button data-action="createProduct" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن محصول</span>
          </button>
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>تصویر</th>
                    <th>نام محصول</th>
                    <th>برند</th>
                    <th>دسته‌بندی</th>
                    <th>قیمت</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="products-tbody">
                  <tr>
                    <td colspan="7">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="products-pagination" class="mt-4"></div>
          </div>
        </div>
      `;
    },
    colorThemes() {
      return `
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-bold">مدیریت تم‌های رنگی</h2>
      <button data-action="createColorTheme" class="admin-btn admin-btn-primary">
        <i data-feather="plus"></i>
        <span>افزودن تم رنگی</span>
      </button>
    </div>
    <div class="admin-card">
        <div class="admin-card-body">
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                    <tr>
                        <th>رنگ</th>
                        <th>نام</th>
                        <th>اسلاگ</th>
                        <th>تعداد محصولات</th>
                        <th>عملیات</th>
                    </tr>
                    </thead>
                    <tbody id="colorThemes-tbody">
                    <tr><td colspan="5">${utils.showLoading()}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  `;
    },

    orders() {
      return `
        <div class="mb-6 flex gap-4">
          <select id="order-status-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">همه سفارش‌ها</option>
            <option value="AWAITING_PAYMENT">در انتظار پرداخت</option>
            <option value="PAID">پرداخت شده</option>
            <option value="PROCESSING">در حال پردازش</option>
            <option value="SHIPPED">ارسال شده</option>
            <option value="DELIVERED">تحویل شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
          <input 
            type="search" 
            id="order-search" 
            placeholder="جستجوی شماره سفارش..." 
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>شماره سفارش</th>
                    <th>مشتری</th>
                    <th>تاریخ</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="orders-tbody">
                  <tr>
                    <td colspan="6">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="orders-pagination" class="mt-4"></div>
          </div>
        </div>
      `;
    },

    users() {
      return `
        <div class="mb-6 flex gap-4">
          <select id="user-role-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">همه نقش‌ها</option>
            <option value="ADMIN">ادمین</option>
            <option value="STAFF">کارمند</option>
            <option value="CUSTOMER">مشتری</option>
          </select>
          <input 
            type="search" 
            id="user-search" 
            placeholder="جستجوی کاربر..." 
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ایمیل</th>
                    <th>نام</th>
                    <th>تلفن</th>
                    <th>نقش</th>
                    <th>سطح</th>
                    <th>تعداد سفارش</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="users-tbody">
                  <tr>
                    <td colspan="7">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="users-pagination" class="mt-4"></div>
          </div>
        </div>
      `;
    },

    reviews() {
      return `
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">نظرات در انتظار تایید</h3>
          </div>
          <div class="admin-card-body">
            <div id="reviews-list">
              ${utils.showLoading()}
            </div>
          </div>
        </div>
      `;
    },

    brands() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت برندها</h2>
          <button data-action="createBrand" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن برند</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="brands-grid">
          ${utils.showLoading()}
        </div>
      `;
    },

    collections() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت کالکشن‌ها</h2>
          <button data-action="createCollection" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن کالکشن</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="collections-grid">
          ${utils.showLoading()}
        </div>
      `;
    },

    coupons() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت کوپن‌ها</h2>
          <button data-action="createCoupon" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن کوپن</span>
          </button>
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>نوع</th>
                    <th>مقدار</th>
                    <th>حداقل خرید</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="coupons-tbody">
                  <tr>
                    <td colspan="6">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    newsletter() {
      return `
        <div class="admin-stats-grid mb-6">
          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-green-100 text-green-600">
              <i data-feather="users"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">مشترکین فعال</div>
              <div class="admin-stat-value" id="newsletter-active">0</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-blue-100 text-blue-600">
              <i data-feather="user-plus"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">مشترکین جدید (۳۰ روز)</div>
              <div class="admin-stat-value" id="newsletter-recent">0</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon bg-red-100 text-red-600">
              <i data-feather="user-minus"></i>
            </div>
            <div class="admin-stat-content">
              <div class="admin-stat-label">لغو اشتراک</div>
              <div class="admin-stat-value" id="newsletter-unsubscribed">0</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">ارسال خبرنامه</h3>
            </div>
            <div class="admin-card-body">
              <p class="text-gray-600 mb-4">ایجاد و ارسال خبرنامه به مشترکین فعال</p>
              <button data-action="createNewsletter" class="admin-btn admin-btn-primary">
                <i data-feather="mail"></i>
                <span>ایجاد خبرنامه</span>
              </button>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">مشاهده مشترکین</h3>
            </div>
            <div class="admin-card-body">
              <p class="text-gray-600 mb-4">مشاهده لیست کامل مشترکین خبرنامه</p>
              <a href="#newsletterSubscribers" class="admin-btn admin-btn-secondary">
                <i data-feather="list"></i>
                <span>لیست مشترکین</span>
              </a>
            </div>
          </div>
        </div>
      `;
    },

    magazine() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت مجله</h2>
          <button data-action="createMagazine" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن مقاله</span>
          </button>
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>نویسنده</th>
                    <th>دسته‌بندی</th>
                    <th>وضعیت</th>
                    <th>تاریخ انتشار</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody id="magazine-tbody">
                  <tr>
                    <td colspan="6">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    badges() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت نشان‌ها</h2>
          <button data-action="createBadge" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن نشان</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="badges-grid">
          ${utils.showLoading()}
        </div>
      `;
    },

    newsletterSubscribers() {
      return `
        <div class="mb-6 flex gap-4">
          <select id="subscriber-status-filter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="all">همه اشتراک‌ها</option>
            <option value="active">فعال</option>
            <option value="unsubscribed">لغو شده</option>
          </select>
        </div>

        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ایمیل</th>
                    <th>منبع</th>
                    <th>وضعیت</th>
                    <th>تاریخ عضویت</th>
                    <th>تاریخ لغو</th>
                  </tr>
                </thead>
                <tbody id="subscribers-tbody">
                  <tr>
                    <td colspan="5">${utils.showLoading()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="subscribers-pagination" class="mt-4"></div>
          </div>
        </div>
      `;
    },
  };

  // ========== ROUTE HANDLERS ==========
  const handlers = {
    async categories() {
      try {
        const res = await api.getCategories();
        const categories = res?.categories || res || [];
        state.categories = categories;
        const tbody = document.getElementById("categories-tbody");
        if (tbody) {
          tbody.innerHTML = categories.length
            ? categories
              .map(
                (c) => `
              <tr>
                <td>${c.heroImageUrl ? `<img src="${c.heroImageUrl}" class="w-12 h-12 rounded object-cover border" />` : "-"}</td>
                <td><i data-feather="${c.icon || "grid"}" class="w-4 h-4"></i></td>
                <td><code>${c.value}</code></td>
                <td>${c.label}</td>
                <td>${utils.toFa(c._count?.products || 0)}</td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editCategory" data-id="${c.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteCategory" data-id="${c.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              </tr>`
              )
              .join("")
            : '<tr><td colspan="5" class="text-center py-8 text-gray-500">دسته‌ای وجود ندارد</td></tr>';
        }
        utils.refreshIcons();
      } catch (err) {
        document.getElementById("app-content").innerHTML = utils.showError(err.message);
      }
    },
    async dashboard() {
      try {
        const data = await api.getDashboard();
        state.stats = data.stats;

        document.getElementById("stat-products").textContent = utils.toFa(
          data.stats.totalProducts
        );
        document.getElementById("stat-orders").textContent = utils.toFa(
          data.stats.totalOrders
        );
        document.getElementById("stat-users").textContent = utils.toFa(
          data.stats.totalUsers
        );
        document.getElementById("stat-revenue").textContent = utils.toIRR(
          data.stats.totalRevenue
        );

        if (data.stats.pendingReviews > 0) {
          const badge = document.getElementById("pending-reviews-badge");
          if (badge) {
            badge.textContent = utils.toFa(data.stats.pendingReviews);
            badge.classList.remove("hidden");
          }
        }

        const ordersList = document.getElementById("recent-orders-list");
        if (ordersList) {
          ordersList.innerHTML = "";
          if (!data.recentOrders || data.recentOrders.length === 0) {
            ordersList.innerHTML =
              '<p class="text-gray-500 text-center py-4">سفارشی وجود ندارد</p>';
          } else {
            data.recentOrders.forEach((order) => {
              const orderItem = document.createElement("div");
              orderItem.className = "admin-list-item";
              orderItem.innerHTML = `
                <div class="flex-1">
                  <div class="font-medium">${order.orderNumber}</div>
                  <div class="text-sm text-gray-500">
                    ${order.user?.firstName || ""} ${order.user?.lastName || ""}
                  </div>
                </div>
                <div class="text-left">
                  <div class="font-semibold">${utils.toIRR(order.total)}</div>
                  <div class="admin-badge-${utils.getStatusColor(order.status)}">
                    ${utils.getStatusLabel(order.status)}
                  </div>
                </div>
              `;
              ordersList.appendChild(orderItem);
            });
          }
        }

        const productsList = document.getElementById("top-products-list");
        if (productsList) {
          productsList.innerHTML = "";
          if (!data.topProducts || data.topProducts.length === 0) {
            productsList.innerHTML =
              '<p class="text-gray-500 text-center py-4">محصولی وجود ندارد</p>';
          } else {
            data.topProducts.forEach((product) => {
              const productItem = document.createElement("div");
              productItem.className = "admin-list-item";
              productItem.innerHTML = `
                <img src="${product.heroImageUrl || "/assets/images/product.png"}" 
                     alt="${product.title}" 
                     class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1">
                  <div class="font-medium">${product.title}</div>
                  <div class="text-sm text-gray-500">
                    ${utils.toFa(product.ratingCount || 0)} نظر - ${product.ratingAvg || 0} ⭐
                  </div>
                </div>
                <div class="font-semibold">${utils.toIRR(product.price)}</div>
              `;
              productsList.appendChild(productItem);
            });
          }
        }

        const usersTbody = document.getElementById("recent-users-tbody");
        if (usersTbody) {
          usersTbody.innerHTML = "";
          if (!data.recentUsers || data.recentUsers.length === 0) {
            usersTbody.innerHTML =
              '<tr><td colspan="4" class="text-center py-4 text-gray-500">کاربری وجود ندارد</td></tr>';
          } else {
            data.recentUsers.forEach((user) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${user.email}</td>
                <td>${user.firstName || ""} ${user.lastName || ""}</td>
                <td><span class="admin-badge-${utils.getRoleColor(user.role)}">${utils.getRoleLabel(user.role)}</span></td>
                <td>${utils.formatDate(user.createdAt)}</td>
              `;
              usersTbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Dashboard error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async products() {
      try {
        if (!state.categories || !state.categories.length) {
          try {
            const catRes = await api.getCategories();
            state.categories = catRes?.categories || catRes || [];
          } catch { }
        }
        const data = await api.getProducts({ page: 1, perPage: 20 });
        state.products = data.products;

        const tbody = document.getElementById("products-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.products || data.products.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="7" class="text-center py-8 text-gray-500">محصولی وجود ندارد</td></tr>';
          } else {
            data.products.forEach((product) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>
                  <img src="${product.heroImageUrl || "/assets/images/product.png"}" 
                       alt="${product.title}" 
                       class="w-16 h-16 rounded-lg object-cover">
                </td>
                <td>${product.title}</td>
                <td>${product.brand?.name || "-"}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <spanc lass="hidden sm:inline">${utils.getCategoryLabel(product.dbCategory?.value)}</span>
                  </div>
                </td>
                <td>${utils.toIRR(product.price)}</td>
                <td>
                  <span class="admin-badge-${product.isActive ? "success" : "danger"}">
                    ${product.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editProduct" data-id="${product.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteProduct" data-id="${product.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Products error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async colorThemes() {
      try {
        const data = await api.getColorThemesAdmin();
        state.colorThemes = data.colorThemes;

        const tbody = document.getElementById("colorThemes-tbody");
        if (tbody) {
          tbody.innerHTML = data.colorThemes?.length
            ? data.colorThemes
              .map(
                (theme) => `
        <tr>
          <td>
            <span class="inline-block w-6 h-6 rounded-full border" style="background-color: ${theme.hexCode || "transparent"}"></span>
          </td>
          <td>${theme.name}</td>
          <td>${theme.slug}</td>
          <td>${utils.toFa(theme._count?.products || 0)}</td>
          <td>
            <div class="flex gap-2">
              <button data-action="editColorTheme" data-id="${theme.id}" class="admin-btn admin-btn-secondary">
                <i data-feather="edit-2" class="w-4 h-4"></i>
              </button>
              <button data-action="deleteColorTheme" data-id="${theme.id}" class="admin-btn admin-btn-danger">
                <i data-feather="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `
              )
              .join("")
            : '<tr><td colspan="5" class="text-center py-8 text-gray-500">تم رنگی وجود ندارد</td></tr>';
        }
        utils.refreshIcons();
      } catch (error) {
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async orders() {
      try {
        const data = await api.getOrders({ page: 1, perPage: 20 });
        state.orders = data.orders;

        const tbody = document.getElementById("orders-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.orders || data.orders.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="6" class="text-center py-8 text-gray-500">سفارشی وجود ندارد</td></tr>';
          } else {
            data.orders.forEach((order) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${order.orderNumber}</td>
                <td>${order.user?.email || "-"}</td>
                <td>${utils.formatDate(order.createdAt)}</td>
                <td>${utils.toIRR(order.total)}</td>
                <td>
                  <span class="admin-badge-${utils.getStatusColor(order.status)}">
                    ${utils.getStatusLabel(order.status)}
                  </span>
                </td>
                <td>
                  <button data-action="viewOrder" data-id="${order.id}" class="admin-btn admin-btn-secondary">
                    <i data-feather="eye" class="w-4 h-4"></i>
                  </button>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Orders error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async users() {
      try {
        const data = await api.getUsers({ page: 1, perPage: 20 });
        state.users = data.users;

        const tbody = document.getElementById("users-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.users || data.users.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="7" class="text-center py-8 text-gray-500">کاربری وجود ندارد</td></tr>';
          } else {
            data.users.forEach((user) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${user.email}</td>
                <td>${user.firstName || ""} ${user.lastName || ""}</td>
                <td>${user.phone || "-"}</td>
                <td>
                  <span class="admin-badge-${utils.getRoleColor(user.role)}">
                    ${utils.getRoleLabel(user.role)}
                  </span>
                </td>
                <td>${user.customerTier}</td>
                <td>${utils.toFa(user._count?.orders || 0)}</td>
                <td>
                  <button data-action="editUser" data-id="${user.id}" class="admin-btn admin-btn-secondary">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                  </button>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Users error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async reviews() {
      try {
        const data = await api.getReviews({ page: 1, perPage: 20 });
        state.reviews = data.reviews;

        const list = document.getElementById("reviews-list");
        if (list) {
          list.innerHTML = "";
          if (!data.reviews || data.reviews.length === 0) {
            list.innerHTML =
              '<p class="text-center py-8 text-gray-500">نظری برای تایید وجود ندارد</p>';
          } else {
            data.reviews.forEach((review) => {
              const card = document.createElement("div");
              card.className = "border rounded-lg p-4 mb-4";
              card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-bold">${review.product?.title || "محصول"}</h4>
                    <p class="text-sm text-gray-600">
                      ${review.user?.email || review.guestName || "کاربر مهمان"}
                    </p>
                  </div>
                  <div class="flex gap-1">
                    ${Array(5)
                  .fill(0)
                  .map(
                    (_, i) =>
                      `<i data-feather="star" class="w-4 h-4 ${i < review.rating ? "fill-current text-yellow-400" : "text-gray-300"}"></i>`
                  )
                  .join("")}
                  </div>
                </div>
                <p class="text-gray-700 mb-4">${review.body}</p>
                <div class="flex gap-2">
                  <button data-action="approveReview" data-id="${review.id}" class="admin-btn admin-btn-primary">
                    <i data-feather="check" class="w-4 h-4"></i>
                    تایید
                  </button>
                  <button data-action="rejectReview" data-id="${review.id}" class="admin-btn admin-btn-danger">
                    <i data-feather="x" class="w-4 h-4"></i>
                    رد
                  </button>
                </div>
              `;
              list.appendChild(card);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Reviews error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async brands() {
      try {
        const data = await api.getBrands();
        state.brands = data.brands;

        const grid = document.getElementById("brands-grid");
        if (grid) {
          grid.innerHTML = "";
          if (!data.brands || data.brands.length === 0) {
            grid.innerHTML =
              '<p class="col-span-full text-center py-8 text-gray-500">برندی وجود ندارد</p>';
          } else {
            data.brands.forEach((brand) => {
              const card = document.createElement("div");
              card.className = "admin-card";
              card.innerHTML = `
                <div class="admin-card-body">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="font-bold text-lg">${brand.name}</h4>
                      <p class="text-sm text-gray-500">${brand.slug}</p>
                    </div>
                    <span class="text-sm text-gray-600">${utils.toFa(brand._count?.products || 0)} محصول</span>
                  </div>
                  <div class="flex gap-2 mt-4">
                    <button data-action="editBrand" data-id="${brand.id}" class="admin-btn admin-btn-secondary flex-1">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                      ویرایش
                    </button>
                    <button data-action="deleteBrand" data-id="${brand.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Brands error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async collections() {
      try {
        const data = await api.getCollections();
        state.collections = data.collections;

        const grid = document.getElementById("collections-grid");
        if (grid) {
          grid.innerHTML = "";
          if (!data.collections || data.collections.length === 0) {
            grid.innerHTML =
              '<p class="col-span-full text-center py-8 text-gray-500">کالکشنی وجود ندارد</p>';
          } else {
            data.collections.forEach((collection) => {
              const card = document.createElement("div");
              card.className = "admin-card";
              card.innerHTML = `
                <div class="admin-card-body">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="font-bold text-lg">${collection.name}</h4>
                    </div>
                    <span class="text-sm text-gray-600">${utils.toFa(collection._count?.products || 0)} محصول</span>
                  </div>
                  <div class="flex gap-2 mt-4">
                    <button data-action="editCollection" data-id="${collection.id}" class="admin-btn admin-btn-secondary flex-1">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                      ویرایش
                    </button>
                    <button data-action="deleteCollection" data-id="${collection.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Collections error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async coupons() {
      try {
        const data = await api.getCoupons({ page: 1, perPage: 20 });
        state.coupons = data.coupons;

        const tbody = document.getElementById("coupons-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.coupons || data.coupons.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="6" class="text-center py-8 text-gray-500">کوپنی وجود ندارد</td></tr>';
          } else {
            data.coupons.forEach((coupon) => {
              const tr = document.createElement("tr");
              const value =
                coupon.type === "PERCENT"
                  ? `${coupon.percentValue}%`
                  : coupon.type === "AMOUNT"
                    ? utils.toIRR(coupon.amountValue)
                    : "ارسال رایگان";

              tr.innerHTML = `
                <td><code class="bg-gray-100 px-2 py-1 rounded">${coupon.code}</code></td>
                <td>${coupon.type}</td>
                <td>${value}</td>
                <td>${utils.toIRR(coupon.minSubtotal)}</td>
                <td>
                  <span class="admin-badge-${coupon.isActive ? "success" : "danger"}">
                    ${coupon.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editCoupon" data-id="${coupon.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteCoupon" data-id="${coupon.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Coupons error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async newsletter() {
      try {
        const data = await api.getNewsletterStats();

        document.getElementById("newsletter-active").textContent = utils.toFa(
          data.active
        );
        document.getElementById("newsletter-recent").textContent = utils.toFa(
          data.recentSubscribers
        );
        document.getElementById("newsletter-unsubscribed").textContent =
          utils.toFa(data.unsubscribed);

        utils.refreshIcons();
      } catch (error) {
        console.error("Newsletter error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async magazine() {
      try {
        const data = await api.getMagazinePosts({
          page: 1,
          onlyPublished: false,
        });
        state.magazines = data.items;

        const tbody = document.getElementById("magazine-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.items || data.items.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="6" class="text-center py-8 text-gray-500">مقاله‌ای وجود ندارد</td></tr>';
          } else {
            data.items.forEach((post) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${post.title}</td>
                <td>${post.author?.name || "-"}</td>
                <td>${post.category}</td>
                <td>
                  <span class="admin-badge-${post.isPublished ? "success" : "warning"}">
                    ${post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                </td>
                <td>${utils.formatDate(post.publishedAt)}</td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editMagazine" data-id="${post.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteMagazine" data-id="${post.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Magazine error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async magazineAuthors() {
      try {
        const authors = await api.getMagazineAuthors();
        state.authors = authors || [];
        const tbody = document.getElementById("magazine-authors-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!authors || authors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">نویسنده‌ای وجود ندارد</td></tr>';
          } else {
            authors.forEach((a) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${a.name}</td>
                <td>${a.slug || "-"}</td>
                <td>${a.avatarUrl ? `<img src="${a.avatarUrl}" alt="${a.name}" class="w-10 h-10 rounded object-cover">` : "-"}</td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editMagazineAuthor" data-id="${a.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteMagazineAuthor" data-id="${a.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }
        utils.refreshIcons();
      } catch (error) {
        document.getElementById("app-content").innerHTML = utils.showError(error.message);
      }
    },
    async magazineTags() {
      try {
        const tags = await api.getMagazineTags();
        state.tags = tags || [];
        const tbody = document.getElementById("magazine-tags-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!tags || tags.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-500">برچسبی وجود ندارد</td></tr>';
          } else {
            tags.forEach((t) => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${t.name}</td>
                <td>${t.slug}</td>
                <td>
                  <div class="flex gap-2">
                    <button data-action="editMagazineTag" data-id="${t.id}" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button data-action="deleteMagazineTag" data-id="${t.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }
        utils.refreshIcons();
      } catch (error) {
        document.getElementById("app-content").innerHTML = utils.showError(error.message);
      }
    },
    async magazineCategories() {
      try {
        const cats = await api.getMagazineCategories();
        // Response may be { success, data } or raw array
        const list = cats?.data || cats || [];
        state.magazineCategories = list;
        const tbody = document.getElementById("magazine-cats-tbody");
        if (tbody) {
          tbody.innerHTML = list.length
            ? list
                .map(
                  (c) => `
                <tr>
                  <td><code>${c.code}</code></td>
                  <td>${c.name}</td>
                  <td>${c.slug}</td>
                  <td>${utils.toFa(c._count?.posts || 0)}</td>
                  <td>
                    <div class="flex gap-2">
                      <button data-action="editMagazineCategory" data-id="${c.id}" class="admin-btn admin-btn-secondary">
                        <i data-feather="edit-2" class="w-4 h-4"></i>
                      </button>
                      <button data-action="deleteMagazineCategory" data-id="${c.id}" class="admin-btn admin-btn-danger">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>`
                )
                .join("")
            : '<tr><td colspan="5" class="text-center py-8 text-gray-500">دسته‌بندی‌ای وجود ندارد</td></tr>';
        }
        utils.refreshIcons();
      } catch (error) {
        document.getElementById("app-content").innerHTML = utils.showError(error.message);
      }
    },
    async badges() {
      try {
        const data = await api.getBadges();
        state.badges = data.badges;

        const grid = document.getElementById("badges-grid");
        if (grid) {
          grid.innerHTML = "";
          if (!data.badges || data.badges.length === 0) {
            grid.innerHTML =
              '<p class="col-span-full text-center py-8 text-gray-500">نشانی وجود ندارد</p>';
          } else {
            data.badges.forEach((badge) => {
              const card = document.createElement("div");
              card.className = "admin-card hover:shadow-lg transition-shadow";
              card.innerHTML = `
                <div class="admin-card-body">
                  <div class="flex items-start gap-4 mb-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                      <i data-feather="${badge.icon}" class="w-6 h-6 text-rose-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-lg truncate">${badge.title}</h4>
                      <p class="text-sm text-gray-500">
                        <i data-feather="package" class="w-3 h-3 inline"></i>
                        ${utils.toFa(badge._count?.products || 0)} محصول
                      </p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button data-action="editBadge" data-id="${badge.id}" class="admin-btn admin-btn-secondary flex-1">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                      ویرایش
                    </button>
                    <button data-action="deleteBadge" data-id="${badge.id}" class="admin-btn admin-btn-danger">
                      <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }

        utils.refreshIcons();
      } catch (error) {
        console.error("Badges error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    async newsletterSubscribers() {
      try {
        const status =
          document.getElementById("subscriber-status-filter")?.value || "all";
        const data = await api.getNewsletterSubscribers({
          page: 1,
          perPage: 50,
          status,
        });

        const tbody = document.getElementById("subscribers-tbody");
        if (tbody) {
          tbody.innerHTML = "";
          if (!data.subscribers || data.subscribers.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="5" class="text-center py-8 text-gray-500">مشترکی وجود ندارد</td></tr>';
          } else {
            data.subscribers.forEach((sub) => {
              const tr = document.createElement("tr");
              const isActive = !sub.unsubscribedAt;
              tr.innerHTML = `
                <td>${sub.email}</td>
                <td>${sub.source || "-"}</td>
                <td>
                  <span class="admin-badge-${isActive ? "success" : "danger"}">
                    ${isActive ? "فعال" : "لغو شده"}
                  </span>
                </td>
                <td>${utils.formatDate(sub.createdAt)}</td>
                <td>${sub.unsubscribedAt ? utils.formatDate(sub.unsubscribedAt) : "-"}</td>
              `;
              tbody.appendChild(tr);
            });
          }
        }

        document
          .getElementById("subscriber-status-filter")
          ?.addEventListener("change", () => {
            handlers.newsletterSubscribers();
          });

        utils.refreshIcons();
      } catch (error) {
        console.error("Newsletter subscribers error:", error);
        document.getElementById("app-content").innerHTML = utils.showError(
          error.message
        );
      }
    },

    logout() {
      if (confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) {
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        }).then(() => {
          window.location.href = "/";
        });
      }
    },
  };

  // ========== ROUTER ==========
  const router = {
    routes: {
      dashboard: {
        title: "داشبورد",
        view: views.dashboard,
        handler: handlers.dashboard,
      },
      products: {
        title: "مدیریت محصولات",
        view: views.products,
        handler: handlers.products,
      },
      categories: {
        title: "مدیریت دسته‌بندی‌ها",
        view: views.categories,
        handler: handlers.categories,
      },
      colorThemes: {
        title: "تم‌های رنگی",
        view: views.colorThemes,
        handler: handlers.colorThemes,
      },
      orders: {
        title: "مدیریت سفارش‌ها",
        view: views.orders,
        handler: handlers.orders,
      },
      users: {
        title: "مدیریت کاربران",
        view: views.users,
        handler: handlers.users,
      },
      reviews: {
        title: "مدیریت نظرات",
        view: views.reviews,
        handler: handlers.reviews,
      },
      brands: {
        title: "مدیریت برندها",
        view: views.brands,
        handler: handlers.brands,
      },
      collections: {
        title: "مدیریت کالکشن‌ها",
        view: views.collections,
        handler: handlers.collections,
      },
      coupons: {
        title: "مدیریت کوپن‌ها",
        view: views.coupons,
        handler: handlers.coupons,
      },
      newsletter: {
        title: "خبرنامه",
        view: views.newsletter,
        handler: handlers.newsletter,
      },
      magazine: {
        title: "مدیریت مجله",
        view: views.magazine,
        handler: handlers.magazine,
      },
      magazineAuthors: {
        title: "نویسندگان مجله",
        view: views.magazineAuthors,
        handler: handlers.magazineAuthors,
      },
      magazineTags: {
        title: "برچسب‌های مجله",
        view: views.magazineTags,
        handler: handlers.magazineTags,
      },
      magazineCategories: {
        title: "دسته‌بندی‌های مجله",
        view: views.magazineCategories,
        handler: handlers.magazineCategories,
      },
      badges: {
        title: "مدیریت نشان‌ها",
        view: views.badges,
        handler: handlers.badges,
      },
      newsletterSubscribers: {
        title: "مشترکین خبرنامه",
        view: views.newsletterSubscribers,
        handler: handlers.newsletterSubscribers,
      },
      logout: { title: "خروج", view: null, handler: handlers.logout },
    },

    navigate(routeName) {
      const route = this.routes[routeName];
      if (!route) {
        console.error("Route not found:", routeName);
        return;
      }

      if (routeName === "logout") {
        route.handler();
        return;
      }

      state.currentRoute = routeName;

      document.getElementById("page-title").textContent = route.title;
      document.title = `KOALAW Admin | ${route.title}`;

      document.querySelectorAll(".admin-nav-item").forEach((item) => {
        item.classList.remove("active");
        if (item.dataset.route === routeName) {
          item.classList.add("active");
        }
      });

      const content = document.getElementById("app-content");
      if (route.view) {
        content.innerHTML = route.view();
        utils.refreshIcons();
      }

      if (route.handler) {
        route.handler();
      }

      document.getElementById("admin-sidebar")?.classList.remove("active");
    },

    init() {
      window.addEventListener("hashchange", () => {
        const hash = window.location.hash.slice(1) || "dashboard";
        this.navigate(hash);
      });

      document.querySelectorAll(".admin-nav-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const route = item.dataset.route;
          if (route) {
            window.location.hash = route;
          }
        });
      });

      const sidebarToggle = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("admin-sidebar");
      const overlay = document.getElementById("admin-sidebar-overlay");

      sidebarToggle?.addEventListener("click", () => {
        sidebar?.classList.toggle("active");
      });

      overlay?.addEventListener("click", () => {
        sidebar?.classList.remove("active");
      });

      const hash = window.location.hash.slice(1) || "dashboard";
      this.navigate(hash);
    },
  };

  // ========== INIT ==========
  document.addEventListener("DOMContentLoaded", () => {
    eventHandlers.init();
    router.init();
  });
})();
