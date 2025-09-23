// src/assets/js/pages/verify.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("otpForm");
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

    // Adjust this if your API is under a different prefix (e.g. "/api/auth")
    const API_BASE = "/auth";

    const qs = (s) => document.querySelector(s);
    const qsa = (s) => Array.from(document.querySelectorAll(s));

    function normalizeIranPhone(p) {
      const d = (p || "").replace(/\D/g, "");
      if (d.startsWith("0098")) return "0" + d.slice(4);
      if (d.startsWith("98")) return "0" + d.slice(2);
      if (d.startsWith("0")) return d;
      if (d.startsWith("9")) return "0" + d;
      return p || "";
    }
    function maskPhone(p) {
      const n = normalizeIranPhone(p).replace(/\D/g, "");
      if (!n) return "";
      return n.replace(/\d(?=\d{4})/g, "•");
    }

    const params = new URLSearchParams(location.search);
    const phoneRaw =
      params.get("phone") || localStorage.getItem("signup_phone") || "";
    const phoneInfo = qs("#phoneInfo");
    const masked = phoneRaw ? maskPhone(phoneRaw) : "";
    if (masked && phoneInfo)
      phoneInfo.innerHTML = `کد ۶ رقمی به شماره <span class="ltr-numbers" dir="ltr">${masked}</span> ارسال شد.`;

    const inputs = qsa(".otp-input");
    const btnVerify = qs("#btnVerify");
    const otpMsg = qs("#otpMsg");
    inputs[0]?.focus();

    const getCode = () => inputs.map((i) => i.value).join("");
    function updateBtn() {
      const filled = getCode().length === inputs.length;
      if (btnVerify) btnVerify.disabled = !filled;
      if (filled && otpMsg) otpMsg.textContent = "";
    }

    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", (e) => {
        const v = e.target.value.replace(/\D/g, "");
        e.target.value = v.slice(0, 1);
        if (v && idx < inputs.length - 1) inputs[idx + 1].focus();
        updateBtn();
      });
      inp.addEventListener("keydown", (e) => {
        if (
          (e.key === "Backspace" || e.key === "Delete") &&
          !inp.value &&
          idx > 0
        )
          inputs[idx - 1].focus();
        if (e.key === "ArrowLeft" && idx > 0) inputs[idx - 1].focus();
        if (e.key === "ArrowRight" && idx < inputs.length - 1)
          inputs[idx + 1].focus();
      });
      inp.addEventListener("paste", (e) => {
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "");
        if (!pasted) return;
        e.preventDefault();
        pasted
          .split("")
          .slice(0, inputs.length)
          .forEach((ch, i) => {
            inputs[i].value = ch;
          });
        inputs[Math.min(pasted.length, inputs.length) - 1]?.focus();
        updateBtn();
      });
    });

    // Submit: verify with backend, set httpOnly cookies, redirect
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const code = getCode();
      if (code.length !== inputs.length) {
        otpMsg.textContent = "لطفاً کد ۶ رقمی را کامل وارد کنید.";
        return;
      }

      const phone = normalizeIranPhone(phoneRaw || "");
      if (!/^09\d{9}$/.test(phone)) {
        otpMsg.textContent = "شماره موبایل نامعتبر است. ویرایش شماره را بزنید.";
        return;
      }

      otpMsg.textContent = "";
      if (btnVerify) {
        btnVerify.disabled = true;
        const originalHTML = btnVerify.innerHTML;
        btnVerify.innerHTML = `<span class="inline-flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
          <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg> در حال بررسی...</span>`;

        try {
          const res = await fetch(`${API_BASE}/otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // allow server to set httpOnly cookies
            body: JSON.stringify({ phone, code }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok || !data?.success) {
            const msg =
              data?.message ||
              data?.error?.message ||
              data?.data?.message ||
              "احراز هویت ناموفق بود. دوباره تلاش کنید.";
            throw new Error(msg);
          }

          // Optionally keep user profile client-side (no tokens; they are in httpOnly cookies)
          if (data?.data?.user) {
            localStorage.setItem("auth_user", JSON.stringify(data.data.user));
          }
          localStorage.removeItem("signup_phone");

          const redirect =
            new URLSearchParams(location.search).get("redirect") || "/";
          window.location.href = redirect;
        } catch (err) {
          otpMsg.textContent =
            err?.message || "خطا در اتصال. لطفاً دوباره تلاش کنید.";
          btnVerify.disabled = false;
          btnVerify.innerHTML = originalHTML;
        }
      }
    });

    // Resend timer
    const btnResend = qs("#btnResend");
    const resendTimer = qs("#resendTimer");
    let timeLeft = 60,
      handle;

    function setResendVisualState(enabled) {
      if (!btnResend) return;
      if (enabled) {
        btnResend.classList.remove(
          "text-gray-400",
          "no-underline",
          "cursor-not-allowed"
        );
        btnResend.classList.add("text-primary", "hover:underline");
      } else {
        btnResend.classList.add(
          "text-gray-400",
          "no-underline",
          "cursor-not-allowed"
        );
        btnResend.classList.remove("text-primary", "hover:underline");
      }
    }
    function tick() {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(handle);
        if (btnResend) btnResend.disabled = false;
        setResendVisualState(true);
        if (resendTimer) resendTimer.textContent = "";
        return;
      }
      if (resendTimer) resendTimer.textContent = `(${timeLeft} ثانیه)`;
    }
    function startTimer(ttlSec) {
      if (!btnResend) return;
      btnResend.disabled = true;
      setResendVisualState(false);
      timeLeft = Number(ttlSec) > 0 ? Number(ttlSec) : 60;
      if (resendTimer) resendTimer.textContent = `(${timeLeft} ثانیه)`;
      clearInterval(handle);
      handle = setInterval(tick, 1000);
    }

    // Resend via backend
    async function resendCode() {
      if (!btnResend) return;
      try {
        btnResend.disabled = true;
        setResendVisualState(false);

        const phone = normalizeIranPhone(phoneRaw || "");
        if (!/^09\d{9}$/.test(phone)) {
          throw new Error("شماره موبایل نامعتبر است.");
        }

        const res = await fetch(`${API_BASE}/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          const msg =
            data?.message || data?.error?.message || "ارسال کد ناموفق بود.";
          throw new Error(msg);
        }
        const ttlSec = data?.data?.ttlSec || 60;
        startTimer(ttlSec);
      } catch (err) {
        otpMsg.textContent = err?.message || "خطا در ارسال مجدد کد.";
        btnResend.disabled = false;
        setResendVisualState(true);
      }
    }

    // Send once on page load
    resendCode();
    btnResend && btnResend.addEventListener("click", resendCode);

    // "ویرایش شماره"
    const editPhone = document.getElementById("editPhone");
    editPhone &&
      editPhone.addEventListener("click", () => {
        if (document.referrer) history.back();
        else window.location.href = "/login.html";
      });
  });
})();
