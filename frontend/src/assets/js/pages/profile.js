// frontend/src/assets/js/pages/profile.js
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const root =
      document.getElementById("dashboard") || document.getElementById("orders");
    if (!root) return;

    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // Load profile data
    let profileData = null;
    let ordersData = [];
    let addressesData = [];

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        profileData = result.data.profile;
        updateProfileUI(profileData);
        updateStatsUI(profileData.stats);
      } else if (response.status === 401) {
        window.location.href = "/login?redirect=/profile";
        return;
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }

    // Load orders
    async function loadOrders(status = "all") {
      console.log("[ORDERS] Loading orders with status:", status);

      try {
        const url =
          status === "all"
            ? "/api/orders/me"
            : `/api/orders/me?status=${status}`;

        console.log("[ORDERS] Fetching from:", url);

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        console.log("[ORDERS] Response status:", response.status);

        if (response.status === 401) {
          console.error("[ORDERS] Unauthorized - redirecting to login");
          window.location.href = "/login?redirect=/profile";
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ORDERS] Error response:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("[ORDERS] API response:", result);

        // The backend returns { success, data: { items, meta } }
        ordersData = result?.data?.items || [];
        console.log("[ORDERS] Parsed orders data:", ordersData);

        updateOrdersUI(ordersData);
      } catch (err) {
        console.error("[ORDERS] Failed to load orders:", err);
        // Show error state in UI
        const ordersContainer = document.querySelector(
          "#orders .profile-card .space-y-4"
        );
        if (ordersContainer) {
          ordersContainer.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <i data-feather="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
          <p>خطا در بارگذاری سفارش‌ها</p>
          <p class="text-sm mt-2">${err.message}</p>
          <button onclick="location.reload()" class="btn-primary mt-4">تلاش مجدد</button>
        </div>
      `;
          KUtils.refreshIcons();
        }
      }
    }

    // Load addresses
    async function loadAddresses() {
      try {
        const response = await fetch("/api/profile/addresses", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          addressesData = result.data.addresses;
          updateAddressesUI(addressesData);
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    }

    // Update UI with profile data
    function updateProfileUI(profile) {
      // Profile image
      const profileImages = document.querySelectorAll(
        'img[alt="تصویر پروفایل"]'
      );
      profileImages.forEach((img) => {
        img.src = profile.profileImage || "/assets/images/profile.png";
      });

      // Name in header
      const nameElement = document.querySelector(".profile-card h2");
      if (nameElement) {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        nameElement.textContent = `سلام، ${fullName || "کوالا کوچولو"}`;
      }

      // Member since date
      const memberSince = document.querySelector(
        ".profile-card p.text-gray-600"
      );
      if (memberSince && profile.createdAt) {
        const date = new Date(profile.createdAt);
        const persianDate = new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(order.placedAt || order.createdAt));
        memberSince.textContent = `عضو از: ${persianDate}`;
      }

      // Customer tier and stars
      const tierBadge = document.querySelector(
        ".profile-card .flex.items-center.gap-2 span"
      );
      if (tierBadge) {
        tierBadge.textContent = profile.tierLabel || "مشتری عادی";
      }

      // Update stars
      const starsContainer = document.querySelector(
        ".profile-card .flex.text-yellow-400"
      );
      if (starsContainer) {
        starsContainer.innerHTML = "";
        for (let i = 0; i < profile.tierStars; i++) {
          const star = document.createElement("i");
          star.setAttribute("data-feather", "star");
          star.className = "w-4 h-4 fill-current";
          starsContainer.appendChild(star);
        }
        KUtils.refreshIcons();
      }

      // Profile settings form
      const firstNameInput = document.getElementById("firstName");
      if (firstNameInput) firstNameInput.value = profile.firstName || "";

      const lastNameInput = document.getElementById("lastName");
      if (lastNameInput) lastNameInput.value = profile.lastName || "";

      const emailInput = document.getElementById("email");
      if (emailInput) emailInput.value = profile.email || "";

      const phoneInput = document.getElementById("phone");
      if (phoneInput) phoneInput.value = profile.phone || "";

      const birthDateInput = document.getElementById("birthDate");
      if (birthDateInput) birthDateInput.value = profile.birthDate || "";

      // Gender dropdown
      const genderMap = {
        MALE: "مرد",
        FEMALE: "زن",
        UNDISCLOSED: "نامشخص",
      };
      const genderText = genderMap[profile.gender] || "نامشخص";
      const genderCurrent = document.querySelector(
        "#genderSelect .sort-current"
      );
      if (genderCurrent) genderCurrent.textContent = `جنسیت: ${genderText}`;

      const genderValue = document.getElementById("genderValue");
      if (genderValue)
        genderValue.value = profile.gender?.toLowerCase() || "undisclosed";

      // Update gender dropdown selected state
      const genderItems = document.querySelectorAll("#genderSelect .sort-item");
      genderItems.forEach((item) => {
        const isSelected =
          item.dataset.gender === profile.gender?.toLowerCase();
        item.setAttribute("aria-selected", String(isSelected));
      });

      // Notification toggles
      if (profile.notificationPrefs) {
        const prefs = profile.notificationPrefs;
        document.getElementById("notif-order-updates").checked =
          prefs.orderUpdates;
        document.getElementById("notif-promotions").checked = prefs.promotions;
        document.getElementById("notif-new-products").checked =
          prefs.newProducts;
        document.getElementById("notif-marketing").checked = prefs.marketing;
      }
    }

    // Update stats UI
    function updateStatsUI(stats) {
      if (!stats) return;

      const statsElements = document.querySelectorAll(".stats-card");
      if (statsElements.length >= 4) {
        statsElements[0].querySelector(".stats-number").textContent =
          stats.totalOrders.toLocaleString("fa-IR");
        statsElements[1].querySelector(".stats-number").textContent =
          stats.pendingShipment.toLocaleString("fa-IR");
        statsElements[2].querySelector(".stats-number").textContent =
          stats.wishlistCount.toLocaleString("fa-IR");
        statsElements[3].querySelector(".stats-number").textContent =
          stats.discountPercent + "%";
      }
    }

    // Update orders UI
    function updateOrdersUI(orders) {
      console.log("[ORDERS UI] Updating UI with orders:", orders);
      console.log("[ORDERS UI] Orders count:", orders?.length || 0);

      // Update recent orders in dashboard
      const recentOrdersContainer = document.querySelector(
        "#dashboard .profile-card .space-y-4"
      );
      console.log(
        "[ORDERS UI] Recent orders container found:",
        !!recentOrdersContainer
      );
      if (recentOrdersContainer) {
        recentOrdersContainer.innerHTML = "";
        const recentOrders = orders.slice(0, 2);

        if (recentOrders.length === 0) {
          recentOrdersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i data-feather="package" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
              <p>شما هنوز سفارشی ثبت نکرده‌اید</p>
            </div>
          `;
          KUtils.refreshIcons();
        } else {
          recentOrders.forEach((order) => {
            const orderCard = createOrderCard(order, true);
            recentOrdersContainer.appendChild(orderCard);
          });
        }
      }

      // Update full orders list
      const ordersContainer = document.querySelector(
        "#orders .profile-card .space-y-4"
      );
      console.log("[ORDERS UI] Orders container found:", !!ordersContainer);
      console.log("[ORDERS UI] Container element:", ordersContainer);
      if (ordersContainer) {
        ordersContainer.innerHTML = "";
        console.log("[ORDERS UI] Rendering", orders.length, "orders");
        if (orders.length === 0) {
          ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i data-feather="package" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
              <p>سفارشی یافت نشد</p>
            </div>
          `;
          KUtils.refreshIcons();
        } else {
          orders.forEach((order) => {
            const orderCard = createOrderCard(order, false);
            ordersContainer.appendChild(orderCard);
          });
        }
      }
    }

    // Update addresses UI (without button)
    function updateAddressesUI(addresses) {
      const container = document.getElementById("addresses-list");
      if (!container) return;

      container.innerHTML = "";

      if (addresses.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i data-feather="map-pin" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
            <p>شما هنوز آدرسی ثبت نکرده‌اید</p>
          </div>
        `;
        KUtils.refreshIcons();
        return;
      }

      addresses.forEach((address) => {
        const addressCard = createAddressCard(address);
        container.appendChild(addressCard);
      });

      KUtils.refreshIcons();
    }

    // Create address card
    function createAddressCard(address) {
      const div = document.createElement("div");
      const isDefault = address.isDefault;
      const borderClass = isDefault
        ? "border-primary bg-gradient-to-r from-rose-50 to-pink-50"
        : "border-gray-200 hover:border-primary";

      const fullAddress = [address.addressLine1, address.addressLine2]
        .filter(Boolean)
        .join("، ");
      const locationText = `${address.province}، ${address.city}${
        address.postalCode ? ` - ${address.postalCode}` : ""
      }`;

      div.className = `border ${borderClass} rounded-2xl p-6 transition-colors`;
      div.innerHTML = `
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="font-semibold text-gray-800 flex items-center gap-2">
              <i data-feather="${
                address.label === "محل کار" ? "briefcase" : "home"
              }" class="w-4 h-4"></i>
              ${address.label || "آدرس"}
            </h4>
            ${
              isDefault
                ? '<span class="text-xs bg-primary text-white px-2 py-1 rounded-full">آدرس پیش‌فرض</span>'
                : '<button class="text-xs text-primary hover:underline set-default-btn" data-address-id="' +
                  address.id +
                  '">تنظیم به عنوان پیش‌فرض</button>'
            }
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary text-sm edit-address-btn" data-address-id="${
              address.id
            }">ویرایش</button>
            <button class="btn-secondary text-sm text-red-600 delete-address-btn" data-address-id="${
              address.id
            }">حذف</button>
          </div>
        </div>
        <p class="text-gray-600 leading-relaxed mb-2">${fullAddress}</p>
        <p class="text-sm text-gray-500 mb-2">${locationText}</p>
        <p class="text-sm text-gray-500">${address.firstName} ${
          address.lastName
        } - ${address.phone}</p>
      `;

      return div;
    }

    // Create order card element
    function createOrderCard(order, isCompact) {
      console.log(
        "[CREATE ORDER CARD] Order data:",
        JSON.stringify(order, null, 2)
      );
      const div = document.createElement("div");
      div.className = "order-card";

      // Handle date safely
      let persianDate = "تاریخ نامشخص";
      try {
        const dateValue = order.placedAt || order.createdAt;
        if (dateValue) {
          const dateObj = new Date(dateValue);
          if (!isNaN(dateObj.getTime())) {
            persianDate = new Intl.DateTimeFormat("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(dateObj);
          } else {
            console.warn("[ORDER CARD] Invalid date value:", dateValue);
          }
        } else {
          console.warn("[ORDER CARD] No date field found in order:", order);
        }
      } catch (err) {
        console.error(
          "[ORDER CARD] Date formatting error:",
          err,
          "Order:",
          order
        );
      }
      const statusClass = getStatusClass(order.status);

      if (isCompact) {
        div.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <div>
        <h4 class="font-semibold text-gray-800">${order.orderNumber}</h4>
        <p class="text-sm text-gray-600">${persianDate}</p>
      </div>
      <span class="status-badge ${statusClass}">${order.statusLabel}</span>
    </div>
    <div class="flex items-center gap-3 mb-3">
      ${
        order.firstItem
          ? `
        <img src="${order.firstItem.imageUrl || "/assets/images/product.png"}" alt="محصول" class="w-12 h-12 rounded-lg object-cover" />
        <div>
          <p class="font-medium">${order.firstItem.title}${
            order.itemsCount > 1 ? ` + ${order.itemsCount - 1} محصول دیگر` : ""
          }</p>
          <p class="text-sm text-gray-600">${order.total.toLocaleString("fa-IR")} تومان</p>
        </div>
      `
          : `
        <div>
          <p class="font-medium">${order.itemsCount} محصول</p>
          <p class="text-sm text-gray-600">${order.total.toLocaleString("fa-IR")} تومان</p>
        </div>
      `
      }
    </div>
    <div class="flex justify-between items-center">
      <button class="btn-secondary text-sm">مشاهده جزئیات</button>
      <button class="btn-primary text-sm">خرید مجدد</button>
    </div>
  `;
      } else {
        // Full view - check if we have items array
        let itemsHTML = "";

        if (
          order.items &&
          Array.isArray(order.items) &&
          order.items.length > 0
        ) {
          // Full items array available
          itemsHTML = order.items
            .map(
              (item) => `
      <div class="flex items-center gap-4 mb-3">
        <img src="${item.imageUrl || "/assets/images/product.png"}" alt="${
          item.title
        }" class="w-16 h-16 rounded-lg object-cover" />
        <div class="flex-1">
          <h5 class="font-medium">${item.title}${
            item.variantName ? ` - ${item.variantName}` : ""
          }</h5>
          <p class="text-sm text-gray-600">تعداد: ${item.quantity.toLocaleString(
            "fa-IR"
          )}</p>
          <p class="text-sm font-semibold text-primary">${item.lineTotal.toLocaleString(
            "fa-IR"
          )} تومان</p>
        </div>
      </div>
    `
            )
            .join("");
        } else if (order.firstItem) {
          // Only firstItem available (summary view)
          itemsHTML = `
      <div class="flex items-center gap-4 mb-3">
        <img src="${order.firstItem.imageUrl || "/assets/images/product.png"}" alt="${
          order.firstItem.title
        }" class="w-16 h-16 rounded-lg object-cover" />
        <div class="flex-1">
          <h5 class="font-medium">${order.firstItem.title}</h5>
          <p class="text-sm text-gray-600">${order.itemsCount || 1} محصول</p>
        </div>
      </div>
      ${order.itemsCount > 1 ? `<p class="text-sm text-gray-500 mb-3">+ ${order.itemsCount - 1} محصول دیگر</p>` : ""}
    `;
        } else {
          // No items data
          itemsHTML = `
      <div class="text-gray-500 mb-3">
        <p>${order.itemsCount || 0} محصول</p>
      </div>
    `;
        }

        div.innerHTML = `
    <div class="flex justify-between items-start mb-4">
      <div>
        <h4 class="font-semibold text-gray-800 text-lg">${
          order.orderNumber
        }</h4>
        <p class="text-gray-600">سفارش داده شده در ${persianDate}</p>
      </div>
      <span class="status-badge ${statusClass}">${order.statusLabel}</span>
    </div>
    <div class="border-t pt-4">
      ${itemsHTML}
    </div>
    <div class="border-t pt-4 flex justify-between items-center">
      <div>
        <p class="text-lg font-bold">مجموع: ${order.total.toLocaleString(
          "fa-IR"
        )} تومان</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary">مشاهده جزئیات</button>
        <button class="btn-primary">خرید مجدد</button>
      </div>
    </div>
  `;
      }

      return div;
    }

    // Get status class for badge
    function getStatusClass(status) {
      const statusClasses = {
        DELIVERED: "status-delivered",
        PROCESSING: "status-processing",
        PAID: "status-processing",
        SHIPPED: "status-processing",
        AWAITING_PAYMENT: "status-pending",
        CANCELLED: "status-cancelled",
        RETURNED: "status-cancelled",
      };
      return statusClasses[status] || "status-pending";
    }

    // Load initial data
    await loadOrders();
    await loadAddresses();

    // Address Modal
    const addressModal = document.getElementById("address-modal");
    const addressForm = document.getElementById("address-form");
    const addressModalTitle = document.getElementById("address-modal-title");

    function openAddressModal(address = null) {
      if (address) {
        // Edit mode
        addressModalTitle.textContent = "ویرایش آدرس";
        document.getElementById("address-id").value = address.id;
        document.getElementById("address-label").value = address.label || "";
        document.getElementById("address-first-name").value = address.firstName;
        document.getElementById("address-last-name").value = address.lastName;
        document.getElementById("address-phone").value = address.phone;
        document.getElementById("address-postal-code").value =
          address.postalCode || "";
        document.getElementById("address-province").value = address.province;
        document.getElementById("address-city").value = address.city;
        document.getElementById("address-line1").value = address.addressLine1;
        document.getElementById("address-line2").value =
          address.addressLine2 || "";
        document.getElementById("address-is-default").checked =
          address.isDefault;
      } else {
        // Add mode
        addressModalTitle.textContent = "افزودن آدرس جدید";
        addressForm.reset();
        document.getElementById("address-id").value = "";
      }

      addressModal.classList.remove("hidden");
      addressModal.classList.add("flex");

      // Prevent background scroll on mobile
      document.body.style.overflow = "hidden";

      // Focus first input for better UX
      setTimeout(() => {
        document.getElementById("address-first-name")?.focus();
      }, 0);

      KUtils.refreshIcons();
    }

    function closeAddressModal() {
      addressModal.classList.add("hidden");
      addressModal.classList.remove("flex");
      addressForm.reset();

      // Re-enable background scroll
      document.body.style.overflow = "";
    }

    // Add address button
    document
      .getElementById("add-address-btn")
      ?.addEventListener("click", () => {
        openAddressModal();
      });

    // Close modal buttons
    document
      .getElementById("close-address-modal")
      ?.addEventListener("click", closeAddressModal);
    document
      .getElementById("cancel-address-modal")
      ?.addEventListener("click", closeAddressModal);

    // Click outside to close
    addressModal?.addEventListener("click", (e) => {
      if (e.target === addressModal) closeAddressModal();
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !addressModal.classList.contains("hidden")) {
        closeAddressModal();
      }
    });

    // Address form submit
    addressForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const addressId = document.getElementById("address-id").value;
      const isEdit = !!addressId;

      const formData = {
        label: document.getElementById("address-label").value || null,
        firstName: document.getElementById("address-first-name").value,
        lastName: document.getElementById("address-last-name").value,
        phone: document.getElementById("address-phone").value,
        postalCode:
          document.getElementById("address-postal-code").value || null,
        province: document.getElementById("address-province").value,
        city: document.getElementById("address-city").value,
        addressLine1: document.getElementById("address-line1").value,
        addressLine2: document.getElementById("address-line2").value || null,
        isDefault: document.getElementById("address-is-default").checked,
      };

      try {
        const url = isEdit
          ? `/api/profile/addresses/${addressId}`
          : "/api/profile/addresses";
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          closeAddressModal();
          await loadAddresses();
          alert(
            isEdit
              ? "✅ آدرس با موفقیت ویرایش شد!"
              : "✅ آدرس با موفقیت اضافه شد!"
          );
        } else {
          const error = await response.json();
          alert("❌ خطا: " + (error.error?.message || "خطایی رخ داد"));
        }
      } catch (err) {
        console.error("Failed to save address:", err);
        alert("❌ خطا در ذخیره‌سازی آدرس");
      }
    });

    // Address actions (edit, delete, set default)
    document.addEventListener("click", async (e) => {
      // Edit address
      if (e.target.closest(".edit-address-btn")) {
        const btn = e.target.closest(".edit-address-btn");
        const addressId = btn.dataset.addressId;
        const address = addressesData.find((a) => a.id === addressId);
        if (address) openAddressModal(address);
      }

      // Delete address
      if (e.target.closest(".delete-address-btn")) {
        const btn = e.target.closest(".delete-address-btn");
        const addressId = btn.dataset.addressId;

        if (confirm("آیا مطمئن هستید که می‌خواهید این آدرس را حذف کنید؟")) {
          try {
            const response = await fetch(
              `/api/profile/addresses/${addressId}`,
              {
                method: "DELETE",
                credentials: "include",
              }
            );

            if (response.ok) {
              await loadAddresses();
              alert("✅ آدرس با موفقیت حذف شد!");
            } else {
              alert("❌ خطا در حذف آدرس");
            }
          } catch (err) {
            console.error("Failed to delete address:", err);
            alert("❌ خطا در حذف آدرس");
          }
        }
      }

      // Set default address
      if (e.target.closest(".set-default-btn")) {
        const btn = e.target.closest(".set-default-btn");
        const addressId = btn.dataset.addressId;

        try {
          const response = await fetch(
            `/api/profile/addresses/${addressId}/set-default`,
            {
              method: "POST",
              credentials: "include",
            }
          );

          if (response.ok) {
            await loadAddresses();
            alert("✅ آدرس پیش‌فرض تغییر کرد!");
          } else {
            alert("❌ خطا در تنظیم آدرس پیش‌فرض");
          }
        } catch (err) {
          console.error("Failed to set default address:", err);
          alert("❌ خطا در تنظیم آدرس پیش‌فرض");
        }
      }
    });
    // Order action buttons (View Details & Reorder)
    document.addEventListener("click", async (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      // View Details button
      const detailsBtn = target.closest(".order-card .btn-secondary");
      if (detailsBtn) {
        const orderCard = detailsBtn.closest(".order-card");
        const orderNumber = orderCard?.querySelector("h4")?.textContent?.trim();

        if (orderNumber) {
          const order = ordersData.find((o) => o.orderNumber === orderNumber);
          if (order?.id) {
            // Option 1: Navigate to order detail page (if you have one)
            // window.location.href = `/order-detail?id=${order.id}`;

            // Option 2: Fetch full order details and show modal
            try {
              const response = await fetch(`/api/orders/me/${order.id}`, {
                credentials: "include",
                headers: { Accept: "application/json" },
              });

              if (response.ok) {
                const result = await response.json();
                const fullOrder = result.data.order;
                showOrderDetailsModal(fullOrder);
              } else {
                alert("❌ خطا در بارگذاری جزئیات سفارش");
              }
            } catch (err) {
              console.error("Failed to fetch order details:", err);
              alert("❌ خطا در بارگذاری جزئیات سفارش");
            }
          }
        }
        return;
      }

      // Reorder button
      const reorderBtn = target.closest(".order-card .btn-primary");
      if (reorderBtn) {
        const orderCard = reorderBtn.closest(".order-card");
        const orderNumber = orderCard?.querySelector("h4")?.textContent?.trim();

        if (orderNumber) {
          const order = ordersData.find((o) => o.orderNumber === orderNumber);
          if (order?.id) {
            if (
              !confirm(
                "آیا می‌خواهید محصولات این سفارش را دوباره به سبد اضافه کنید؟"
              )
            ) {
              return;
            }

            try {
              const response = await fetch(`/api/orders/${order.id}/reorder`, {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              });

              const payload = await response.json().catch(() => ({}));

              if (!response.ok) {
                const code = payload?.error?.code || payload?.code;
                if (code === "NO_REORDERABLE_ITEMS") {
                  alert(
                    "این سفارش شامل اقلامی است که امکان خرید مجدد خودکار ندارند."
                  );
                } else {
                  alert(
                    "❌ خطا: " +
                      (payload?.error?.message ||
                        payload?.message ||
                        "خطا در افزودن به سبد")
                  );
                }
                return;
              }

              const newCartId = payload?.data?.cartId;
              if (newCartId) {
                // Persist backend cart id
                KUtils?.setJSON?.("koalaw_backend_cart_id", newCartId);

                // Fetch backend cart and mirror it into local storage for UI
                const cartRes = await fetch(`/api/carts/${newCartId}`, {
                  credentials: "include",
                  headers: { Accept: "application/json" },
                });
                if (cartRes.ok) {
                  const cartJson = await cartRes.json();
                  const items = cartJson?.data?.cart?.items || [];

                  const uiItems = items.map((it) => ({
                    id: it.id, // use backend line id as UI id
                    title: it.title,
                    price: it.unitPrice,
                    qty: it.quantity,
                    image: it.imageUrl || "/assets/images/product.png",
                    variant: it.variantName || "",
                    // keep identifiers for later sync
                    productId: it.productId,
                    variantId: it.variantId || null,
                    currencyCode: it.currencyCode || "IRR",
                  }));

                  KUtils?.setJSON?.("koalaw_cart", uiItems);

                  // Update header badge if present
                  const navCnt = document.getElementById("nav-cart-count");
                  if (navCnt) {
                    const totalQty = uiItems.reduce(
                      (a, c) => a + (c.qty || 0),
                      0
                    );
                    navCnt.textContent =
                      typeof KUtils?.toFa === "function"
                        ? KUtils.toFa(totalQty)
                        : String(totalQty);
                  }
                }

                alert("✅ محصولات به سبد خرید اضافه شدند!");
                window.location.href = "/cart#/";
              } else {
                alert("❌ پاسخ معتبر از سرور دریافت نشد.");
              }
            } catch (err) {
              console.error("Failed to reorder:", err);
              alert("❌ خطا در افزودن به سبد خرید");
            }
          }
        }
        return;
      }
    });

    function showOrderDetailsModal(order) {
      // Overlay
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4";
      modal.style.backdropFilter = "blur(4px)";

      // Container (full-screen on mobile, dialog on >= sm)
      const container = document.createElement("div");
      container.className =
        "relative bg-white w-full h-full sm:w-[92vw] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-xl";

      // Header (sticky)
      const statusLabels = {
        draft: "پیش‌نویس",
        awaiting_payment: "در انتظار پرداخت",
        paid: "پرداخت شده",
        processing: "در حال پردازش",
        shipped: "ارسال شده",
        delivered: "تحویل داده شده",
        cancelled: "لغو شده",
        returned: "مرجوع شده",
      };

      const header = `
    <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
      <h3 class="text-lg sm:text-2xl font-bold truncate">جزئیات سفارش ${order.orderNumber}</h3>
      <button type="button" class="close-modal p-2 -m-2 text-gray-500 hover:text-gray-700 focus:outline-none">
        <i data-feather="x"></i>
      </button>
    </div>
  `;

      // Body (scrollable)
      const itemsHTML = (order.items || [])
        .map(
          (item) => `
    <div class="flex gap-3 sm:gap-4 border-b pb-3 mb-3">
      <img src="${item.imageUrl || "/assets/images/product.png"}" alt="${item.title}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <h5 class="font-semibold break-words">${item.title}${item.variantName ? ` - ${item.variantName}` : ""}</h5>
        <div class="mt-1 text-xs sm:text-sm text-gray-600 flex items-center gap-3 flex-wrap">
          <span>تعداد: ${item.quantity.toLocaleString("fa-IR")}</span>
          <span class="text-primary font-semibold">مبلغ: ${item.lineTotal.toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>
    </div>
  `
        )
        .join("");

      const body = `
    <div class="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-6">
      <div>
        <span class="status-badge ${getStatusClass(order.status)}">${statusLabels[order.status] || order.status}</span>
      </div>

      <div>
        <h4 class="font-bold mb-3">محصولات</h4>
        ${itemsHTML || `<div class="text-sm text-gray-500">محصولی برای نمایش وجود ندارد.</div>`}
      </div>

      <div class="space-y-2 border-t pt-4">
        <div class="flex justify-between text-sm sm:text-base">
          <span>مجموع محصولات:</span>
          <span>${(order.subtotal ?? order.total ?? 0).toLocaleString("fa-IR")} تومان</span>
        </div>
        ${
          order.discountTotal > 0
            ? `
          <div class="flex justify-between text-green-600 text-sm sm:text-base">
            <span>تخفیف:</span>
            <span>- ${order.discountTotal.toLocaleString("fa-IR")} تومان</span>
          </div>
        `
            : ""
        }
        <div class="flex justify-between text-sm sm:text-base">
          <span>هزینه ارسال:</span>
          <span>${order.shippingTotal > 0 ? order.shippingTotal.toLocaleString("fa-IR") + " تومان" : "رایگان"}</span>
        </div>
        ${
          order.giftWrapTotal > 0
            ? `
          <div class="flex justify-between text-sm sm:text-base">
            <span>بسته‌بندی هدیه:</span>
            <span>${order.giftWrapTotal.toLocaleString("fa-IR")} تومان</span>
          </div>
        `
            : ""
        }
        <div class="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
          <span>مجموع نهایی:</span>
          <span>${(order.total ?? 0).toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>

      <div class="border-t pt-4">
        <h4 class="font-bold mb-2">آدرس تحویل</h4>
        <p class="text-sm text-gray-600 leading-relaxed break-words">
          ${[order.shippingFirstName, order.shippingLastName].filter(Boolean).join(" ")}<br/>
          ${[order.shippingProvince, order.shippingCity].filter(Boolean).join("، ")}<br/>
          ${order.shippingAddressLine1 || ""}${order.shippingAddressLine2 ? "<br/>" + order.shippingAddressLine2 : ""}<br/>
          ${order.shippingPostalCode ? "کد پستی: " + order.shippingPostalCode : ""}<br/>
          ${order.shippingPhone ? "تلفن: " + order.shippingPhone : ""}
        </p>
      </div>

      ${
        order.note
          ? `
        <div class="border-t pt-4">
          <h4 class="font-bold mb-2">یادداشت</h4>
          <p class="text-sm text-gray-600 break-words">${order.note}</p>
        </div>
      `
          : ""
      }
    </div>
  `;

      container.innerHTML = header + body;
      modal.appendChild(container);
      document.body.appendChild(modal);

      // Lock background scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Wire up close actions
      const closeBtn = modal.querySelector(".close-modal");
      const close = () => {
        document.body.style.overflow = prevOverflow || "";
        modal.remove();
      };
      closeBtn?.addEventListener("click", close);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          close();
        }
      });

      // Focus for accessibility
      setTimeout(() => closeBtn?.focus(), 0);

      KUtils.refreshIcons();
    }

    // Profile image upload functionality
    const profileImageBtn = document.getElementById("profile-image-button");
    const profileImageInput = document.getElementById("profile-image-input");

    if (profileImageBtn && profileImageInput) {
      // Open file picker when camera button is clicked
      profileImageBtn.addEventListener("click", (e) => {
        e.preventDefault();
        profileImageInput.click();
      });

      // Handle file selection
      profileImageInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("❌ لطفاً فقط فایل تصویری انتخاب کنید");
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("❌ حجم فایل باید کمتر از ۵ مگابایت باشد");
          return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("image", file);

        // Show loading state
        const originalImages = document.querySelectorAll(
          'img[alt="تصویر پروفایل"]'
        );

        try {
          originalImages.forEach((img) => {
            img.style.opacity = "0.5";
          });

          const response = await fetch("/api/profile/image", {
            method: "POST",
            credentials: "include",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            const serverUrl = result?.data?.profileImage;

            const imgs = document.querySelectorAll('img[alt="تصویر پروفایل"]');
            if (serverUrl) {
              imgs.forEach((img) => {
                img.src = serverUrl;
                img.style.opacity = "1";
              });
            } else {
              // Fallback: local preview
              const reader = new FileReader();
              reader.onload = (ev) => {
                imgs.forEach((img) => {
                  img.src = ev.target.result;
                  img.style.opacity = "1";
                });
              };
              reader.readAsDataURL(file);
            }

            alert("✅ تصویر پروفایل با موفقیت آپلود شد! 🐨💕");
          } else {
            const error = await response.json();
            alert("❌ خطا: " + (error.error?.message || "خطا در آپلود تصویر"));
            originalImages.forEach((img) => {
              img.style.opacity = "1";
            });
          }
        } catch (err) {
          console.error("Failed to upload image:", err);
          alert("❌ خطا در آپلود تصویر");
          originalImages.forEach((img) => {
            img.style.opacity = "1";
          });
        }

        // Reset input
        profileImageInput.value = "";
      });
    }

    // Save profile changes
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
          firstName: document.getElementById("firstName")?.value,
          lastName: document.getElementById("lastName")?.value,
          phone: document.getElementById("phone")?.value,
          birthDate: document.getElementById("birthDate")?.value,
          gender: document.getElementById("genderValue")?.value?.toUpperCase(),
        };

        try {
          const response = await fetch("/api/profile", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            const result = await response.json();
            profileData = result.data.profile;
            updateProfileUI(profileData);
            alert("✅ تغییرات با موفقیت ذخیره شد!");
          } else {
            const error = await response.json();
            alert("❌ خطا: " + (error.error?.message || "خطایی رخ داد"));
          }
        } catch (err) {
          console.error("Failed to update profile:", err);
          alert("❌ خطا در ذخیره‌سازی");
        }
      });
    }

    // Save notification preferences
    const notifBtn = document.getElementById("save-notifications-btn");
    if (notifBtn) {
      notifBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const prefs = {
          orderUpdates: document.getElementById("notif-order-updates")?.checked,
          promotions: document.getElementById("notif-promotions")?.checked,
          newProducts: document.getElementById("notif-new-products")?.checked,
          marketing: document.getElementById("notif-marketing")?.checked,
        };

        try {
          const response = await fetch("/api/profile/notifications", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prefs),
          });

          if (response.ok) {
            alert("✅ تنظیمات اعلان‌ها ذخیره شد!");
          } else {
            alert("❌ خطا در ذخیره‌سازی");
          }
        } catch (err) {
          console.error("Failed to update notifications:", err);
          alert("❌ خطا در ذخیره‌سازی");
        }
      });
    }

    // Logout button
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
      logoutLink.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) {
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            });
            window.location.href = "/";
          } catch (err) {
            console.error("Logout failed:", err);
          }
        }
      });
    }

    // Sidebar tabs
    const items = document.querySelectorAll(".sidebar-nav-item[data-tab]");
    const contents = document.querySelectorAll(".tab-content");
    items.forEach((item) =>
      item.addEventListener("click", (e) => {
        e.preventDefault();
        items.forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        contents.forEach((c) => c.classList.add("hidden"));
        const id = item.getAttribute("data-tab");
        document.getElementById(id)?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
    );

    // Tab link buttons (like "مشاهده همه" in dashboard)
    document.querySelectorAll("[data-tab-link]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute("data-tab-link");
        const tabLink = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabLink) tabLink.click();
      });
    });

    // Order filter buttons
    const orderFilterBtns = document.querySelectorAll(
      "#orders .flex.gap-4.mb-6 button"
    );
    orderFilterBtns.forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        orderFilterBtns.forEach((b) => {
          b.classList.remove("btn-primary");
          b.classList.add("btn-secondary");
        });
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-primary");

        const statusMap = [
          "all",
          "awaiting_payment",
          "processing",
          "shipped",
          "delivered",
        ];
        await loadOrders(statusMap[index] || "all");
      });
    });

    // Card hover lift
    document.addEventListener(
      "mouseenter",
      (e) => {
        const card = e.target.closest(".order-card");
        if (card && window.gsap && window.innerWidth > 768) {
          gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" });
        }
      },
      true
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        const card = e.target.closest(".order-card");
        if (card && window.gsap && window.innerWidth > 768) {
          gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" });
        }
      },
      true
    );

    // Gender custom dropdown
    const genderWrap = document.getElementById("genderSelect");
    if (genderWrap) {
      const trigger = genderWrap.querySelector(".sort-select--button");
      const current = genderWrap.querySelector(".sort-current");
      const items = genderWrap.querySelectorAll(".sort-item");
      const hiddenInput = document.getElementById("genderValue");

      function open() {
        genderWrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
      function close() {
        genderWrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
      function update(key) {
        items.forEach((btn) =>
          btn.setAttribute("aria-selected", String(btn.dataset.gender === key))
        );
        const active = Array.from(items).find((b) => b.dataset.gender === key);
        current.textContent =
          "جنسیت: " + (active?.querySelector("span")?.textContent || "");
        if (hiddenInput) hiddenInput.value = key;
        KUtils.refreshIcons();
      }

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        genderWrap.classList.contains("is-open") ? close() : open();
      });
      items.forEach((btn) =>
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          update(btn.dataset.gender);
          close();
        })
      );
      document.addEventListener(
        "click",
        () => genderWrap.classList.contains("is-open") && close()
      );
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && genderWrap.classList.contains("is-open"))
          close();
      });
    }
  });
})();
