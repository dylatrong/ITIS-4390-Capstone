function setupSiteHeader() {
  var nav = document.getElementById("primary-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;
  if (nav.dataset.navInit === "true") return;
  nav.dataset.navInit = "true";

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  }

  function openMenu() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
  }

  toggle.addEventListener("click", function (ev) {
    ev.stopPropagation();
    if (nav.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      closeMenu();
    }
  });

  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll(".nav-link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function setupAccountMenu() {
  var wrap = document.querySelector(".nav-account-wrap");
  if (!wrap || wrap.dataset.accountMenuInit === "true") return;

  var trigger = wrap.querySelector(".nav-account");
  var panel = document.getElementById("account-menu");
  var backdrop = document.querySelector(".account-menu-backdrop");
  var closeBtn = panel ? panel.querySelector(".account-menu-close") : null;
  if (!trigger || !panel || !closeBtn || !backdrop) return;

  wrap.dataset.accountMenuInit = "true";

  function closeAccount() {
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    backdrop.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("account-drawer-open");
  }

  function openAccount() {
    panel.classList.add("is-open");
    backdrop.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("account-drawer-open");
  }

  function isOpen() {
    return panel.classList.contains("is-open");
  }

  trigger.addEventListener("click", function (ev) {
    ev.stopPropagation();
    if (isOpen()) {
      closeAccount();
    } else {
      openAccount();
    }
  });

  closeBtn.addEventListener("click", function (ev) {
    ev.stopPropagation();
    closeAccount();
    trigger.focus();
  });

  backdrop.addEventListener("click", function () {
    closeAccount();
    trigger.focus();
  });

  panel.querySelectorAll(".account-menu-item").forEach(function (link) {
    link.addEventListener("click", function () {
      closeAccount();
    });
  });

  document.addEventListener("click", function (ev) {
    if (
      isOpen() &&
      !wrap.contains(ev.target) &&
      !panel.contains(ev.target)
    ) {
      closeAccount();
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && isOpen()) {
      closeAccount();
      trigger.focus();
    }
  });
}

function setupMyTracksAccordions() {
  var main = document.querySelector("main.page-my-tracks");
  if (!main || main.dataset.myTracksAccordionInit === "true") return;
  main.dataset.myTracksAccordionInit = "true";

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("track");
  if (slug) {
    slug = String(slug).trim().toLowerCase();
  } else {
    slug = "";
  }

  document.querySelectorAll("details.my-track-card").forEach(function (el) {
    var cardSlug = el.getAttribute("data-my-track-slug");
    if (slug && cardSlug && cardSlug === slug) {
      el.open = true;
    } else {
      el.open = false;
    }
  });
}

function setupMyTracksActivityScroll() {
  document.querySelectorAll(".my-track-activity-scroll").forEach(function (el) {
    if (el.dataset.myTracksScrollInit === "true") return;
    el.dataset.myTracksScrollInit = "true";

    el.addEventListener(
      "wheel",
      function (ev) {
        if (el.scrollWidth <= el.clientWidth) return;
        var delta = ev.deltaX !== 0 ? ev.deltaX : ev.deltaY;
        if (delta === 0) return;
        var max = el.scrollWidth - el.clientWidth;
        var next = el.scrollLeft + delta;
        var clamped = Math.max(0, Math.min(max, next));
        if (clamped === el.scrollLeft) return;
        ev.preventDefault();
        el.scrollLeft = clamped;
      },
      { passive: false }
    );

    var drag = null;

    function endDrag(ev) {
      if (!drag || (ev && ev.pointerId !== drag.id)) return;
      el.classList.remove("is-dragging");
      if (drag.dragging) {
        el.addEventListener(
          "click",
          function blockClick(e) {
            e.preventDefault();
            e.stopPropagation();
            el.removeEventListener("click", blockClick, true);
          },
          true
        );
      }
      try {
        if (ev) el.releasePointerCapture(ev.pointerId);
      } catch (ignore) {}
      drag = null;
    }

    el.addEventListener("pointerdown", function (ev) {
      if (ev.button !== 0) return;
      if (
        ev.target.closest(
          "a[href], button, input, textarea, select, label, [role='button']"
        )
      ) {
        return;
      }
      drag = {
        id: ev.pointerId,
        startX: ev.clientX,
        startScroll: el.scrollLeft,
        dragging: false,
      };
      try {
        el.setPointerCapture(ev.pointerId);
      } catch (ignore) {}
    });

    el.addEventListener("pointermove", function (ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      var dx = ev.clientX - drag.startX;
      if (!drag.dragging && Math.abs(dx) > 8) {
        drag.dragging = true;
        el.classList.add("is-dragging");
      }
      if (drag.dragging) {
        el.scrollLeft = drag.startScroll - (ev.clientX - drag.startX);
      }
    });

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  });
}

function tryInitHeader() {
  setupAccountMenu();
  setupMyTracksAccordions();
  setupMyTracksActivityScroll();

  var nav = document.getElementById("primary-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return false;
  if (nav.dataset.navInit === "true") return true;
  setupSiteHeader();
  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  if (tryInitHeader()) return;

  var tries = 0;
  var maxTries = 80;
  var id = window.setInterval(function () {
    tries += 1;
    if (tryInitHeader() || tries >= maxTries) {
      window.clearInterval(id);
    }
  }, 50);

  var observer = new MutationObserver(function () {
    if (tryInitHeader()) {
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
