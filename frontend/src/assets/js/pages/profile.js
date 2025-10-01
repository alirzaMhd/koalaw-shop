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
      try {
        const url =
          status === "all"
            ? "/api/profile/orders"
            : `/api/profile/orders?status=${status}`;
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          ordersData = result.data.orders;
          updateOrdersUI(ordersData);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
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
        }).format(date);
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
      // Update recent orders in dashboard
      const recentOrdersContainer = document.querySelector(
        "#dashboard .profile-card .space-y-4"
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
      if (ordersContainer) {
        ordersContainer.innerHTML = "";
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
      const div = document.createElement("div");
      div.className = "order-card";

      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(order.createdAt));

      const statusClass = getStatusClass(order.status);

      if (isCompact) {
        div.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-semibold text-gray-800">${order.orderNumber}</h4>
              <p class="text-sm text-gray-600">${persianDate}</p>
            </div>
            <span class="status-badge ${statusClass}">${
          order.statusLabel
        }</span>
          </div>
          <div class="flex items-center gap-3 mb-3">
            <img src="${
              order.items[0]?.imageUrl || "/assets/images/product.png"
            }" alt="محصول" class="w-12 h-12 rounded-lg object-cover" />
            <div>
              <p class="font-medium">${order.items[0]?.title || "محصول"} ${
          order.itemCount > 1 ? `+ ${order.itemCount - 1} محصول دیگر` : ""
        }</p>
              <p class="text-sm text-gray-600">${order.total.toLocaleString(
                "fa-IR"
              )} تومان</p>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <button class="btn-secondary text-sm">مشاهده جزئیات</button>
            <button class="btn-primary text-sm">خرید مجدد</button>
          </div>
        `;
      } else {
        const itemsHTML = order.items
          .map(
            (item) => `
          <div class="flex items-center gap-4 mb-3">
            <img src="${item.imageUrl}" alt="${
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

        div.innerHTML = `
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="font-semibold text-gray-800 text-lg">${
                order.orderNumber
              }</h4>
              <p class="text-gray-600">سفارش داده شده در ${persianDate}</p>
            </div>
            <span class="status-badge ${statusClass}">${
          order.statusLabel
        }</span>
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
