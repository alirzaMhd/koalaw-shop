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

    const API_BASE = "/auth"; // ✓ Correct - uses the /auth alias

    const qs = (s) => document.querySelector(s);
    const qsa = (s) => Array.from(document.querySelectorAll(s));

    function maskEmail(email) {
      if (!email) return "";
      const [local, domain] = email.split("@");
      if (!local || !domain) return email;
      const visibleChars = Math.min(3, Math.floor(local.length / 2));
      const masked =
        local.substring(0, visibleChars) +
        "•".repeat(local.length - visibleChars);
      return `${masked}@${domain}`;
    }

    // ✅ FIX: Properly decode the email from URL
    const params = new URLSearchParams(location.search);
    const emailRaw = decodeURIComponent(
      params.get("email") || localStorage.getItem("verify_email") || ""
    );

    const emailInfo = qs("#emailInfo");
    const masked = emailRaw ? maskEmail(emailRaw) : "";

    if (masked && emailInfo) {
      emailInfo.innerHTML = `کد ۶ رقمی به ایمیل <span class="ltr-numbers" dir="ltr">${masked}</span> ارسال شد.`;
    }

    // ✅ Store email for later use
    if (emailRaw) {
      localStorage.setItem("verify_email", emailRaw);
    }

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

    // Submit verification
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const code = getCode();
      if (code.length !== inputs.length) {
        otpMsg.textContent = "لطفاً کد ۶ رقمی را کامل وارد کنید.";
        return;
      }

      // ✅ FIX: Properly validate and clean email
      const email = emailRaw.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        otpMsg.textContent = "ایمیل نامعتبر است. به صفحه ورود بازگردید.";
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 2000);
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
          const res = await fetch(`${API_BASE}/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, code }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok || !data?.success) {
            const msg =
              data?.error?.message ||
              data?.message ||
              "احراز هویت ناموفق بود. دوباره تلاش کنید.";
            throw new Error(msg);
          }

          // Store user data
          if (data?.data?.user) {
            localStorage.setItem("user", JSON.stringify(data.data.user));
          }
          localStorage.removeItem("verify_email");

          // ✅ Show success message before redirect
          otpMsg.className = "min-h-[20px] text-sm text-green-500";
          otpMsg.textContent = "✓ تایید موفق! در حال انتقال...";

          // Redirect to profile
          setTimeout(() => {
            const redirect =
              new URLSearchParams(location.search).get("redirect") ||
              "/profile";
            window.location.href = redirect;
          }, 1000);
        } catch (err) {
          otpMsg.className = "min-h-[20px] text-sm text-red-500";
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
    let timeLeft = 600; // ✅ FIX: Start with 600 seconds (10 minutes)
    let handle;

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
      // ✅ FIX: Format time nicely
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      if (resendTimer) {
        resendTimer.textContent = `(${minutes}:${seconds
          .toString()
          .padStart(2, "0")})`;
      }
    }

    function startTimer(ttlSec) {
      if (!btnResend) return;
      btnResend.disabled = true;
      setResendVisualState(false);
      timeLeft = Number(ttlSec) > 0 ? Number(ttlSec) : 600;

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      if (resendTimer) {
        resendTimer.textContent = `(${minutes}:${seconds
          .toString()
          .padStart(2, "0")})`;
      }

      clearInterval(handle);
      handle = setInterval(tick, 1000);
    }

    // Resend code
    async function resendCode() {
      if (!btnResend) return;
      try {
        btnResend.disabled = true;
        setResendVisualState(false);

        const email = emailRaw.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("ایمیل نامعتبر است.");
        }

        const res = await fetch(`${API_BASE}/resend-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          const msg =
            data?.error?.message || data?.message || "ارسال کد ناموفق بود.";
          throw new Error(msg);
        }

        // ✅ Show success message
        otpMsg.className = "min-h-[20px] text-sm text-green-500";
        otpMsg.textContent = "✓ کد جدید ارسال شد!";
        setTimeout(() => {
          otpMsg.textContent = "";
          otpMsg.className = "min-h-[20px] text-sm text-red-500";
        }, 3000);

        const ttlSec = data?.data?.ttlSec || 600;
        startTimer(ttlSec);
      } catch (err) {
        otpMsg.className = "min-h-[20px] text-sm text-red-500";
        otpMsg.textContent = err?.message || "خطا در ارسال مجدد کد.";
        btnResend.disabled = false;
        setResendVisualState(true);
      }
    }

    // Start timer on page load
    startTimer(600); // 10 minutes
    btnResend && btnResend.addEventListener("click", resendCode);

    // Edit email
    const editEmail = document.getElementById("editEmail");
    editEmail &&
      editEmail.addEventListener("click", () => {
        localStorage.removeItem("verify_email");
        window.location.href = "/login";
      });
  });
})();
