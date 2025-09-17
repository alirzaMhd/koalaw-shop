
// src/assets/js/tos.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));
    const headings = Array.from(document.querySelectorAll("article section[id]"));
    if (!headings.length) return;

    window.AOS && AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 40 });
    KUtils.refreshIcons();

    // Sync active section between both TOCs
    const byId = new Map();
    tocLinks.forEach(a => {
      const id = a.getAttribute("href").slice(1);
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(a);
    });
    function setActive(id) {
      tocLinks.forEach(l => l.classList.remove("active"));
      (byId.get(id) || []).forEach(l => l.classList.add("active"));
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 });
    headings.forEach(h => obs.observe(h));

    // Click highlight
    tocLinks.forEach(a => a.addEventListener("click", () => setActive(a.getAttribute("href").slice(1))));

    // Initial active
    if (location.hash) setActive(decodeURIComponent(location.hash.slice(1)));
    else if (headings[0]) setActive(headings[0].id);

    // Back to top
    const toTop = document.getElementById("toTop");
    toTop && window.addEventListener("scroll", () => {
      const show = window.scrollY > 600;
      toTop.style.opacity = show ? "1" : "0";
      toTop.style.pointerEvents = show ? "auto" : "none";
    });
    toTop && toTop.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));

    // Print
    document.getElementById("btnPrint")?.addEventListener("click", () => window.print());

    // Drawer (mobile TOC)
    const drawer = document.getElementById("tocDrawer");
    const btnOpen = document.getElementById("btnTOCOpen");
    const btnClose = document.getElementById("btnTOCClose");
    const open = () => drawer?.classList.add("active");
    const close = () => drawer?.classList.remove("active");
    btnOpen && btnOpen.addEventListener("click", open);
    btnClose && btnClose.addEventListener("click", close);
    drawer && drawer.addEventListener("click", (e) => { if (e.target === drawer) close(); });
    drawer?.querySelectorAll("a[href^='#']").forEach(a => a.addEventListener("click", () => setTimeout(close, 150)));

    // Fill CONFIG [data-var] if provided inline
    if (window.CONFIG) {
      document.querySelectorAll("[data-var]").forEach((el) => {
        const path = el.getAttribute("data-var").split(".");
        let value = window.CONFIG; for (const k of path) value = value?.[k];
        if (typeof value === "string" || typeof value === "number") {
          const key = path.join(".");
          if (key === "social.instagram" || key === "social.telegram") {
            el.setAttribute("href", value); el.textContent = value;
          } else el.textContent = value;
        }
      });
      const emailEl = document.getElementById("supportEmailLink");
      const phoneEl = document.getElementById("supportPhoneLink");
      if (emailEl && CONFIG.supportEmail) emailEl.href = `mailto:${CONFIG.supportEmail}`;
      if (phoneEl && CONFIG.supportPhone) phoneEl.href = `tel:${CONFIG.supportPhone.replace(/\s+/g,"")}`;
    }
  });
})();