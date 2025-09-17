
// src/assets/js/login.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (!form) return;

    window.AOS && AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 40 });
    KUtils.refreshIcons();
    KUtils.createClouds(".cloud-animation", 6);
    KUtils.createParticles(".particle-overlay", 9);

    const phone = document.getElementById("phone");
    const msg = document.getElementById("phoneMsg");
    const btn = document.getElementById("btnSend");

    function normalizeIranPhone(p) {
      const d = (p || "").replace(/\D/g, "");
      if (d.startsWith("0098")) return "0" + d.slice(4);
      if (d.startsWith("98")) return "0" + d.slice(2);
      if (d.startsWith("0")) return d;
      if (d.startsWith("9")) return "0" + d;
      return d;
    }
    function isValidIranMobile(n) { return /^09\d{9}$/.test(n); }

    phone && phone.addEventListener("input", () => {
      phone.value = phone.value.replace(/[^\d\s]/g, "");
      msg.textContent = "";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const normalized = normalizeIranPhone(phone.value);
      if (!isValidIranMobile(normalized)) {
        msg.textContent = "لطفاً شماره موبایل معتبر وارد کنید (با 09 شروع شود).";
        return;
      }
      msg.textContent = ""; btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
          <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg> در حال ارسال...</span>`;
      try {
        await new Promise(res => setTimeout(res, 900));
        localStorage.setItem("signup_phone", normalized);
        window.location.href = `verify.html?phone=${encodeURIComponent(normalized)}`;
      } catch {
        msg.textContent = "خطا در ارسال کد. لطفاً دوباره تلاش کنید.";
        btn.textContent = "ارسال کد"; btn.disabled = false;
      }
    });
  });
})();