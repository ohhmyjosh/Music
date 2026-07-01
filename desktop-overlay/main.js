const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  screen,
  session,
  desktopCapturer,
  nativeImage
} = require("electron");
const path = require("path");

let overlay = null;
let tray = null;
let visible = true;

const BAR_HEIGHT = 220; // how tall the visualizer strip is, in px

function createOverlay() {
  const primary = screen.getPrimaryDisplay();
  const { x, y, width, height } = primary.bounds;

  overlay = new BrowserWindow({
    x,
    y: y + height - BAR_HEIGHT,
    width,
    height: BAR_HEIGHT,
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
    // Stay lively even when it's not the focused window.
    webPreferences: { backgroundThrottling: false }
  });

  // Float above everything, follow across virtual desktops, and let all clicks
  // pass straight through to whatever is underneath.
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });

  overlay.loadFile(path.join(__dirname, "overlay.html"));
}

function trayIcon() {
  const img = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  return img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: visible ? "Turn visualizer OFF" : "Turn visualizer ON",
      click: toggleOverlay
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

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip("Josh-Fy Overlay — click to toggle");
  tray.setContextMenu(buildMenu());
  tray.on("click", toggleOverlay);
}

function toggleOverlay() {
  visible = !visible;
  if (visible) overlay.showInactive();
  else overlay.hide();
  tray.setContextMenu(buildMenu());
}

app.whenReady().then(() => {
  // Grant the renderer's getDisplayMedia request and hand it LOOPBACK audio,
  // i.e. whatever is currently coming out of the speakers (Windows).
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
        callback({ video: sources[0], audio: "loopback" });
      });
    },
    { useSystemPicker: false }
  );

  createOverlay();
  createTray();
});

// Tray app: keep running after the overlay window is hidden/closed.
app.on("window-all-closed", (e) => e.preventDefault());
