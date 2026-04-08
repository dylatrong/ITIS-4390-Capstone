var NEWLEAF_DEFAULT_HOME_TRACKS = [
  "resilience-stress-reduction",
  "positive-thinking-mindfulness",
  "confidence-self-esteem",
];

// Reads slugs the user manually hid on My Tracks.
function getHiddenTracksList() {
  try {
    var raw = window.localStorage.getItem("newleaf-hidden-my-tracks");
    var parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (ignore) {
    return [];
  }
}

// Saves hidden track slugs so the hide state persists.
function setHiddenTracksList(list) {
  try {
    window.localStorage.setItem("newleaf-hidden-my-tracks", JSON.stringify(list));
  } catch (ignore) {}
}

// Gets enrolled tracks; seeds first-time users with 3 default homepage tracks.
function getEnrolledTracks() {
  var enrolled = [];
  var hasStoredValue = false;
  try {
    var raw = window.localStorage.getItem("newleaf-enrolled-tracks");
    hasStoredValue = raw !== null;
    var parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      enrolled = parsed;
    }
  } catch (ignore) {}

  if (!hasStoredValue) {
    enrolled = NEWLEAF_DEFAULT_HOME_TRACKS.slice();
    try {
      window.localStorage.setItem(
        "newleaf-enrolled-tracks",
        JSON.stringify(enrolled)
      );
    } catch (ignore) {}
  }

  return enrolled.filter(function (slug, i, arr) {
    return slug && arr.indexOf(slug) === i;
  });
}

// Persists the current enrolled track list.
function setEnrolledTracks(list) {
  try {
    window.localStorage.setItem("newleaf-enrolled-tracks", JSON.stringify(list));
  } catch (ignore) {}
}

// Helper for quick enrolled checks by slug.
function isTrackEnrolled(slug) {
  if (!slug) return false;
  return getEnrolledTracks().indexOf(slug) !== -1;
}

// Single place to enroll/unenroll a track and sync storage flags.
function setTrackEnrolled(slug, enrolled) {
  if (!slug) return;
  var list = getEnrolledTracks();
  var next = list.slice();
  var idx = next.indexOf(slug);
  if (enrolled && idx === -1) next.push(slug);
  if (!enrolled && idx !== -1) next.splice(idx, 1);
  setEnrolledTracks(next);

  // Keep hidden-state in sync so "Add Track" immediately makes a track visible again.
  var hidden = getHiddenTracksList();
  var hiddenIdx = hidden.indexOf(slug);
  if (enrolled && hiddenIdx !== -1) {
    hidden.splice(hiddenIdx, 1);
    setHiddenTracksList(hidden);
  }

  try {
    window.sessionStorage.setItem("newleaf-track-added-" + slug, enrolled ? "1" : "0");
  } catch (ignore) {}
}

window.NewLeafTrackState = {
  getEnrolledTracks: getEnrolledTracks,
  isTrackEnrolled: isTrackEnrolled,
  setTrackEnrolled: setTrackEnrolled,
};

// Handles nav menu open/close behavior and active-link highlighting.
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

// Controls the profile/account slide-out drawer interactions.
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

// Makes My Tracks act like an accordion (only one open at a time).
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

  var cards = Array.prototype.slice.call(
    document.querySelectorAll("details.my-track-card")
  );

  function scrollCardIntoView(card) {
    if (!card) return;
    var top = card.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  cards.forEach(function (el) {
    var cardSlug = el.getAttribute("data-my-track-slug");
    if (slug && cardSlug && cardSlug === slug) {
      el.open = true;
    } else {
      el.open = false;
    }

    el.addEventListener("toggle", function () {
      if (!el.open) return;
      cards.forEach(function (other) {
        if (other !== el) other.open = false;
      });
      scrollCardIntoView(el);
    });
  });
}

// Enables horizontal wheel + drag scrolling on activity card rails.
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

