// src/assets/js/pages/payment-return.js
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    // Initialize AOS, icons, clouds, and particles like login page
    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.createClouds(".cloud-animation", 6);
    KUtils.createParticles(".particle-overlay", 9);

    const loadingState = document.getElementById("loading-state");
    const successState = document.getElementById("success-state");
    const errorState = document.getElementById("error-state");
    const errorMessage = document.getElementById("error-message");

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authority = urlParams.get("Authority");
    const status = urlParams.get("Status");

    if (!authority) {
      showError("پارامترهای پرداخت یافت نشد");
      return;
    }

    if (status !== "OK") {
      showError("پرداخت توسط کاربر لغو شد یا با خطا مواجه شد");
      return;
    }

    // Get pending payment info from localStorage
    const pendingPayment = KUtils.getJSON("koalaw_pending_payment");

    if (!pendingPayment || pendingPayment.authority !== authority) {
      showError("اطلاعات پرداخت یافت نشد");
      return;
    }

    // Verify payment with backend
    try {
      const response = await fetch(
        `/api/payments/zarinpal/return?Authority=${authority}&Status=OK`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("خطا در تأیید پرداخت");
      }

      const result = await response.json();

      if (result.success && result.data.verified) {
        // Payment successful
        showSuccess(result.data);

        // Clear pending payment and cart
        localStorage.removeItem("koalaw_pending_payment");
        localStorage.removeItem("koalaw_cart");
      } else {
        showError("تأیید پرداخت با خطا مواجه شد");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      showError(error.message || "خطا در بررسی پرداخت");
    }

    function showSuccess(data) {
      loadingState.classList.add("hidden");
      successState.classList.remove("hidden");

      const lastOrder = KUtils.getJSON("koalaw_last_order");
      if (lastOrder) {
        document.getElementById("order-number").textContent =
          lastOrder.orderNumber || "-";
        document.getElementById("amount").textContent = KUtils.toIRR(
          lastOrder.amounts?.total || 0
        );
      }

      if (data.refId) {
        document.getElementById("ref-id").textContent = data.refId;
      }

      KUtils.refreshIcons();
    }

    function showError(msg) {
      loadingState.classList.add("hidden");
      errorState.classList.remove("hidden");
      errorMessage.textContent = msg;

      // Retry button
      const retryBtn = document.getElementById("retry-btn");
      retryBtn &&
        retryBtn.addEventListener("click", () => {
          window.location.href = "/cart#/payment";
        });

      KUtils.refreshIcons();
    }
  });
})();
