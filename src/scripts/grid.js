const STORAGE_KEY = "panelHidden";

const btn = document.getElementById("toggleBtn");
const panel = document.getElementById("targetPanel");
const btnLabel = document.getElementById("btnLabel");
const btnIcon = document.getElementById("btnIcon");
const statusBadge = document.getElementById("statusBadge");
const storageNote = document.getElementById("storageNote");
const storageDot = document.getElementById("storageDot");

const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_OFF = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

function applyState(isHidden, save) {
  if (isHidden) {
    panel.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    btnLabel.textContent = "Show panel";
    btnIcon.innerHTML = EYE_OFF;
    statusBadge.textContent = "Hidden";
    statusBadge.className = "badge badge-hidden";
  } else {
    panel.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    btnLabel.textContent = "Hide panel";
    btnIcon.innerHTML = EYE_OPEN;
    statusBadge.textContent = "Visible";
    statusBadge.className = "badge badge-visible";
  }

  if (save) {
    try {
      localStorage.setItem(STORAGE_KEY, isHidden ? "true" : "false");
      storageNote.textContent = "State saved to localStorage";
      storageDot.style.background = "#1D9E75";
    } catch (e) {
      storageNote.textContent = "localStorage unavailable";
      storageDot.style.background = "#E24B4A";
    }
  }
}

function toggle() {
  const isNowHidden = !panel.classList.contains("hidden");
  applyState(isNowHidden, true);
}

// Restore saved state on load
(function restoreState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      applyState(saved === "true", false);
      storageNote.textContent = "State restored from localStorage";
    } else {
      storageNote.textContent = "No saved state yet — toggle to save";
      storageDot.style.background = "#888780";
    }
  } catch (e) {
    storageNote.textContent = "localStorage unavailable";
    storageDot.style.background = "#E24B4A";
  }
})();

btn.addEventListener("click", toggle);

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "g" || e.key === "G") {
    e.preventDefault();
    toggle();
  }
});
