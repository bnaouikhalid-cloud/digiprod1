(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const drawer = document.querySelector(".mobile-drawer");
  const mobileBar = document.querySelector(".mobile-enquiry-bar");
  const enquirySection = document.querySelector("#enquiry");

  function setHeaderState() {
    const isScrolled = window.scrollY > 20;
    header?.classList.toggle("is-scrolled", isScrolled);
    mobileBar?.classList.toggle("is-visible", window.scrollY > 320);
  }

  function closeMenu(restoreFocus) {
    if (!menuButton || !drawer) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
    drawer.classList.remove("is-open");
    drawer.hidden = true;
    document.body.classList.remove("menu-open");
    if (restoreFocus) menuButton.focus();
  }

  function openMenu() {
    if (!menuButton || !drawer) return;
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation menu");
    drawer.hidden = false;
    drawer.classList.add("is-open");
    document.body.classList.add("menu-open");
    drawer.querySelector("a")?.focus();
  }

  menuButton?.addEventListener("click", function () {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu(false);
    else openMenu();
  });

  drawer?.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && drawer?.classList.contains("is-open")) {
      closeMenu(true);
    }

    if (event.key === "Tab" && drawer?.classList.contains("is-open")) {
      const focusable = Array.from(drawer.querySelectorAll("a, button:not([disabled])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;

      if (link.classList.contains("skip-link")) {
        window.requestAnimationFrame(function () {
          target.focus({ preventScroll: true });
        });
      }

      if (targetId === "#enquiry") {
        const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
        window.setTimeout(function () {
          target.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus({ preventScroll: true });
        }, delay);
      }
    });
  });

  if (mobileBar && enquirySection && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mobileBar.hidden = entry.isIntersecting;
      });
    }, { threshold: 0.08 });
    observer.observe(enquirySection);
  }

  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1024) closeMenu(false);
  });
  setHeaderState();
})();
