function getTrackSlugFromQuery() {
  var params = new URLSearchParams(window.location.search);
  var raw = params.get("track");
  return raw ? String(raw).trim().toLowerCase() : "";
}

function renderTrackDetail(track) {
  document.title = "NewLeaf";

  var back = document.getElementById("track-detail-back");
  if (back) back.setAttribute("href", track.categoryBackHref);

  var heroImg = document.getElementById("track-detail-hero-img");
  if (heroImg) {
    heroImg.src = track.heroImage;
    heroImg.alt = track.heroImageAlt || "";
  }

  var titleEl = document.getElementById("track-detail-title");
  if (titleEl) titleEl.textContent = track.pageTitle;

  var avatar = document.getElementById("track-detail-author-avatar");
  if (avatar) {
    avatar.src = track.authorAvatar;
    avatar.alt = track.authorAvatarAlt || "";
  }

  var created = document.getElementById("track-detail-author-created");
  if (created) created.textContent = track.authorCreatedLabel;

  var role = document.getElementById("track-detail-author-role");
  if (role) role.textContent = track.authorRole;

  var bio = document.getElementById("track-detail-author-bio");
  if (bio) bio.textContent = track.authorBioShort;

  var desc = document.getElementById("track-detail-author-desc");
  if (desc) {
    desc.innerHTML = "";
    (track.authorDescriptionParagraphs || []).forEach(function (text, i) {
      var p = document.createElement("p");
      p.className = "track-detail-desc-p";
      if (i > 0) {
        p.classList.add("track-detail-desc-p--spaced");
      }
      p.textContent = text;
      desc.appendChild(p);
    });
    if (track.authorDescriptionClosing) {
      var strong = document.createElement("p");
      strong.className = "track-detail-desc-closing";
      strong.textContent = track.authorDescriptionClosing;
      desc.appendChild(strong);
    }
  }

  var helps = document.getElementById("track-detail-helps");
  if (helps) {
    helps.innerHTML = "";
    (track.helps || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      helps.appendChild(li);
    });
  }

  var details = document.getElementById("track-detail-facts");
  if (details) {
    details.innerHTML = "";
    (track.trackDetails || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      details.appendChild(li);
    });
  }
}

function setupTrackAddButtons() {
  var buttons = document.querySelectorAll("[data-track-add-btn]");
  if (!buttons.length) return;

  var slug = getTrackSlugFromQuery();
  var storageKey = "newleaf-track-added-" + slug;
  var trackState = window.NewLeafTrackState || null;
  var modal = document.getElementById("track-add-modal");
  var modalConfirm = document.getElementById("track-add-modal-confirm");
  var modalCloseEls = document.querySelectorAll("[data-track-add-modal-close]");
  var lastTriggerButton = null;
  var isModalOpen = false;

  function goToTrack() {
    if (slug) {
      window.location.href = "my-tracks.html?track=" + encodeURIComponent(slug);
    } else {
      window.location.href = "my-tracks.html";
    }
  }

  function openModal(triggerButton) {
    if (!modal) {
      goToTrack();
      return;
    }
    lastTriggerButton = triggerButton || null;
    modal.hidden = false;
    isModalOpen = true;
    document.body.classList.add("track-add-modal-open");
    if (modalConfirm) modalConfirm.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    isModalOpen = false;
    document.body.classList.remove("track-add-modal-open");
    if (lastTriggerButton) lastTriggerButton.focus();
  }

  function applyState(added) {
    buttons.forEach(function (btn) {
      var label = btn.querySelector("[data-track-add-label]");
      var icon = btn.querySelector("[data-track-add-icon]");
      if (added) {
        btn.classList.add("is-added");
        btn.setAttribute("aria-pressed", "true");
        if (label) label.textContent = "Go to Track";
        if (icon) icon.hidden = true;
      } else {
        btn.classList.remove("is-added");
        btn.setAttribute("aria-pressed", "false");
        if (label) label.textContent = "Add Track";
        if (icon) icon.hidden = false;
      }
    });
  }

  var isAdded = false;
  if (trackState && typeof trackState.isTrackEnrolled === "function") {
    isAdded = trackState.isTrackEnrolled(slug);
  } else {
    try {
      isAdded = window.sessionStorage.getItem(storageKey) === "1";
    } catch (ignore) {}
  }
  if (isAdded) applyState(true);

  if (modalCloseEls.length) {
    modalCloseEls.forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
  }

  if (modalConfirm) {
    modalConfirm.addEventListener("click", function () {
      closeModal();
      goToTrack();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isModalOpen) {
      event.preventDefault();
      closeModal();
    }
  });

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-added")) {
        goToTrack();
        return;
      }
      applyState(true);
      if (trackState && typeof trackState.setTrackEnrolled === "function") {
        trackState.setTrackEnrolled(slug, true);
      } else {
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch (ignore) {}
      }
      openModal(btn);
    });
  });
}

function setupTrackBioModal(track) {
  var readLink = document.getElementById("track-detail-read-bio");
  var modal = document.getElementById("track-bio-modal");
  var closeEls = document.querySelectorAll("[data-track-bio-close]");
  var avatar = document.getElementById("track-bio-modal-avatar");
  var nameEl = document.getElementById("track-bio-modal-name");
  var roleEl = document.getElementById("track-bio-modal-role");
  var content = document.getElementById("track-bio-modal-content");

  if (!readLink || !modal || !content) return;

  function renderBio() {
    if (avatar) {
      avatar.src = track.authorAvatar || "";
      avatar.alt = track.authorAvatarAlt || "";
    }
    if (nameEl) nameEl.textContent = track.authorName || "";
    if (roleEl) roleEl.textContent = track.authorRole || "";

    content.innerHTML = "";
    var paragraphs = track.authorBioFullParagraphs || [];
    if (!paragraphs.length && track.authorBioShort) {
      paragraphs = [track.authorBioShort];
    }
    paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      p.className = "track-bio-modal-p";
      p.textContent = text;
      content.appendChild(p);
    });
  }

  function openModal() {
    renderBio();
    modal.hidden = false;
    document.body.classList.add("track-bio-modal-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("track-bio-modal-open");
  }

  readLink.addEventListener("click", function (event) {
    event.preventDefault();
    openModal();
  });

  if (closeEls.length) {
    closeEls.forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      event.preventDefault();
      closeModal();
    }
  });
}

function initTrackDetailPage() {
  var slug = getTrackSlugFromQuery();
  var data = window.TRACKS_DATA || {};
  var track = data[slug];

  var mainBlock = document.getElementById("track-detail-main");
  var missing = document.getElementById("track-detail-missing");

  if (!track) {
    if (mainBlock) mainBlock.hidden = true;
    if (missing) missing.hidden = false;
    document.title = "NewLeaf";
    return;
  }

  if (missing) missing.hidden = true;
  if (mainBlock) mainBlock.hidden = false;

  renderTrackDetail(track);
  setupTrackAddButtons();
  setupTrackBioModal(track);
}

document.addEventListener("DOMContentLoaded", initTrackDetailPage);
