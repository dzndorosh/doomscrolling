/**
 * Development-only native scroll-snap experiment.
 *
 * This deliberately has no imports from the FocusReels application.  Keeping
 * the Electron entry point here lets the experiment use the exact video-stage
 * content size without changing production window or playback code.
 */
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const VIDEO_STAGE = { width: 326, height: 720 };

function createPrototypeWindow() {
  const window = new BrowserWindow({
    ...VIDEO_STAGE,
    useContentSize: true,
    resizable: false,
    title: 'FocusReels — Native Scroll Prototype',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createPrototypeWindow);
app.on('window-all-closed', () => app.quit());
