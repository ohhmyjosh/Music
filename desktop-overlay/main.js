const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  screen,
  ipcMain,
  nativeImage
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");
const WebSocket = require("ws");

const BAR_HEIGHT = 168; // visualizer strip height, in px — a bold waveform band rooted at the very bottom edge of the screen
const BRIDGE_PORT = 17632; // local port the Josh-Fy web app streams audio to
const APP_PORT = 17650; // preferred port the bundled Josh-Fy UI is served on

let overlays = []; // one transparent window per display
let mainWindow = null; // the actual Josh-Fy app window
let widget = null; // floating mini-player widget
let tray = null;
let wss = null; // local WebSocket server the web app connects to
let activeAppSocket = null; // the currently connected Josh-Fy web app (for controls)
let lastNowPlaying = { title: null, artist: null, artwork: null, status: "None" };
let appServerPort = APP_PORT;

// Where the built web app lives: packaged into resources, or ../dist in dev.
const DIST_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "dist")
  : path.join(__dirname, "..", "dist");

// ---- Settings persistence -------------------------------------------------
// Remember the user's choices between launches (userData survives updates).
const settingsPath = path.join(app.getPath("userData"), "settings.json");
const defaults = {
  enabled: true,
  position: "bottom",
  showNowPlaying: true,
  showWidget: true,
  widgetStyle: "full", // "full" card with album art, or "compact" pill bar
  widgetSize: "medium" // small | medium | large
};
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

// ---- Static server for the bundled Josh-Fy UI -----------------------------
// Serving the built app over http://127.0.0.1 (rather than file://) matters for
// three reasons: BrowserRouter needs a server with an index.html fallback, the
// service worker/assets expect an http origin, and — crucially — the web app's
// overlay bridge only streams audio from an http localhost origin. So this is
// what lets the visualizer light up at all.
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".txt": "text/plain"
};

function serveFile(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(status, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function handleRequest(req, res) {
  let pathname = "/";
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname || "/");
  } catch {
    pathname = "/";
  }
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(DIST_DIR, pathname));
  // Never let a crafted path escape the dist directory.
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serveFile(res, filePath);
      return;
    }
    // SPA fallback: any route without a file extension serves the app shell so
    // client-side routing (BrowserRouter) works on deep links.
    if (!path.extname(pathname)) {
      serveFile(res, path.join(DIST_DIR, "index.html"));
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });
}

function startAppServer() {
  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);
    server.on("error", () => {
      // Preferred port busy — let the OS pick any free one.
      const fallback = http.createServer(handleRequest);
      fallback.listen(0, "127.0.0.1", () => {
        appServerPort = fallback.address().port;
        resolve();
      });
    });
    server.listen(APP_PORT, "127.0.0.1", () => {
      appServerPort = APP_PORT;
      resolve();
    });
  });
}

function appUrl() {
  return `http://127.0.0.1:${appServerPort}/`;
}

// ---- Main app window ------------------------------------------------------
function windowIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.png"));
  return img.isEmpty() ? undefined : img;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: "#0a0a0f",
    icon: windowIcon(),
    title: "Josh-Fy",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Keep the audio bridge's 30fps stream alive while the window is minimized
      // or in the background, so the overlay and widget keep reacting.
      backgroundThrottling: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadURL(appUrl());

  // Closing the main window hides it to the tray instead of quitting, so the
  // overlay and widget keep running. Real quit goes through the tray menu.
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ---- Overlay windows (all monitors) --------------------------------------
function boundsForDisplay(display) {
  // Use the FULL display bounds (not workArea) so the wave grows from the true
  // bottom edge of the screen — over the taskbar, like it's part of the OS.
  const { x, y, width, height } = display.bounds;
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

// ---- Floating mini widget -------------------------------------------------
// Two styles, three sizes each. "full" is the album-art card; "compact" is a
// slim pill with just cover + play/pause + next.
const WIDGET_DIMS = {
  full: { small: [200, 272], medium: [240, 320], large: [288, 384] },
  compact: { small: [232, 64], medium: [288, 76], large: [344, 88] }
};
const WIDGET_MARGIN = 24;

function widgetDims() {
  const style = WIDGET_DIMS[settings.widgetStyle] || WIDGET_DIMS.full;
  const [width, height] = style[settings.widgetSize] || style.medium;
  return { width, height };
}

function widgetBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const { width, height } = widgetDims();
  return {
    x: wa.x + wa.width - width - WIDGET_MARGIN,
    y: wa.y + wa.height - height - WIDGET_MARGIN,
    width,
    height
  };
}

// Apply a style/size change live: persist, resize the window, let the widget
// page restyle itself via the config broadcast.
function applyWidgetLayout() {
  saveSettings();
  if (widget && !widget.isDestroyed()) widget.setBounds(widgetBounds());
  broadcast("config", settings);
  refreshMenu();
}

