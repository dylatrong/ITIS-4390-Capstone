function getActivitySlugFromQuery() {
  var params = new URLSearchParams(window.location.search);
  var raw = params.get("activity");
  return raw ? String(raw).trim().toLowerCase() : "";
}

function renderActivityPage(activity) {
  document.title = activity.pageTitle;

  var back = document.getElementById("activity-back");
  if (back) back.setAttribute("href", activity.backHref || "#");

  var bannerTitle = document.getElementById("activity-banner-title");
  if (bannerTitle) bannerTitle.textContent = activity.bannerTitle || "";

  var introLabel = document.getElementById("activity-label-intro");
  if (introLabel) introLabel.textContent = activity.introSectionTitle || "";

  var planLabel = document.getElementById("activity-label-plan");
  if (planLabel) planLabel.textContent = activity.planSectionTitle || "";

  var introImg = document.getElementById("activity-intro-img");
  if (introImg) {
    introImg.src = activity.introImage || "";
    introImg.alt = activity.introImageAlt || "";
  }

  var introCopy = document.getElementById("activity-intro-copy");
  if (introCopy) {
    introCopy.innerHTML = "";
    (activity.introParagraphs || []).forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      introCopy.appendChild(p);
    });
  }

  var planTitle = document.getElementById("activity-plan-title");
  if (planTitle) planTitle.textContent = activity.planTitle || "";

  var planHint = document.getElementById("activity-plan-hint");
  if (planHint) planHint.textContent = activity.planHint || "";

  var planNotes = document.getElementById("activity-plan-notes");
  if (planNotes) planNotes.value = "";

  var pledge = document.getElementById("activity-btn-pledge");
  if (pledge) {
    var href = activity.pledgeHref || activity.backHref || "my-tracks.html";
    pledge.onclick = function () {
      window.location.href = href;
    };
  }
}

function initActivityPage() {
  var slug = getActivitySlugFromQuery();
  var data = window.ACTIVITIES_DATA || {};
  var activity = data[slug];

  var content = document.getElementById("activity-content");
  var missing = document.getElementById("activity-missing");

  if (!activity) {
    if (content) content.hidden = true;
    if (missing) missing.hidden = false;
    document.title = "NewLeaf — Activity not found";
    return;
  }

  if (missing) missing.hidden = true;
  if (content) content.hidden = false;

  renderActivityPage(activity);
}

document.addEventListener("DOMContentLoaded", initActivityPage);
