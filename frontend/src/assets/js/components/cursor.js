
// src/assets/js/cursor.js
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const cur = document.querySelector(".cursor"),
          cF = document.querySelector(".cursor-face"),
          cFol = document.querySelector(".cursor-follower");

    if (!cur || !cF || !cFol) return;
    if (window.innerWidth <= 768 || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      [cur, cF, cFol].forEach(e => e && (e.style.display = "none"));
      return;
    }

    let cx = 0, cy = 0, fx = 0, fy = 0, s = 0.5;
    document.addEventListener("mousemove", e => { cx = e.clientX; cy = e.clientY; }, { passive: true });

    (function loop() {
      cur.style.left = cx + "px"; cur.style.top = cy + "px";
      cF.style.left = cx + "px"; cF.style.top = cy + "px";
      fx += (cx - fx) * s; fy += (cy - fy) * s;
      cFol.style.left = fx + "px"; cFol.style.top = fy + "px";
      requestAnimationFrame(loop);
    })();

    const hoverSel = [
      "a","button","input","textarea","summary",".magnetic-btn",
      ".collection-card-new",".category-card",".campaign-featured-card",".campaign-side-card",
      ".order-card",".profile-card",".qty-btn",".product-card-v3",".thumbnail",".sidebar-nav-item",".review-card"
    ].join(",");

    document.querySelectorAll(hoverSel).forEach(el => {
      el.addEventListener("mouseenter", () => {
        cur.classList.add("hover");
        cFol.style.transform = "translate(-50%,-50%) scale(1.5)";
      });
      el.addEventListener("mouseleave", () => {
        cur.classList.remove("hover");
        cFol.style.transform = "translate(-50%,-50%) scale(1)";
      });
    });
  });
})();
