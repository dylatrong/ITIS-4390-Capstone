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

  var storageKey = "newleaf-track-added-" + getTrackSlugFromQuery();

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

  try {
    if (window.sessionStorage.getItem(storageKey) === "1") {
      applyState(true);
    }
  } catch (ignore) {}

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-added")) {
        var s = getTrackSlugFromQuery();
        if (s) {
          window.location.href =
            "my-tracks.html?track=" + encodeURIComponent(s);
        }
        return;
      }
      applyState(true);
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch (ignore) {}
    });
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
}

document.addEventListener("DOMContentLoaded", initTrackDetailPage);
