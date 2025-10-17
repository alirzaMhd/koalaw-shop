// src/assets/js/pages/forgot-password.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");
    if (!form) return;

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

    const email = document.getElementById("email");
    const emailMsg = document.getElementById("emailMsg");
    const btn = document.getElementById("btnSubmit");

    function isValidEmail(e) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    }

    const setBtnLoading = (html) => {
      btn.disabled = true;
      btn.innerHTML = html;
    };
    const resetBtn = () => {
      btn.disabled = false;
      btn.textContent = "ارسال کد بازیابی";
    };

    email && email.addEventListener("input", () => (emailMsg.textContent = ""));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailValue = email.value.trim().toLowerCase();

      // Validate email
      if (!isValidEmail(emailValue)) {
        emailMsg.textContent = "لطفاً یک ایمیل معتبر وارد کنید.";
        return;
      }

      emailMsg.textContent = "";
      setBtnLoading(`<span class="inline-flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
          <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg> در حال ارسال...</span>`);

      try {
        const response = await fetch("/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: emailValue }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.success) {
          // Store email and redirect to reset page
          localStorage.setItem("reset_email", emailValue);
          window.location.href = `/reset-password?email=${encodeURIComponent(
            emailValue
          )}`;
          return;
        }

        // Handle errors
        emailMsg.textContent =
          data?.error?.message ||
          data?.message ||
          "خطا در ارسال کد. لطفاً دوباره تلاش کنید.";
        resetBtn();
      } catch (error) {
        logger.error("Forgot password error:", error);
        emailMsg.textContent = "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.";
        resetBtn();
      }
    });
  });
})();
