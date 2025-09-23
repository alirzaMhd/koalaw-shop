// src/assets/js/components/navbar.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("navbar");
    const mB = document.getElementById("mobile-menu-button");
    const mM = document.getElementById("mobile-menu");
    const mO = document.getElementById("mobile-menu-overlay");

    // Try these API bases in order. Adjust if you only use one.
    const API_BASES = ["/auth", "/api/auth"];

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

    // Helpers for profile button(s)
    const PROFILE_SELECTORS =
      "#profile-btn, #profile-button, [data-profile-button], .js-profile-button";

    function getProfileButtons() {
      return Array.from(document.querySelectorAll(PROFILE_SELECTORS));
    }

    function setProfileHref(href) {
      getProfileButtons().forEach((el) => {
        if (el && typeof el.setAttribute === "function") {
          el.setAttribute("href", href);
        }
      });
    }

    function isLoggedInLocal() {
      try {
        return !!localStorage.getItem("auth_user");
      } catch {
        return false;
      }
    }

    async function fetchWithBases(path, opts) {
      // Try each base; skip 404 to attempt the next
      for (const base of API_BASES) {
        try {
          const res = await fetch(`${base}${path}`, opts);
          if (res.status === 404) continue;
          return { res, base };
        } catch {
          // Try next
        }
      }
      return { res: undefined, base: undefined };
    }

    async function hasSessionAndCacheUser() {
      try {
        // 1) Try /me
        const { res: meRes } = await fetchWithBases("/me", {
          credentials: "include",
        });
        if (meRes && meRes.ok) {
          const meData = await meRes.json().catch(() => null);
          const user = meData?.data?.user;
          if (user) localStorage.setItem("auth_user", JSON.stringify(user));
          return true;
        }

        // 2) If unauthorized, try refresh
        if (meRes && meRes.status === 401) {
          const { res: refreshRes } = await fetchWithBases("/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (refreshRes && refreshRes.ok) {
            const rData = await refreshRes.json().catch(() => null);
            const user = rData?.data?.user;
            if (user) localStorage.setItem("auth_user", JSON.stringify(user));
            return true;
          }
        }

        return false;
      } catch {
        return false;
      }
    }

    function syncProfileButtonsHref() {
      // Immediate best-effort: if we see local flag, point to /profile; else /login
      setProfileHref(isLoggedInLocal() ? "/profile" : "/login");
    }

    // Keep button href in sync across tabs/windows
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_user") {
        syncProfileButtonsHref();
      }
    });

    // Initial sync on load
    syncProfileButtonsHref();

    // Delegate clicks so it also works if the button renders later
    document.body.addEventListener("click", async (e) => {
      const target =
        e.target &&
        (e.target.closest ? e.target.closest(PROFILE_SELECTORS) : null);
      if (!target) return;

      // Intercept default navigation
      e.preventDefault();

      // Fast path: just verified or already have user locally
      if (isLoggedInLocal()) {
        window.location.href = "/profile";
        return;
      }

      // Server check as a fallback
      const loggedIn = await hasSessionAndCacheUser();
      if (loggedIn) {
        // Update href for future clicks and navigate
        setProfileHref("/profile");
        window.location.href = "/profile";
      } else {
        setProfileHref("/login");
        window.location.href = "/login";
      }
    });
  });
})();