// Handles leave-track modal, hide logic, and query-based open/scroll.
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
    getHiddenTracksList().forEach(function (slug) {
      hiddenSet[slug] = true;
    });

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-my-track-slug") || "";
      if (!slug) return;
      var shouldBeVisible = isTrackEnrolled(slug);
      if (slugToShow && slug === slugToShow) {
        delete hiddenSet[slug];
        card.hidden = false;
        return;
      }
      card.hidden = !shouldBeVisible || Boolean(hiddenSet[slug]);
    });

    setHiddenTracksList(Object.keys(hiddenSet));
    updateEmptyState();
  }

  var params = new URLSearchParams(window.location.search);
  var slugFromQuery = params.get("track");
  if (slugFromQuery) {
    slugFromQuery = String(slugFromQuery).trim().toLowerCase();
    setTrackEnrolled(slugFromQuery, true);
  } else {
    slugFromQuery = "";
  }
  applyHiddenTracks(slugFromQuery);

  if (slugFromQuery) {
    var targetCard = document.querySelector(
      'details.my-track-card[data-my-track-slug="' + slugFromQuery + '"]'
    );
    if (targetCard) {
      targetCard.open = true;
      window.requestAnimationFrame(function () {
        var top = targetCard.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    }
  }

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
        var hiddenTracks = getHiddenTracksList();
        if (hiddenTracks.indexOf(slug) === -1) hiddenTracks.push(slug);
        setHiddenTracksList(hiddenTracks);
        setTrackEnrolled(slug, false);
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

// Renders up to 3 enrolled tracks in the homepage "Current Tracks" panel.
function setupHomeCurrentTracks() {
  var main = document.querySelector("main.page-home");
  if (!main || main.dataset.homeTracksInit === "true") return;
  main.dataset.homeTracksInit = "true";

  var list = document.getElementById("home-current-tracks-list");
  var empty = document.getElementById("home-current-tracks-empty");
  var seeMore = document.getElementById("home-current-tracks-more");
  if (!list || !empty || !seeMore) return;

  var TRACK_CARD_META = {
    "resilience-stress-reduction": {
      title: "Resilience & Stress Reduction",
      href: "my-tracks.html?track=resilience-stress-reduction",
      image: "/assets/images/meditation.jpg",
      alt: "A man meditating in a grass field",
      desc: "Continue your journey learning soothing meditation patterns",
    },
    "positive-thinking-mindfulness": {
      title: "Positive Thinking & Mindfulness",
      href: "my-tracks.html?track=positive-thinking-mindfulness",
      image: "/assets/images/mindfulness.jpg",
      alt: "A dandelion still",
      desc: "Continue your journey learning soothing meditation patterns",
    },
    "confidence-self-esteem": {
      title: "Confidence & Self-Esteem",
      href: "my-tracks.html?track=confidence-self-esteem",
      image: "/assets/images/confidence.jpg",
      alt: "City sky line",
      desc: "Continue your journey learning soothing meditation patterns",
    },
  };

  var hidden = getHiddenTracksList();
  var enrolled = getEnrolledTracks().filter(function (slug) {
    return hidden.indexOf(slug) === -1;
  });

  var renderable = enrolled.filter(function (slug) {
    if (TRACK_CARD_META[slug]) return true;
    return Boolean(window.TRACKS_DATA && window.TRACKS_DATA[slug]);
  });

  list.innerHTML = "";
  var visible = renderable.slice(0, 3);
  visible.forEach(function (slug) {
    var meta = TRACK_CARD_META[slug];
    if (!meta) {
      var trackData = (window.TRACKS_DATA && window.TRACKS_DATA[slug]) || null;
      if (!trackData) return;
      meta = {
        title: trackData.pageTitle || "Track",
        href: "my-tracks.html?track=" + encodeURIComponent(slug),
        image: trackData.heroImage || "/assets/images/mountain.jpg",
        alt: trackData.heroImageAlt || "",
        desc: "Continue your journey with the next activity.",
      };
    }
    var card = document.createElement("a");
    card.className = "track-list-card";
    card.href = meta.href;
    card.innerHTML =
      '<img src="' +
      meta.image +
      '" alt="' +
      meta.alt +
      '" class="track-list-img">' +
      '<div class="track-list-content">' +
      '<div class="track-list-text"><h4>' +
      meta.title +
      "</h4><p>" +
      meta.desc +
      '</p></div><span class="explore-icon-chevron" style="width: 2rem; height: 2rem;"></span></div>';
    list.appendChild(card);
  });

  empty.hidden = visible.length > 0;
  var showSeeMore = renderable.length > 3;
  seeMore.hidden = !showSeeMore;
  seeMore.setAttribute("aria-hidden", showSeeMore ? "false" : "true");
  seeMore.style.display = showSeeMore ? "inline-flex" : "none";
}

// Shared client-side search suggestions for Home + Explore.
function setupSearchSuggestions() {
  var searchBlocks = document.querySelectorAll(".explore-search");
  if (!searchBlocks.length) return;

  // Static category suggestions (always available).
  var categorySeed = [
    { title: "Relationships", href: "category-relationships.html", meta: "Category", kind: "category" },
    { title: "Mindfulness & Meditation", href: "category-mindfulness.html", meta: "Category", kind: "category" },
    { title: "Personal Growth", href: "category-personal-growth.html", meta: "Category", kind: "category" },
    { title: "Family & Kids", href: "category-family-kids.html", meta: "Category", kind: "category" },
    { title: "Health & Well-Being", href: "category-health.html", meta: "Category", kind: "category" },
    { title: "Work & Money", href: "category-work-money.html", meta: "Category", kind: "category" },
  ];

  // Dynamic track suggestions are generated from TRACKS_DATA.
  var trackSeed = [];
  var trackData = window.TRACKS_DATA || {};
  Object.keys(trackData).forEach(function (slug) {
    var item = trackData[slug];
    if (!item || !item.pageTitle) return;
    trackSeed.push({
      title: item.pageTitle,
      href: "track-detail.html?track=" + encodeURIComponent(slug),
      meta: "Track",
      kind: "track",
    });
  });

  // One combined source list used for simple client-side filtering.
  var source = categorySeed.concat(trackSeed);

  function renderResults(searchRoot, matches) {
    var dropdown = searchRoot.querySelector(".explore-search-dropdown");
    var divider = searchRoot.querySelector(".explore-search-divider");
    var list = searchRoot.querySelector(".explore-search-results");
    var empty = searchRoot.querySelector(".explore-search-empty");
    if (!dropdown || !divider || !list || !empty) return;

    list.innerHTML = "";
    if (!matches.length) {
      // Show the empty state when query has no matches.
      dropdown.hidden = false;
      divider.hidden = false;
      list.hidden = true;
      empty.hidden = false;
      searchRoot.classList.remove("explore-search--closed");
      return;
    }

    // Build each result row as a clickable suggestion.
    matches.forEach(function (match) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "explore-search-result";
      a.href = match.href;
      a.innerHTML =
        '<span class="explore-search-result-title explore-search-result-title--' +
        (match.kind || "track") +
        '">' +
        match.title +
        '</span><span class="explore-search-result-meta explore-search-result-meta--' +
        (match.kind || "track") +
        '">' +
        match.meta +
        '<span class="explore-icon-chevron" aria-hidden="true"></span></span>';
      li.appendChild(a);
      list.appendChild(li);
    });

    dropdown.hidden = false;
    divider.hidden = false;
    list.hidden = false;
    empty.hidden = true;
    searchRoot.classList.remove("explore-search--closed");
  }

  searchBlocks.forEach(function (searchRoot) {
    if (searchRoot.dataset.searchInit === "true") return;
    searchRoot.dataset.searchInit = "true";

    var input = searchRoot.querySelector(".explore-search-input");
    var dropdown = searchRoot.querySelector(".explore-search-dropdown");
    var divider = searchRoot.querySelector(".explore-search-divider");
    var list = searchRoot.querySelector(".explore-search-results");
    var empty = searchRoot.querySelector(".explore-search-empty");
    if (!input || !dropdown || !divider || !list || !empty) return;

    function closeSuggestions() {
      // Full reset used when user presses Escape.
      input.value = "";
      searchRoot.classList.add("explore-search--closed");
      dropdown.hidden = true;
      divider.hidden = true;
      list.hidden = true;
      empty.hidden = true;
      list.innerHTML = "";
    }

    function updateSuggestions() {
      var query = String(input.value || "").trim().toLowerCase();
      if (!query) {
        // If input is cleared, hide the suggestion panel.
        searchRoot.classList.add("explore-search--closed");
        dropdown.hidden = true;
        divider.hidden = true;
        list.hidden = true;
        empty.hidden = true;
        list.innerHTML = "";
        return;
      }

      var matches = source.filter(function (item) {
        // Basic contains match; updates on every keystroke.
        return item.title.toLowerCase().indexOf(query) !== -1;
      });
      renderResults(searchRoot, matches);
    }

    input.addEventListener("input", updateSuggestions);

    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeSuggestions();
        input.blur();
      }
    });

    document.addEventListener("click", function (ev) {
      // Clicking outside closes the open suggestion panel.
      if (!searchRoot.contains(ev.target)) {
        searchRoot.classList.add("explore-search--closed");
        dropdown.hidden = true;
        divider.hidden = true;
        list.hidden = true;
        empty.hidden = true;
      }
    });
  });
}

// Runs page-level setup safely on whichever page is loaded.
function tryInitHeader() {
  setupAccountMenu();
  setupMyTracksAccordions();
  setupMyTracksActivityScroll();
  setupMyTracksLeaveFlow();
  setupHomeCurrentTracks();
  setupSearchSuggestions();

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
