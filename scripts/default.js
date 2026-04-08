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

function setupMyTracksLeaveFlow() {
  var main = document.querySelector("main.page-my-tracks");
  if (!main || main.dataset.myTracksLeaveInit === "true") return;
  main.dataset.myTracksLeaveInit = "true";

  var cards = Array.prototype.slice.call(
    document.querySelectorAll("details.my-track-card")
  );
  var emptyState = document.getElementById("my-tracks-empty");
  var modal = document.getElementById("my-track-leave-modal");
  var modalConfirm = document.getElementById("my-track-leave-confirm");
  var modalCloseEls = document.querySelectorAll("[data-my-track-leave-close]");
  var pendingCard = null;

  function getHiddenTracks() {
    try {
      var raw = window.localStorage.getItem("newleaf-hidden-my-tracks");
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (ignore) {
      return [];
    }
  }

  function setHiddenTracks(list) {
    try {
      window.localStorage.setItem(
        "newleaf-hidden-my-tracks",
        JSON.stringify(list)
      );
    } catch (ignore) {}
  }

  function setTrackAddedState(slug, added) {
    if (!slug) return;
    try {
      window.sessionStorage.setItem(
        "newleaf-track-added-" + slug,
        added ? "1" : "0"
      );
    } catch (ignore) {}
  }

  function updateEmptyState() {
    if (!emptyState) return;
    var anyVisible = cards.some(function (card) {
      return !card.hidden;
    });
    emptyState.hidden = anyVisible;
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("my-track-leave-modal-open");
    pendingCard = null;
  }

  function openModal(card) {
    if (!modal) return;
    pendingCard = card;
    modal.hidden = false;
    document.body.classList.add("my-track-leave-modal-open");
    if (modalConfirm) modalConfirm.focus();
  }

  function applyHiddenTracks(slugToShow) {
    var hiddenSet = {};
    getHiddenTracks().forEach(function (slug) {
      hiddenSet[slug] = true;
    });

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-my-track-slug") || "";
      if (!slug) return;
      if (slugToShow && slug === slugToShow) {
        delete hiddenSet[slug];
        card.hidden = false;
        return;
      }
      card.hidden = Boolean(hiddenSet[slug]);
    });

    setHiddenTracks(Object.keys(hiddenSet));
    updateEmptyState();
  }

  var params = new URLSearchParams(window.location.search);
  var slugFromQuery = params.get("track");
  if (slugFromQuery) {
    slugFromQuery = String(slugFromQuery).trim().toLowerCase();
    setTrackAddedState(slugFromQuery, true);
  } else {
    slugFromQuery = "";
  }
  applyHiddenTracks(slugFromQuery);

  document
    .querySelectorAll("[data-my-track-leave-btn]")
    .forEach(function (button) {
      button.setAttribute("data-my-track-control", "true");
      button.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var card = button.closest("details.my-track-card");
        if (!card) return;
        openModal(card);
      });
    });

  document
    .querySelectorAll("[data-my-track-control]")
    .forEach(function (control) {
      control.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    });

  if (modalCloseEls.length) {
    modalCloseEls.forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
  }

  if (modalConfirm) {
    modalConfirm.addEventListener("click", function () {
      if (!pendingCard) {
        closeModal();
        return;
      }
      var slug = pendingCard.getAttribute("data-my-track-slug") || "";
      pendingCard.open = false;
      pendingCard.hidden = true;
      if (slug) {
        var hiddenTracks = getHiddenTracks();
        if (hiddenTracks.indexOf(slug) === -1) hiddenTracks.push(slug);
        setHiddenTracks(hiddenTracks);
        setTrackAddedState(slug, false);
      }
      closeModal();
      updateEmptyState();
    });
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal && !modal.hidden) {
      ev.preventDefault();
      closeModal();
    }
  });
}

function tryInitHeader() {
  setupAccountMenu();
  setupMyTracksAccordions();
  setupMyTracksActivityScroll();
  setupMyTracksLeaveFlow();

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
