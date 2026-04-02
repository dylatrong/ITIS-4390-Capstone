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

  var toggleDark = panel.querySelector(".account-menu-toggle");
  if (toggleDark) {
    toggleDark.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var on = toggleDark.getAttribute("aria-checked") === "true";
      toggleDark.setAttribute("aria-checked", on ? "false" : "true");
      toggleDark.classList.toggle("is-on", !on);
      var darkNow = toggleDark.getAttribute("aria-checked") === "true";
      document.documentElement.setAttribute("data-theme", darkNow ? "dark" : "light");
    });
  }
}

function tryInitHeader() {
  setupAccountMenu();

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
