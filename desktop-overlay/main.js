const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  screen,
  nativeImage
} = require("electron");
const path = require("path");
const fs = require("fs");
const WebSocket = require("ws");

const BAR_HEIGHT = 90; // how tall the visualizer strip is, in px (sits just above the taskbar)
const BRIDGE_PORT = 17632; // local port the Josh-Fy web app streams audio to

let overlays = []; // one transparent window per display
let tray = null;
let wss = null; // local WebSocket server the web app connects to
let lastNowPlaying = { title: null, artist: null, status: "None" };

// ---- Settings persistence -------------------------------------------------
// Remember the user's choices between launches (userData survives updates).
const settingsPath = path.join(app.getPath("userData"), "settings.json");
const defaults = { enabled: true, position: "bottom", showNowPlaying: true };
let settings = { ...defaults };

function loadSettings() {
  try {
    settings = { ...defaults, ...JSON.parse(fs.readFileSync(settingsPath, "utf8")) };
  } catch {
    settings = { ...defaults };
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch {
    /* best-effort; overlay still works without persisted settings */
  }
}

// ---- Overlay windows (all monitors) --------------------------------------
function boundsForDisplay(display) {
  // Use workArea (screen minus the taskbar) so the strip rests just above the
  // taskbar instead of drawing over it.
  const { x, y, width, height } = display.workArea;
  const top = settings.position === "top";
  return { x, y: top ? y : y + height - BAR_HEIGHT, width, height: BAR_HEIGHT };
}

function createOverlayForDisplay(display) {
  const overlay = new BrowserWindow({
    ...boundsForDisplay(display),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Stay lively even when it's not the focused window.
      backgroundThrottling: false
    }
  });

  // Float above everything, follow across virtual desktops, and let all clicks
  // pass straight through to whatever is underneath.
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });

  overlay.once("ready-to-show", () => {
    overlay.webContents.send("config", settings);
    overlay.webContents.send("now-playing", lastNowPlaying);
  });

  overlay.loadFile(path.join(__dirname, "overlay.html"));
  return overlay;
}

function createOverlays() {
  destroyOverlays();
  overlays = screen.getAllDisplays().map(createOverlayForDisplay);
  if (settings.enabled) showOverlays();
  else hideOverlays();
}

function destroyOverlays() {
  overlays.forEach((w) => !w.isDestroyed() && w.destroy());
  overlays = [];
}

function showOverlays() {
  overlays.forEach((w) => !w.isDestroyed() && w.showInactive());
}

function hideOverlays() {
  overlays.forEach((w) => !w.isDestroyed() && w.hide());
}

function repositionOverlays() {
  const displays = screen.getAllDisplays();
  overlays.forEach((w, i) => {
    if (w.isDestroyed() || !displays[i]) return;
    w.setBounds(boundsForDisplay(displays[i]));
  });
}

function broadcast(channel, payload) {
  overlays.forEach((w) => !w.isDestroyed() && w.webContents.send(channel, payload));
}

// ---- Audio bridge (Josh-Fy web app -> overlay) ----------------------------
// The web app connects here and streams its OWN analyser frames. This is the
// only source of visualizer data, so the overlay reacts to Josh-Fy alone.
function startAudioBridge() {
  try {
    wss = new WebSocket.Server({ host: "127.0.0.1", port: BRIDGE_PORT });
  } catch {
    return; // port busy / blocked — overlay still runs, just stays idle
  }

  wss.on("connection", (socket) => {
    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || msg.t !== "joshfy-audio") return;

      broadcast("audio-data", {
        playing: Boolean(msg.playing),
        real: Boolean(msg.real),
        bins: Array.isArray(msg.bins) ? msg.bins : []
      });

      lastNowPlaying = {
        title: msg.title || null,
        artist: msg.artist || null,
        status: msg.playing ? "Playing" : "Paused"
      };
      broadcast("now-playing", lastNowPlaying);
    });

    socket.on("close", () => {
      // Web app closed/navigated away — clear the wave and label.
      broadcast("audio-data", { playing: false, real: false, bins: [] });
      lastNowPlaying = { title: null, artist: null, status: "None" };
      broadcast("now-playing", lastNowPlaying);
    });
  });

  wss.on("error", () => {});
}

function stopAudioBridge() {
  if (wss) {
    try {
      wss.close();
    } catch {
      /* ignore */
    }
    wss = null;
  }
}

// ---- Tray -----------------------------------------------------------------
function trayIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  return img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: settings.enabled ? "Turn visualizer OFF" : "Turn visualizer ON",
      click: toggleOverlay
    },
    {
      label: "Position",
      submenu: [
        {
          label: "Bottom of screen",
          type: "radio",
          checked: settings.position === "bottom",
          click: () => setPosition("bottom")
        },
        {
          label: "Top of screen",
          type: "radio",
          checked: settings.position === "top",
          click: () => setPosition("top")
        }
      ]
    },
    {
      label: "Show track name",
      type: "checkbox",
      checked: settings.showNowPlaying,
      click: (item) => {
        settings.showNowPlaying = item.checked;
        saveSettings();
        broadcast("config", settings);
      }
    },
    {
      label: "Start with Windows",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked })
    },
    { type: "separator" },
    { label: "Quit Josh-Fy Overlay", click: () => app.quit() }
  ]);
}

function refreshMenu() {
  if (tray) tray.setContextMenu(buildMenu());
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip("Josh-Fy Overlay — click to toggle");
  refreshMenu();
  tray.on("click", toggleOverlay);
}

function toggleOverlay() {
  settings.enabled = !settings.enabled;
  saveSettings();
  if (settings.enabled) showOverlays();
  else hideOverlays();
  refreshMenu();
}

function setPosition(position) {
  settings.position = position;
  saveSettings();
  repositionOverlays();
  broadcast("config", settings);
  refreshMenu();
}

// ---- Lifecycle ------------------------------------------------------------
app.whenReady().then(() => {
  loadSettings();
  createOverlays();
  createTray();
  startAudioBridge();

  // Keep overlays matched to the physical monitor layout as it changes.
  screen.on("display-added", createOverlays);
  screen.on("display-removed", createOverlays);
  screen.on("display-metrics-changed", repositionOverlays);
});

app.on("will-quit", stopAudioBridge);

// Tray app: keep running after the overlay windows are hidden/closed.
app.on("window-all-closed", (e) => e.preventDefault());
