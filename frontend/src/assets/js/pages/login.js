// src/assets/js/pages/login.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
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
    const password = document.getElementById("password");
    const emailMsg = document.getElementById("emailMsg");
    const passwordMsg = document.getElementById("passwordMsg");
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
      btn.textContent = "ورود / ثبت نام";
    };

    async function sendVerificationCode(emailValue) {
      const res = await fetch("/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg =
          data?.error?.message || data?.message || "ارسال کد ناموفق بود.";
        const code = data?.error?.code;
        const err = new Error(msg);
        err.code = code;
        throw err;
      }
      return data?.data?.ttlSec || 600;
    }

    async function goToVerify(emailValue) {
      localStorage.setItem("verify_email", emailValue);
      window.location.href = `/verify?email=${encodeURIComponent(
        emailValue
      )}`;
    }

    email && email.addEventListener("input", () => (emailMsg.textContent = ""));
    password &&
      password.addEventListener("input", () => (passwordMsg.textContent = ""));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailValue = email.value.trim().toLowerCase();
      const passwordValue = password.value;

      // Validate email
      if (!isValidEmail(emailValue)) {
        emailMsg.textContent = "لطفاً یک ایمیل معتبر وارد کنید.";
        return;
      }

      // Validate password
      if (passwordValue.length < 8) {
        passwordMsg.textContent = "رمز عبور باید حداقل ۸ کاراکتر باشد.";
        return;
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(passwordValue)) {
        passwordMsg.textContent = "رمز عبور باید شامل حروف و اعداد باشد.";
        return;
      }

      emailMsg.textContent = "";
      passwordMsg.textContent = "";
      setBtnLoading(`<span class="inline-flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
          <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg> در حال ورود...</span>`);

      try {
        // 1) Try login
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: emailValue, password: passwordValue }),
        });

        const data = await response.json().catch(() => null);

        // Login success
        if (response.ok && data?.success) {
          if (data.data?.user) {
            localStorage.setItem("user", JSON.stringify(data.data.user));
          }
          console.log("🍪 Document cookies:", document.cookie);
          console.log("📦 Response data:", data);
          window.location.href = "/profile";
          return;
        }

        // 403 -> email exists but not verified: send code then redirect to verify
        if (
          response.status === 403 &&
          data?.error?.code === "EMAIL_NOT_VERIFIED"
        ) {
          setBtnLoading(`<span class="inline-flex items-center justify-center gap-2">
            <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
              <path class="opacity-75" fill="white" d="M4 12a 8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg> در حال ارسال کد تایید...</span>`);
          try {
            await sendVerificationCode(emailValue);
          } catch (err) {
            // If rate-limited or other issues, still go to verify page; user can retry there
            console.warn("Resend verification failed:", err);
          }
          await goToVerify(emailValue);
          return;
        }

        // 401 -> invalid credentials: try register
        if (
          response.status === 401 &&
          data?.error?.code === "INVALID_CREDENTIALS"
        ) {
          setBtnLoading(`<span class="inline-flex items-center justify-center gap-2">
            <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
              <path class="opacity-75" fill="white" d="M4 12a 8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg> در حال ثبت نام...</span>`);

          const registerResponse = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: emailValue,
              password: passwordValue,
            }),
          });
          const registerData = await registerResponse.json().catch(() => null);

          // Register success -> backend already sent code
          if (registerResponse.ok && registerData?.success) {
            if (registerData.data?.needsVerification) {
              await goToVerify(emailValue);
              return;
            }
          }

          // If email already exists, try sending verification code
          if (registerData?.error?.code === "EMAIL_EXISTS") {
            try {
              setBtnLoading(`<span class="inline-flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
                  <path class="opacity-75" fill="white" d="M4 12a 8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg> در حال ارسال کد تایید...</span>`);
              await sendVerificationCode(emailValue);
              await goToVerify(emailValue);
              return;
            } catch (err) {
              if (err.code === "ALREADY_VERIFIED") {
                emailMsg.textContent =
                  "ایمیل قبلاً تایید شده است. لطفاً رمز عبور صحیح را وارد کنید.";
              } else {
                emailMsg.textContent = err.message || "ارسال کد ناموفق بود.";
              }
            }
          } else {
            emailMsg.textContent =
              registerData?.error?.message || "خطا در ثبت نام.";
          }

          resetBtn();
          return;
        }

        // Other errors
        emailMsg.textContent =
          data?.error?.message || "خطا در ورود. لطفاً دوباره تلاش کنید.";
        resetBtn();
      } catch (error) {
        console.error("Login/Register error:", error);
        emailMsg.textContent = "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.";
        resetBtn();
      }
    });
  });
})();
