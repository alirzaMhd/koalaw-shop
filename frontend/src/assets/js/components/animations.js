
// src/assets/js/animations.js
(function () {
  function setupParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const hero = document.getElementById("hero-bg-image");
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(hero, {
      y: "8vh", ease: "none",
      scrollTrigger: { trigger: "body", start: "top top", end: "bottom top", scrub: 1.2 }
    });
  }

  function setupMagneticButtons() {
    document.querySelectorAll(".magnetic-btn").forEach(b => {
      b.addEventListener("mousemove", (e) => {
        const t = b.getBoundingClientRect();
        const dx = e.clientX - t.left - t.width / 2;
        const dy = e.clientY - t.top - t.height / 2;
        gsap && gsap.to(b, { x: dx * 0.15, y: dy * 0.15, duration: 0.3 });
      });
      b.addEventListener("mouseleave", () => {
        gsap && gsap.to(b, { x: 0, y: 0, duration: 0.3, ease: "power3.out" });
      });
    });
  }

  function setupBrandsMarquee() {
    const container = document.querySelector(".brands-container");
    const marquee = container?.querySelector(".brands-marquee");
    if (!container || !marquee) return;

    function rebuild() {
      marquee.querySelectorAll('[data-clone="true"]').forEach(n => n.remove());
      const originals = Array.from(marquee.children);
      if (!originals.length) return;
      const baseWidth = marquee.scrollWidth;
      const needWidth = container.clientWidth * 2;

      // Clone until we exceed 2x container width
      while (marquee.scrollWidth < needWidth) {
        const frag = document.createDocumentFragment();
        originals.forEach(el => {
          const c = el.cloneNode(true);
          c.setAttribute("data-clone", "true");
          frag.appendChild(c);
        });
        marquee.appendChild(frag);
      }
      // Ensure even clone count
      const clones = marquee.querySelectorAll('[data-clone="true"]').length;
      if (clones % 2 !== 0) {
        const frag = document.createDocumentFragment();
        originals.forEach(el => {
          const c = el.cloneNode(true);
          c.setAttribute("data-clone", "true");
          frag.appendChild(c);
        });
        marquee.appendChild(frag);
      }

      marquee.style.setProperty("--marquee-shift", `-${baseWidth}px`);
      marquee.style.animationDuration = `${baseWidth / 60}s`;
      KUtils.refreshIcons();
    }
    rebuild();
    new ResizeObserver(rebuild).observe(container);
  }

  function setupCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.getAttribute("data-count");
        const suffix = el.getAttribute("data-suffix") || "";
        const start = 0, dur = 1400;
        const t0 = performance.now();
        function step(t) {
          const p = Math.min(1, (t - t0) / dur);
          const val = Math.floor(start + (target - start) * p);
          el.textContent = KUtils.toFa(val) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  }

  function setupClickHearts() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("click", (e) => {
      if (e.target.closest("input,textarea,select,button,a,[role='button'],summary")) return;
      const el = document.createElement("span");
      el.className = "floating-heart";
      const SHAPES = ["❤","✦","✧","❀","❣","★"];
      const COLORS = ["#f7bcd6","#c9c2ff","#bcefe1","#ffe3a4","#ffcfe0","#d6f0ff"];
      el.textContent = SHAPES[Math.floor(Math.random()*SHAPES.length)];
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      el.style.color = COLORS[Math.floor(Math.random()*COLORS.length)];
      el.style.transform += ` rotate(${30*Math.random()-15}deg)`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupParallax();
    setupMagneticButtons();
    setupBrandsMarquee();
    setupCounters();
    setupClickHearts();
  });
})();