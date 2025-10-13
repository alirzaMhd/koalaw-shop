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
    colorThemes: [],
    badges: [],
    newsletterSubscribers: [],
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
        method: "PUT",
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
    // Product Form
    async product(productId = null) {
      panel.showLoading();

      try {
        const [brands, collections, colorThemes, badges] = await Promise.all([
          api.getBrands(),
          api.getCollections(),
          api.getColorThemesAdmin(),
          api.getBadges(),
        ]);

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

            <div class="admin-form-group">
              <label class="admin-form-label required">دسته‌بندی</label>
              <select name="category" class="admin-form-input" required>
                <option value="">انتخاب کنید</option>
                <option value="SKINCARE" ${data.category === "SKINCARE" ? "selected" : ""}>مراقبت از پوست</option>
                <option value="MAKEUP" ${data.category === "MAKEUP" ? "selected" : ""}>آرایش</option>
                <option value="FRAGRANCE" ${data.category === "FRAGRANCE" ? "selected" : ""}>عطر</option>
                <option value="HAIRCARE" ${data.category === "HAIRCARE" ? "selected" : ""}>مراقبت از مو</option>
                <option value="BODY_BATH" ${data.category === "BODY_BATH" ? "selected" : ""}>بدن و حمام</option>
              </select>
            </div>
          </div>

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
            <textarea name="description" class="admin-form-input" rows="4">${data.description || ""}</textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">مواد تشکیل‌دهنده</label>
            <textarea name="ingredients" class="admin-form-input" rows="3">${data.ingredients || ""}</textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">نحوه استفاده</label>
            <textarea name="howToUse" class="admin-form-input" rows="3">${data.howToUse || ""}</textarea>
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
          <h3 class="admin-form-section-title">تصویر محصول</h3>

          ${data.heroImageUrl
            ? `
            <div class="admin-form-group">
              <label class="admin-form-label">تصویر فعلی</label>
              <div class="admin-image-preview">
                <img src="${data.heroImageUrl}" alt="Current product image" id="current-image-preview" />
              </div>
            </div>
          `
            : ""
          }

          <div class="admin-form-group">
            <label class="admin-form-label">آپلود تصویر جدید</label>
            <input type="file" name="imageFile" id="image-file-input" class="admin-form-input" accept="image/*" />
            <small class="text-gray-500">فرمت‌های مجاز: JPG, PNG, WebP (حداکثر 5MB)</small>
          </div>

          <div id="new-image-preview" class="admin-image-preview" style="display: none;">
            <img src="" alt="Preview" id="new-image-preview-img" />
            <button type="button" class="admin-btn-remove-preview" id="remove-preview-btn">
              <i data-feather="x"></i>
              حذف
            </button>
          </div>

          <div class="admin-form-divider">
            <span>یا</span>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">آدرس URL تصویر</label>
            <input type="url" name="heroImageUrl" id="hero-image-url" class="admin-form-input" value="${data.heroImageUrl || ""}" placeholder="https://example.com/image.jpg" />
            <small class="text-gray-500">در صورت آپلود فایل، این فیلد نادیده گرفته می‌شود</small>
          </div>
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

        // Image preview functionality
        const fileInput = document.getElementById("image-file-input");
        const newPreview = document.getElementById("new-image-preview");
        const newPreviewImg = document.getElementById("new-image-preview-img");
        const removePreviewBtn = document.getElementById("remove-preview-btn");
        const urlInput = document.getElementById("hero-image-url");
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
          row.querySelector(".remove-variant-btn")?.addEventListener("click", () => {
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
              const formData = new FormData(e.target);
              const imageFile = formData.get("imageFile");

              let heroImageUrl = null;

              // Handle image upload
              if (imageFile && imageFile.size > 0) {
                console.log("Uploading new image file...");
                const uploadFormData = new FormData();
                uploadFormData.append("image", imageFile);

                try {
                  const uploadResponse = await fetch(
                    "/api/upload/product-image",
                    {
                      method: "POST",
                      credentials: "include",
                      body: uploadFormData,
                    }
                  );

                  if (uploadResponse.status === 401) {
                    throw new Error(
                      "احراز هویت انجام نشد. لطفا دوباره وارد شوید."
                    );
                  }

                  if (uploadResponse.status === 403) {
                    throw new Error(
                      "شما دسترسی لازم برای آپلود تصویر را ندارید."
                    );
                  }

                  if (!uploadResponse.ok) {
                    const errorData = await uploadResponse
                      .json()
                      .catch(() => ({}));
                    throw new Error(errorData.message || "خطا در آپلود تصویر");
                  }

                  const uploadResult = await uploadResponse.json();
                  heroImageUrl =
                    uploadResult.data?.imageUrl || uploadResult.imageUrl;
                  console.log("Image uploaded successfully:", heroImageUrl);
                } catch (uploadError) {
                  console.error("Upload error:", uploadError);
                  throw new Error("خطا در آپلود تصویر: " + uploadError.message);
                }
              } else {
                const urlValue = formData.get("heroImageUrl");
                if (urlValue && typeof urlValue === "string") {
                  const trimmedUrl = urlValue.trim();
                  if (trimmedUrl !== "") {
                    if (
                      trimmedUrl.startsWith("/") ||
                      trimmedUrl.startsWith("http")
                    ) {
                      heroImageUrl = trimmedUrl;
                    } else {
                      throw new Error(
                        "آدرس URL تصویر باید با / یا http شروع شود."
                      );
                    }
                  } else if (isEdit && data.heroImageUrl) {
                    heroImageUrl = data.heroImageUrl;
                  }
                } else if (isEdit && data.heroImageUrl) {
                  heroImageUrl = data.heroImageUrl;
                }
              }

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
              const category = getStringValue("category");
              const price = getNumberValue("price");

              if (!title) throw new Error("عنوان محصول الزامی است.");
              if (!brandId) throw new Error("انتخاب برند الزامی است.");
              if (!category) throw new Error("انتخاب دسته‌بندی الزامی است.");
              if (!price || price <= 0)
                throw new Error(
                  "قیمت محصول الزامی است و باید بیشتر از صفر باشد."
                );

              payload.title = title;
              payload.brandId = brandId;
              payload.category = category;
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

              if (subtitle) payload.subtitle = subtitle;
              if (slug) payload.slug = slug;
              if (description) payload.description = description;
              if (ingredients) payload.ingredients = ingredients;
              if (howToUse) payload.howToUse = howToUse;
              if (internalNotes) payload.internalNotes = internalNotes;
              if (collectionId) payload.collectionId = collectionId;
              if (colorThemeId) payload.colorThemeId = colorThemeId;

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

              // Image URL
              if (
                heroImageUrl &&
                typeof heroImageUrl === "string" &&
                heroImageUrl.trim() !== ""
              ) {
                payload.heroImageUrl = heroImageUrl.trim();
              }
              // Collect variants
              const variantRows = Array.from(document.querySelectorAll(".variant-row"));
              const variantsPayload = [];
              for (let i = 0; i < variantRows.length; i++) {
                const row = variantRows[i];
                const get = (sel) => row.querySelector(sel);
                const variantName = get('input[name="variantName"]')?.value?.trim();
                if (!variantName) continue; // skip incomplete rows
                const sku = get('input[name="sku"]')?.value?.trim();
                const priceStr = get('input[name="price"]')?.value;
                const stockStr = get('input[name="stock"]')?.value;
                const colorName = get('input[name="colorName"]')?.value?.trim();
                const colorHexCode = get('input[name="colorHexCode"]')?.value?.trim();
                const isActive = get('input[name="isActive"]')?.checked ?? true;

                const v = {
                  variantName,
                  ...(sku ? { sku } : {}),
                  ...(priceStr ? { price: parseInt(priceStr, 10) } : {}),
                  ...(stockStr ? { stock: parseInt(stockStr, 10) } : { stock: 0 }),
                  ...(colorName ? { colorName } : {}),
                  ...(colorHexCode && /^#[0-9A-Fa-f]{6}$/.test(colorHexCode) ? { colorHexCode } : {}),
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

              console.log("=== PRODUCT FORM SUBMISSION ===");
              console.log("Is Edit:", isEdit);
              console.log("Product ID:", productId);
              console.log("Payload:", JSON.stringify(payload, null, 2));
              console.log("================================");

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
                <input type="email" class="admin-form-input" value="${user.user.email}" disabled />
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">نام</label>
                <input type="text" class="admin-form-input" value="${user.user.firstName || ""} ${user.user.lastName || ""}" disabled />
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">تلفن</label>
                <input type="text" class="admin-form-input" value="${user.user.phone || "-"}" disabled />
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">تعداد سفارش‌ها</label>
                  <input type="text" class="admin-form-input" value="${user.user._count?.orders || 0}" disabled />
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">تعداد نظرات</label>
                  <input type="text" class="admin-form-input" value="${user.user._count?.productReviews || 0}" disabled />
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label required">نقش</label>
                <select name="role" class="admin-form-input" required>
                  <option value="CUSTOMER" ${user.user.role === "CUSTOMER" ? "selected" : ""}>مشتری</option>
                  <option value="STAFF" ${user.user.role === "STAFF" ? "selected" : ""}>کارمند</option>
                  <option value="ADMIN" ${user.user.role === "ADMIN" ? "selected" : ""}>ادمین</option>
                </select>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label required">سطح</label>
                <select name="tier" class="admin-form-input" required>
                  <option value="STANDARD" ${user.user.customerTier === "STANDARD" ? "selected" : ""}>عادی</option>
                  <option value="VIP" ${user.user.customerTier === "VIP" ? "selected" : ""}>VIP</option>
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

    // Magazine Form
    async magazine(postId = null) {
      panel.showLoading();

      try {
        const [authorsResponse, tagsResponse] = await Promise.all([
          api.getMagazineAuthors(),
          api.getMagazineTags(),
        ]);

        const authors = authorsResponse?.data || authorsResponse || [];
        const tags = tagsResponse?.data || tagsResponse || [];

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
                console.log("Uploading magazine hero image...");
                const uploadFormData = new FormData();
                uploadFormData.append("image", imageFile);

                try {
                  const uploadResponse = await fetch(
                    "/api/upload/product-image",
                    {
                      method: "POST",
                      credentials: "include",
                      body: uploadFormData,
                    }
                  );

                  if (!uploadResponse.ok) {
                    const errorData = await uploadResponse
                      .json()
                      .catch(() => ({}));
                    throw new Error(errorData.message || "خطا در آپلود تصویر");
                  }

                  const uploadResult = await uploadResponse.json();
                  heroImageUrl =
                    uploadResult.data?.imageUrl || uploadResult.imageUrl;
                  console.log("Hero image uploaded:", heroImageUrl);
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

              console.log("Magazine payload:", payload);

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

      document
        .getElementById("collection-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const payload = {
            name: formData.get("name"),
          };

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
        utils.showToast("مشاهده جزئیات سفارش: " + id, "info");
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
    },
  };

  // ========== VIEW RENDERERS ==========
  const views = {
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
                <td>${product.category}</td>
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
