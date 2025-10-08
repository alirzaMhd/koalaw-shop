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
          <button onclick="location.reload()" class="admin-btn admin-btn-primary">
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

    getDashboard() {
      return this.fetch("/api/admin/dashboard");
    },

    getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/products?${query}`);
    },

    deleteProduct(id) {
      return this.fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    },

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

    getUsers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.fetch(`/api/admin/users?${query}`);
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

    getNewsletterStats() {
      return this.fetch("/api/admin/newsletter/stats");
    },
  };

  // ========== VIEW RENDERERS ==========
  const views = {
    // Dashboard View
    dashboard() {
      return `
        <!-- Stats Cards -->
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

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <!-- Recent Orders -->
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

          <!-- Top Products -->
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

        <!-- Recent Users -->
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

    // Products View
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
          <a href="/admin/products/new" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن محصول</span>
          </a>
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

    // Orders View
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

    // Users View
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

    // Reviews View
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

    // Brands View
    brands() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت برندها</h2>
          <button onclick="AdminApp.showCreateBrandModal()" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن برند</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="brands-grid">
          ${utils.showLoading()}
        </div>
      `;
    },

    // Collections View
    collections() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت کالکشن‌ها</h2>
          <button onclick="AdminApp.showCreateCollectionModal()" class="admin-btn admin-btn-primary">
            <i data-feather="plus"></i>
            <span>افزودن کالکشن</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="collections-grid">
          ${utils.showLoading()}
        </div>
      `;
    },

    // Coupons View
    coupons() {
      return `
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold">مدیریت کوپن‌ها</h2>
          <button onclick="AdminApp.showCreateCouponModal()" class="admin-btn admin-btn-primary">
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

    // Newsletter View
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

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">ارسال خبرنامه</h3>
          </div>
          <div class="admin-card-body">
            <p class="text-gray-600 mb-4">برای ارسال خبرنامه از صفحه اصلی استفاده کنید.</p>
            <a href="/admin/newsletter/compose" class="admin-btn admin-btn-primary">
              <i data-feather="mail"></i>
              <span>ایجاد خبرنامه</span>
            </a>
          </div>
        </div>
      `;
    },

    // Magazine View
    magazine() {
      return `
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">مدیریت مجله</h3>
            <a href="/admin/magazine/new" class="admin-btn admin-btn-primary">
              <i data-feather="plus"></i>
              <span>مقاله جدید</span>
            </a>
          </div>
          <div class="admin-card-body">
            <p class="text-gray-600">مدیریت مقالات مجله از طریق API موجود است.</p>
            <div class="mt-4">
              <a href="/magazine" target="_blank" class="admin-link">
                مشاهده مجله
              </a>
            </div>
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

        // Update stats
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

        // Update pending reviews badge
        if (data.stats.pendingReviews > 0) {
          const badge = document.getElementById("pending-reviews-badge");
          if (badge) {
            badge.textContent = utils.toFa(data.stats.pendingReviews);
            badge.classList.remove("hidden");
          }
        }

        // Render recent orders
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

        // Render top products
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
                    ${utils.toFa(product.ratingCount || 0)} نظر - ${(product.ratingAvg || 0)} ⭐
                  </div>
                </div>
                <div class="font-semibold">${utils.toIRR(product.price)}</div>
              `;
              productsList.appendChild(productItem);
            });
          }
        }

        // Render recent users
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
                    <button onclick="AdminApp.editProduct('${product.id}')" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="AdminApp.deleteProduct('${product.id}')" class="admin-btn admin-btn-danger">
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
                  <button onclick="AdminApp.viewOrder('${order.id}')" class="admin-btn admin-btn-secondary">
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
                  <button onclick="AdminApp.editUser('${user.id}')" class="admin-btn admin-btn-secondary">
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
                  <button onclick="AdminApp.approveReview('${review.id}')" class="admin-btn admin-btn-primary">
                    <i data-feather="check" class="w-4 h-4"></i>
                    تایید
                  </button>
                  <button onclick="AdminApp.rejectReview('${review.id}')" class="admin-btn admin-btn-danger">
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
                    <button onclick="AdminApp.editBrand('${brand.id}')" class="admin-btn admin-btn-secondary flex-1">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                      ویرایش
                    </button>
                    <button onclick="AdminApp.deleteBrand('${brand.id}')" class="admin-btn admin-btn-danger">
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
                    <button onclick="AdminApp.editCollection('${collection.id}')" class="admin-btn admin-btn-secondary flex-1">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                      ویرایش
                    </button>
                    <button onclick="AdminApp.deleteCollection('${collection.id}')" class="admin-btn admin-btn-danger">
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
                    <button onclick="AdminApp.editCoupon('${coupon.id}')" class="admin-btn admin-btn-secondary">
                      <i data-feather="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="AdminApp.deleteCoupon('${coupon.id}')" class="admin-btn admin-btn-danger">
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
      utils.refreshIcons();
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
      logout: { title: "خروج", view: null, handler: handlers.logout },
    },

    navigate(routeName) {
      const route = this.routes[routeName];
      if (!route) {
        console.error("Route not found:", routeName);
        return;
      }

      // Handle logout specially
      if (routeName === "logout") {
        route.handler();
        return;
      }

      // Update state
      state.currentRoute = routeName;

      // Update page title
      document.getElementById("page-title").textContent = route.title;
      document.title = `KOALAW Admin | ${route.title}`;

      // Update active nav item
      document.querySelectorAll(".admin-nav-item").forEach((item) => {
        item.classList.remove("active");
        if (item.dataset.route === routeName) {
          item.classList.add("active");
        }
      });

      // Render view
      const content = document.getElementById("app-content");
      if (route.view) {
        content.innerHTML = route.view();
        utils.refreshIcons();
      }

      // Call handler
      if (route.handler) {
        route.handler();
      }

      // Close mobile sidebar
      document.getElementById("admin-sidebar")?.classList.remove("active");
    },

    init() {
      // Handle hash navigation
      window.addEventListener("hashchange", () => {
        const hash = window.location.hash.slice(1) || "dashboard";
        this.navigate(hash);
      });

      // Handle nav clicks
      document.querySelectorAll(".admin-nav-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const route = item.dataset.route;
          if (route) {
            window.location.hash = route;
          }
        });
      });

      // Mobile sidebar toggle
      document
        .getElementById("sidebar-toggle")
        ?.addEventListener("click", () => {
          document.getElementById("admin-sidebar")?.classList.toggle("active");
        });

      // Initial route
      const hash = window.location.hash.slice(1) || "dashboard";
      this.navigate(hash);
    },
  };

  // ========== PUBLIC API (for onclick handlers) ==========
  window.AdminApp = {
    // Product actions
    async deleteProduct(id) {
      if (confirm("آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟")) {
        try {
          await api.deleteProduct(id);
          alert("محصول با موفقیت حذف شد");
          handlers.products();
        } catch (error) {
          alert("خطا: " + error.message);
        }
      }
    },

    editProduct(id) {
      window.location.href = `/admin/products/edit/${id}`;
    },

    // Order actions
    viewOrder(id) {
      alert("مشاهده جزئیات سفارش: " + id);
    },

    // User actions
    editUser(id) {
      alert("ویرایش کاربر: " + id);
    },

    // Review actions
    async approveReview(id) {
      try {
        await api.updateReviewStatus(id, "APPROVED");
        alert("نظر تایید شد");
        handlers.reviews();
      } catch (error) {
        alert("خطا: " + error.message);
      }
    },

    async rejectReview(id) {
      try {
        await api.updateReviewStatus(id, "REJECTED");
        alert("نظر رد شد");
        handlers.reviews();
      } catch (error) {
        alert("خطا: " + error.message);
      }
    },

    // Brand actions
    showCreateBrandModal() {
      const name = prompt("نام برند:");
      if (name) {
        api
          .createBrand({ name })
          .then(() => {
            alert("برند با موفقیت ایجاد شد");
            handlers.brands();
          })
          .catch((error) => {
            alert("خطا: " + error.message);
          });
      }
    },

    editBrand(id) {
      const brand = state.brands.find((b) => b.id === id);
      if (brand) {
        const name = prompt("نام جدید برند:", brand.name);
        if (name) {
          api
            .updateBrand(id, { name })
            .then(() => {
              alert("برند با موفقیت ویرایش شد");
              handlers.brands();
            })
            .catch((error) => {
              alert("خطا: " + error.message);
            });
        }
      }
    },

    async deleteBrand(id) {
      if (confirm("آیا مطمئن هستید؟")) {
        try {
          await api.deleteBrand(id);
          alert("برند حذف شد");
          handlers.brands();
        } catch (error) {
          alert("خطا: " + error.message);
        }
      }
    },

    // Collection actions
    showCreateCollectionModal() {
      const name = prompt("نام کالکشن:");
      if (name) {
        api
          .createCollection({ name })
          .then(() => {
            alert("کالکشن با موفقیت ایجاد شد");
            handlers.collections();
          })
          .catch((error) => {
            alert("خطا: " + error.message);
          });
      }
    },

    editCollection(id) {
      const collection = state.collections.find((c) => c.id === id);
      if (collection) {
        const name = prompt("نام جدید کالکشن:", collection.name);
        if (name) {
          api
            .updateCollection(id, { name })
            .then(() => {
              alert("کالکشن با موفقیت ویرایش شد");
              handlers.collections();
            })
            .catch((error) => {
              alert("خطا: " + error.message);
            });
        }
      }
    },

    async deleteCollection(id) {
      if (confirm("آیا مطمئن هستید؟")) {
        try {
          await api.deleteCollection(id);
          alert("کالکشن حذف شد");
          handlers.collections();
        } catch (error) {
          alert("خطا: " + error.message);
        }
      }
    },

    // Coupon actions
    showCreateCouponModal() {
      alert("فرم ایجاد کوپن (می‌توانید یک مدال کامل بسازید)");
    },

    editCoupon(id) {
      alert("ویرایش کوپن: " + id);
    },

    async deleteCoupon(id) {
      if (confirm("آیا مطمئن هستید؟")) {
        try {
          await api.deleteCoupon(id);
          alert("کوپن حذف شد");
          handlers.coupons();
        } catch (error) {
          alert("خطا: " + error.message);
        }
      }
    },
  };

  // ========== INIT ==========
  document.addEventListener("DOMContentLoaded", () => {
    router.init();
  });
})();
