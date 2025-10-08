// /assets/js/components/newsletter.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Find all newsletter forms
    const newsletterSections = document.querySelectorAll(".newsletter-bg");

    newsletterSections.forEach((section) => {
      const form = section.querySelector("form");
      if (!form) return;

      const emailInput = form.querySelector('input[type="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!emailInput || !submitBtn) return;

      // Restore email if previously entered
      const savedEmail = sessionStorage.getItem("newsletter_email");
      if (savedEmail) {
        emailInput.value = savedEmail;
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Client-side validation
        if (!email) {
          showMessage(form, "لطفاً ایمیل خود را وارد کنید.", "error");
          emailInput.focus();
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showMessage(form, "فرمت ایمیل نامعتبر است.", "error");
          emailInput.focus();
          return;
        }

        // Save email to session storage
        sessionStorage.setItem("newsletter_email", email);

        // Disable button and show loading
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-50", "cursor-not-allowed");
        submitBtn.innerHTML = `
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>در حال ارسال...</span>
          </span>`;

        try {
          const response = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              source: window.location.pathname,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            showMessage(
              form,
              data.message ||
                "با موفقیت در خبرنامه عضو شدید! ایمیل خوش‌آمدگویی برای شما ارسال شد. 🎉",
              "success"
            );

            // Clear form
            emailInput.value = "";
            sessionStorage.removeItem("newsletter_email");

            // Track conversion (optional - Google Analytics/Facebook Pixel)
            if (typeof gtag !== "undefined") {
              gtag("event", "newsletter_subscribe", {
                event_category: "engagement",
                event_label: email,
              });
            }

            if (typeof fbq !== "undefined") {
              fbq("track", "Subscribe", {
                source: "newsletter",
              });
            }
          } else {
            showMessage(
              form,
              data.message || "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
              "error"
            );
          }
        } catch (error) {
          console.error("Newsletter subscription error:", error);
          showMessage(
            form,
            "خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
            "error"
          );
        } finally {
          // Re-enable button
          submitBtn.disabled = false;
          submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
          submitBtn.textContent = originalText;
        }
      });

      // Real-time email validation
      emailInput.addEventListener("blur", () => {
        const email = emailInput.value.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          emailInput.classList.add("border-red-500", "ring-red-200");
          emailInput.classList.remove(
            "border-gray-200",
            "focus:border-rose-300"
          );
        } else {
          emailInput.classList.remove("border-red-500", "ring-red-200");
          emailInput.classList.add("border-gray-200", "focus:border-rose-300");
        }
      });
    });

    /**
     * Show message below form
     */
    function showMessage(form, message, type = "success") {
      // Remove existing messages
      const existingMsg = form.querySelector(".newsletter-message");
      if (existingMsg) existingMsg.remove();

      // Create message element
      const msgDiv = document.createElement("div");
      msgDiv.className = `newsletter-message mt-6 p-4 rounded-2xl text-center transition-all duration-300 ${
        type === "success"
          ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-200"
          : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-2 border-red-200"
      }`;

      const icon =
        type === "success"
          ? `<svg class="inline-block w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
          : `<svg class="inline-block w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;

      msgDiv.innerHTML = `
        <div class="flex items-center justify-center">
          ${icon}
          <span class="font-medium">${message}</span>
        </div>`;

      // Insert after form
      form.appendChild(msgDiv);

      // Animate in
      setTimeout(() => {
        msgDiv.style.opacity = "0";
        msgDiv.style.opacity = "1";
      }, 10);

      // Auto-remove after 8 seconds
      setTimeout(() => {
        msgDiv.style.opacity = "0";
        setTimeout(() => msgDiv.remove(), 300);
      }, 8000);
    }

    // Handle unsubscribe page (if exists)
    const unsubscribePage = document.querySelector(
      '[data-page="newsletter-unsubscribed"]'
    );
    if (unsubscribePage) {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get("email");
      if (email) {
        const emailDisplay = unsubscribePage.querySelector(
          ".unsubscribed-email"
        );
        if (emailDisplay) {
          emailDisplay.textContent = email;
        }
      }
    }
  });
})();