function createWidget() {
  if (widget && !widget.isDestroyed()) return;

  widget = new BrowserWindow({
    ...widgetBounds(),
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  widget.setAlwaysOnTop(true, "screen-saver");
  widget.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  widget.once("ready-to-show", () => {
    widget.webContents.send("config", settings);
    widget.webContents.send("now-playing", lastNowPlaying);
  });

  widget.loadFile(path.join(__dirname, "widget.html"));
  if (settings.showWidget) widget.showInactive();
  else widget.hide();
}

function setWidgetVisible(visible) {
  settings.showWidget = visible;
  saveSettings();
  if (!widget || widget.isDestroyed()) {
    if (visible) createWidget();
  } else if (visible) {
    widget.showInactive();
  } else {
    widget.hide();
  }
  refreshMenu();
}

// ---- Broadcasting to all data-driven windows ------------------------------
function dataWindows() {
  const list = [...overlays];
  if (widget && !widget.isDestroyed()) list.push(widget);
  return list.filter((w) => w && !w.isDestroyed());
}

function broadcast(channel, payload) {
  dataWindows().forEach((w) => w.webContents.send(channel, payload));
}

// ---- Audio bridge (Josh-Fy web app <-> overlay/widget) --------------------
// The web app connects here and streams its OWN analyser frames. This is the
// only source of visualizer data, so the overlay reacts to Josh-Fy alone. The
// same socket carries control messages the other way (widget -> player).
function startAudioBridge() {
  try {
    wss = new WebSocket.Server({ host: "127.0.0.1", port: BRIDGE_PORT });
  } catch {
    return; // port busy / blocked — overlay still runs, just stays idle
  }

  wss.on("connection", (socket) => {
    activeAppSocket = socket;

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
        artwork: msg.artwork || null,
        status: msg.playing ? "Playing" : "Paused"
      };
      broadcast("now-playing", lastNowPlaying);
    });

    socket.on("close", () => {
      if (activeAppSocket === socket) activeAppSocket = null;
      // Web app closed/navigated away — clear the wave and label.
      broadcast("audio-data", { playing: false, real: false, bins: [] });
      lastNowPlaying = { title: null, artist: null, artwork: null, status: "None" };
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

// Widget buttons -> player. Relayed to the web app over the same socket.
ipcMain.on("widget-control", (_event, action) => {
  if (activeAppSocket && activeAppSocket.readyState === WebSocket.OPEN) {
    try {
      activeAppSocket.send(JSON.stringify({ t: "joshfy-control", action }));
    } catch {
      /* socket closing — ignore */
    }
  }
});

// ---- Tray -----------------------------------------------------------------
function trayIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  return img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: "Open Josh-Fy", click: createMainWindow },
    {
      label: settings.enabled ? "Turn visualizer OFF" : "Turn visualizer ON",
      click: toggleOverlay
    },
    {
      label: "Mini widget",
      submenu: [
        {
          label: "Show widget",
          type: "checkbox",
          checked: settings.showWidget,
          click: (item) => setWidgetVisible(item.checked)
        },
        { type: "separator" },
        {
          label: "Full card",
          type: "radio",
          checked: settings.widgetStyle !== "compact",
          click: () => {
            settings.widgetStyle = "full";
            applyWidgetLayout();
          }
        },
        {
          label: "Compact bar",
          type: "radio",
          checked: settings.widgetStyle === "compact",
          click: () => {
            settings.widgetStyle = "compact";
            applyWidgetLayout();
          }
        },
        { type: "separator" },
        ...["small", "medium", "large"].map((size) => ({
          label: size.charAt(0).toUpperCase() + size.slice(1),
          type: "radio",
          checked: (settings.widgetSize || "medium") === size,
          click: () => {
            settings.widgetSize = size;
            applyWidgetLayout();
          }
        }))
      ]
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
    {
      label: "Quit Josh-Fy",
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function refreshMenu() {
  if (tray) tray.setContextMenu(buildMenu());
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip("Josh-Fy — click to open");
  refreshMenu();
  tray.on("click", createMainWindow);
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
app.whenReady().then(async () => {
  loadSettings();
  await startAppServer();
  createMainWindow();
  createOverlays();
  createWidget();
  createTray();
  startAudioBridge();

  // Keep overlays matched to the physical monitor layout as it changes.
  screen.on("display-added", createOverlays);
  screen.on("display-removed", createOverlays);
  screen.on("display-metrics-changed", () => {
    repositionOverlays();
    if (widget && !widget.isDestroyed()) widget.setBounds(widgetBounds());
  });

  app.on("activate", createMainWindow);
});

app.on("before-quit", () => {
  app.isQuitting = true;
});
app.on("will-quit", stopAudioBridge);

// Tray app: keep running after the overlay/main windows are hidden/closed.
app.on("window-all-closed", (e) => e.preventDefault());
