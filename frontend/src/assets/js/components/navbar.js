(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("navbar");
    const mB = document.getElementById("mobile-menu-button");
    const mM = document.getElementById("mobile-menu");
    const mO = document.getElementById("mobile-menu-overlay");

    function toggleMenu() {
      mB && mB.classList.toggle("is-active");
      mM && mM.classList.toggle("is-active");
      mO && mO.classList.toggle("is-active");
      document.body.classList.toggle("mobile-menu-open");
    }

    if (mB && mM && mO) {
      mB.addEventListener("click", toggleMenu);
      mO.addEventListener("click", toggleMenu);
      mM.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          if (mM.classList.contains("is-active")) toggleMenu();
        })
      );
    }

    // Navbar background + hide on scroll
    let lastY = 0;
    if (nav) {
      window.addEventListener(
        "scroll",
        KUtils.throttle(() => {
          const y = window.pageYOffset || 0;
          nav.style.background =
            y > 100 ? "rgba(250,248,243,.95)" : "rgba(250,248,243,.85)";
          nav.style.boxShadow =
            y > 100
              ? "0 4px 30px rgba(0,0,0,.1)"
              : "0 1px 20px rgba(0,0,0,.05)";
          nav.style.transform =
            y > lastY && y > 500 ? "translateY(-100%)" : "translateY(0)";
          lastY = y;
        }, 80)
      );
    }

    // Profile button -> check session then redirect
    const profileBtn = document.getElementById("profile-button");

    async function hasSession() {
      try {
        // 1) Check current session
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) return true;

        // 2) If unauthorized, try refreshing
        if (meRes.status === 401) {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          return refreshRes.ok;
        }
        return false;
      } catch {
        return false;
      }
    }

    profileBtn?.addEventListener("click", async () => {
      const loggedIn = await hasSession();

      // Important: your Express app serves pages at /profile and /login
      // (not /profile.html or /login.html).
      window.location.href = loggedIn ? "/profile" : "/login";
    });
  });
})();
