(function () {
  const cfg = window.CORVO || {};
  const STORAGE_KEY = "corvo-oslo-lead";

  function applyConfig() {
    const cal = cfg.calUrl || "https://cal.com/YOUR-LINK";
    document.querySelectorAll(".js-cal").forEach(function (el) {
      el.setAttribute("href", cal);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });
    document.querySelectorAll(".js-product").forEach(function (el) {
      const key = el.getAttribute("data-product");
      const url = cfg.products && cfg.products[key];
      if (url) {
        el.setAttribute("href", url);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function initLenis() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    if (typeof Lenis !== "function") return null;
    const lenis = new Lenis({
      duration: 1.15,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return lenis;
  }

  const lenis = initLenis();

  function scrollToHash(hash, instant) {
    if (!hash || hash === "#") return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    document.querySelectorAll(".rug.is-target").forEach(function (n) {
      n.classList.remove("is-target");
    });
    if (el.classList.contains("rug")) el.classList.add("is-target");
    const header = document.getElementById("site-header");
    const offset = header ? -header.offsetHeight - 4 : -80;
    if (lenis && !instant) {
      lenis.scrollTo(el, { offset: offset, duration: 1.35 });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: top, behavior: instant ? "auto" : "smooth" });
    }
  }

  function initHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initHero() {
    const slides = document.querySelectorAll("#hero-slides img");
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 7000);
  }

  function currentRugFromHash() {
    const id = (location.hash || "").replace("#", "");
    if (id === "verdant" || id === "gradient" || id === "atlantico" || id === "lagoon") {
      return id;
    }
    return "";
  }

  function closeLead() {
    const overlay = document.getElementById("lead-overlay");
    overlay.classList.remove("is-open");
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
    document.body.classList.remove("is-modal");
    if (lenis) lenis.start();
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    if (location.hash) {
      requestAnimationFrame(function () {
        scrollToHash(location.hash);
      });
    }
  }

  function openLead() {
    const overlay = document.getElementById("lead-overlay");
    overlay.removeAttribute("hidden");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-modal");
    if (lenis) lenis.stop();
    const email = document.getElementById("lead-email");
    if (email) setTimeout(function () { email.focus(); }, 280);
  }

  function sendLead(payload) {
    if (!cfg.leadsUrl) return;
    try {
      fetch(cfg.leadsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch (e) {}
  }

  function initLead() {
    const overlay = document.getElementById("lead-overlay");
    const form = document.getElementById("lead-form");
    const skip = document.getElementById("lead-skip");
    const error = document.getElementById("lead-error");
    if (!overlay || !form) return;

    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {}

    if (!seen) openLead();
    else if (location.hash) {
      setTimeout(function () {
        scrollToHash(location.hash, false);
      }, 80);
    }

    skip.addEventListener("click", closeLead);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLead();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = (document.getElementById("lead-email").value || "").trim();
      const phone = (document.getElementById("lead-phone").value || "").trim();
      const countryCode = document.getElementById("lead-code").value;
      error.textContent = "";

      if (!email && !phone) {
        error.textContent = "Please share an email or a phone number — or continue.";
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error.textContent = "Please enter a valid email.";
        return;
      }

      sendLead({
        email: email,
        phone: phone,
        countryCode: phone ? countryCode : "",
        source: "popup",
        rug: currentRugFromHash(),
      });
      closeLead();
    });
  }

  function initLightbox() {
    const box = document.getElementById("lightbox");
    const stage = document.getElementById("lightbox-stage");
    const img = document.getElementById("lightbox-image");
    const closeBtn = document.getElementById("lightbox-close");
    if (!box || !stage || !img) return;

    const state = { scale: 1, x: 0, y: 0, dragging: false, px: 0, py: 0, pinch: 0 };

    function apply() {
      img.style.transform =
        "translate(calc(-50% + " + state.x + "px), calc(-50% + " + state.y + "px)) scale(" + state.scale + ")";
    }

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      state.scale = 1;
      state.x = 0;
      state.y = 0;
      apply();
      box.removeAttribute("hidden");
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      document.body.classList.add("is-modal");
      if (lenis) lenis.stop();
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("hidden", "");
      img.removeAttribute("src");
      document.body.style.overflow = "";
      document.body.classList.remove("is-modal");
      if (lenis) lenis.start();
    }

    document.querySelectorAll("[data-zoom]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const src = btn.getAttribute("data-zoom");
        const photo = btn.querySelector("img");
        open(src, photo ? photo.alt : "");
      });
    });

    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });

    stage.addEventListener(
      "wheel",
      function (e) {
        if (!box.classList.contains("is-open")) return;
        e.preventDefault();
        const next = state.scale * (e.deltaY < 0 ? 1.12 : 0.9);
        state.scale = Math.min(5, Math.max(1, next));
        if (state.scale === 1) {
          state.x = 0;
          state.y = 0;
        }
        apply();
      },
      { passive: false }
    );

    stage.addEventListener("pointerdown", function (e) {
      if (e.target === closeBtn) return;
      state.dragging = true;
      state.px = e.clientX;
      state.py = e.clientY;
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener("pointermove", function (e) {
      if (!state.dragging || state.scale <= 1) return;
      state.x += e.clientX - state.px;
      state.y += e.clientY - state.py;
      state.px = e.clientX;
      state.py = e.clientY;
      apply();
    });

    stage.addEventListener("pointerup", function () {
      state.dragging = false;
    });

    stage.addEventListener("dblclick", function () {
      if (state.scale > 1) {
        state.scale = 1;
        state.x = 0;
        state.y = 0;
      } else {
        state.scale = 2.2;
      }
      apply();
    });

    stage.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          const a = e.touches[0];
          const b = e.touches[1];
          const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          if (state.pinch) {
            const next = state.scale * (dist / state.pinch);
            state.scale = Math.min(5, Math.max(1, next));
            if (state.scale === 1) {
              state.x = 0;
              state.y = 0;
            }
            apply();
          }
          state.pinch = dist;
        }
      },
      { passive: false }
    );

    stage.addEventListener("touchend", function () {
      state.pinch = 0;
    });
  }

  function initNav() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        const hash = a.getAttribute("href");
        if (!hash || hash === "#") return;
        const el = document.getElementById(hash.slice(1));
        if (!el) return;
        e.preventDefault();
        history.pushState(null, "", hash);
        scrollToHash(hash);
      });
    });
    window.addEventListener("hashchange", function () {
      scrollToHash(location.hash);
    });
  }

  applyConfig();
  initHeader();
  initHero();
  initLead();
  initLightbox();
  initNav();
})();
