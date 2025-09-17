
// src/assets/js/profile.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("dashboard") || document.getElementById("orders") || document.getElementById("favorites");
    if (!root) return;

    window.AOS && AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 40 });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // Sidebar tabs
    const items = document.querySelectorAll(".sidebar-nav-item[data-tab]");
    const contents = document.querySelectorAll(".tab-content");
    items.forEach(item => item.addEventListener("click", (e) => {
      e.preventDefault();
      items.forEach(el => { el.classList.remove("active"); el.classList.add("sidebar-nav-item"); });
      item.classList.add("active");
      contents.forEach(c => c.classList.add("hidden"));
      const id = item.getAttribute("data-tab");
      document.getElementById(id)?.classList.remove("hidden");
    }));

    // Card hover lift
    document.querySelectorAll(".order-card, .favorite-item").forEach(card => {
      card.addEventListener("mouseenter", () => { if (window.gsap && window.innerWidth > 768) gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" }); });
      card.addEventListener("mouseleave", () => { if (window.gsap && window.innerWidth > 768) gsap.to(card, { y: 0,  duration: 0.3, ease: "power2.out" }); });
    });

    // Gender custom dropdown
    const genderWrap = document.getElementById("genderSelect");
    if (genderWrap) {
      const trigger = genderWrap.querySelector(".sort-select--button");
      const current = genderWrap.querySelector(".sort-current");
      const items = genderWrap.querySelectorAll(".sort-item");
      const hiddenInput = document.getElementById("genderValue");

      function open() { genderWrap.classList.add("is-open"); trigger.setAttribute("aria-expanded","true"); }
      function close() { genderWrap.classList.remove("is-open"); trigger.setAttribute("aria-expanded","false"); }
      function update(key) {
        items.forEach(btn => btn.setAttribute("aria-selected", String(btn.dataset.gender === key)));
        const active = Array.from(items).find(b => b.dataset.gender === key);
        current.textContent = "جنسیت: " + (active?.querySelector("span")?.textContent || "");
        if (hiddenInput) hiddenInput.value = key;
        KUtils.refreshIcons();
      }

      trigger.addEventListener("click", (e) => { e.stopPropagation(); genderWrap.classList.contains("is-open") ? close() : open(); });
      items.forEach(btn => btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); update(btn.dataset.gender); close(); }));
      document.addEventListener("click", () => genderWrap.classList.contains("is-open") && close());
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && genderWrap.classList.contains("is-open")) close(); });
    }
  });
})();
