// src/assets/js/pages/reset-password.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
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

    const API_BASE = "/auth";

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

    // Get email from URL or localStorage
    const params = new URLSearchParams(location.search);
    const emailRaw = decodeURIComponent(
      params.get("email") || localStorage.getItem("reset_email") || ""
    );

    const emailInfo = qs("#emailInfo");
    const masked = emailRaw ? maskEmail(emailRaw) : "";

    if (masked && emailInfo) {
      emailInfo.innerHTML = `کد ۶ رقمی ارسال شده به <span class="ltr-numbers" dir="ltr">${masked}</span> و رمز عبور جدید را وارد کنید.`;
    }

    if (emailRaw) {
      localStorage.setItem("reset_email", emailRaw);
    }

    const inputs = qsa(".otp-input");
    const newPassword = qs("#newPassword");
    const confirmPassword = qs("#confirmPassword");
    const btnReset = qs("#btnReset");
    const passwordMsg = qs("#passwordMsg");
    const confirmMsg = qs("#confirmMsg");
    const formMsg = qs("#formMsg");

    inputs[0]?.focus();

    const getCode = () => inputs.map((i) => i.value).join("");

    function updateBtn() {
      const codeFilled = getCode().length === inputs.length;
      const passwordFilled = newPassword?.value.length >= 8;
      const confirmFilled = confirmPassword?.value.length >= 8;
      if (btnReset) {
        btnReset.disabled = !(codeFilled && passwordFilled && confirmFilled);
      }
    }

    // OTP input handling
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

    // Password validation
    newPassword &&
      newPassword.addEventListener("input", () => {
        passwordMsg.textContent = "";
        updateBtn();
      });
    confirmPassword &&
      confirmPassword.addEventListener("input", () => {
        confirmMsg.textContent = "";
        updateBtn();
      });

    // Submit form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const code = getCode();
      const newPass = newPassword.value;
      const confirmPass = confirmPassword.value;

      // Validate code
      if (code.length !== inputs.length) {
        formMsg.textContent = "لطفاً کد ۶ رقمی را کامل وارد کنید.";
        return;
      }

      // Validate email
      const email = emailRaw.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formMsg.textContent = "ایمیل نامعتبر است.";
        return;
      }

      // Validate password
      if (newPass.length < 8) {
        passwordMsg.textContent = "رمز عبور باید حداقل ۸ کاراکتر باشد.";
        return;
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPass)) {
        passwordMsg.textContent = "رمز عبور باید شامل حروف و اعداد باشد.";
        return;
      }

      // Check password match
      if (newPass !== confirmPass) {
        confirmMsg.textContent = "رمز عبور و تکرار آن مطابقت ندارند.";
        return;
      }

      // Clear messages
      passwordMsg.textContent = "";
      confirmMsg.textContent = "";
      formMsg.textContent = "";

      if (btnReset) {
        btnReset.disabled = true;
        const originalHTML = btnReset.innerHTML;
        btnReset.innerHTML = `<span class="inline-flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
          <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg> در حال تنظیم رمز عبور...</span>`;

        try {
          const res = await fetch(`${API_BASE}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email,
              code,
              newPassword: newPass,
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok || !data?.success) {
            const msg =
              data?.error?.message ||
              data?.message ||
              "خطا در تنظیم رمز عبور. دوباره تلاش کنید.";
            throw new Error(msg);
          }

          // Success
          localStorage.removeItem("reset_email");
          formMsg.className = "min-h-[20px] text-sm text-green-500";
          formMsg.textContent =
            "✓ رمز عبور با موفقیت تغییر یافت! در حال انتقال...";

          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } catch (err) {
          formMsg.className = "min-h-[20px] text-sm text-red-500";
          formMsg.textContent =
            err?.message || "خطا در اتصال. لطفاً دوباره تلاش کنید.";
          btnReset.disabled = false;
          btnReset.innerHTML = originalHTML;
        }
      }
    });

    // Resend timer
    const btnResend = qs("#btnResend");
    const resendTimer = qs("#resendTimer");
    let timeLeft = 600;
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

        const res = await fetch(`${API_BASE}/forgot-password`, {
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

        formMsg.className = "min-h-[20px] text-sm text-green-500";
        formMsg.textContent = "✓ کد جدید ارسال شد!";
        setTimeout(() => {
          formMsg.textContent = "";
          formMsg.className = "min-h-[20px] text-sm text-red-500";
        }, 3000);

        const ttlSec = data?.data?.ttlSec || 600;
        startTimer(ttlSec);
      } catch (err) {
        formMsg.className = "min-h-[20px] text-sm text-red-500";
        formMsg.textContent = err?.message || "خطا در ارسال مجدد کد.";
        btnResend.disabled = false;
        setResendVisualState(true);
      }
    }

    startTimer(600);
    btnResend && btnResend.addEventListener("click", resendCode);
  });
})();
