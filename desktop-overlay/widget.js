// Josh-Fy floating widget — album in the centre with play/pause, plus prev/next.
//
// Driven by the same now-playing/audio frames the bottom overlay uses, and its
// buttons send controls back to the web app over the bridge
// (widget -> main -> web app player). The audio visuals themselves live on the
// bottom-of-screen strip, so this widget stays clean and simple.

const coverWrap = document.getElementById("cover-wrap");
const coverEl = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");

let frameAt = 0;

// Fallback gradient cover (matches the app's placeholder vibe).
const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 176 176'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='60%25' stop-color='%231a1a23'/%3E%3Cstop offset='100%25' stop-color='%230a0a0f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='176' height='176' rx='20' fill='url(%23g)'/%3E%3C/svg%3E";

coverEl.src = PLACEHOLDER;
coverEl.onerror = () => {
  if (coverEl.src !== PLACEHOLDER) coverEl.src = PLACEHOLDER;
};

function setPlaying(playing) {
  iconPlay.style.display = playing ? "none" : "block";
  iconPause.style.display = playing ? "block" : "none";
  coverWrap.classList.toggle("playing", playing);
}

// ---- Style + size from settings --------------------------------------------
// "full" keeps the play button floating over the album art; "compact" is a
// slim pill, so the button moves into the controls row next to Next.
const controlsEl = document.getElementById("controls");
const playPauseEl = document.getElementById("playpause");
const nextEl = document.getElementById("next");

function applyLayout(cfg) {
  const compact = cfg.widgetStyle === "compact";
  document.body.classList.toggle("compact", compact);
  document.body.classList.toggle("size-small", cfg.widgetSize === "small");
  document.body.classList.toggle("size-large", cfg.widgetSize === "large");
  if (compact) {
    controlsEl.insertBefore(playPauseEl, nextEl);
  } else if (playPauseEl.parentElement !== coverWrap) {
    coverWrap.appendChild(playPauseEl);
  }
}

// ---- Live wiring from the main process ------------------------------------
if (window.joshfy) {
  window.joshfy.onConfig((cfg) => applyLayout(cfg || {}));

  window.joshfy.onAudioData((data) => {
    frameAt = performance.now();
    setPlaying(Boolean(data && data.playing));
  });

  window.joshfy.onNowPlaying((info) => {
    const hasTrack = info && info.title;
    if (hasTrack) {
      titleEl.textContent = info.title;
      titleEl.classList.remove("dim");
      artistEl.textContent = info.artist || "";
      coverEl.src = info.artwork || PLACEHOLDER;
    } else {
      titleEl.textContent = "Nothing playing";
      titleEl.classList.add("dim");
      artistEl.textContent = "Open Josh-Fy and hit play";
      coverEl.src = PLACEHOLDER;
    }
    setPlaying(Boolean(info && info.status === "Playing"));
  });
}

// ---- Controls -------------------------------------------------------------
function control(action) {
  if (window.joshfy && window.joshfy.sendControl) window.joshfy.sendControl(action);
}
document.getElementById("playpause").addEventListener("click", () => control("toggle"));
document.getElementById("next").addEventListener("click", () => control("next"));
document.getElementById("prev").addEventListener("click", () => control("prev"));
