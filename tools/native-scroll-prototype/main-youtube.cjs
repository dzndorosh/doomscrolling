/** Development-only Phase B window. It intentionally does not import app code. */
const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');

const YOUTUBE_REFERER = 'https://focusreels.app/';
const YOUTUBE_REQUEST_FILTER = {
  urls: ['https://www.youtube.com/*', 'https://www.youtube-nocookie.com/*'],
};

function installYoutubeRefererHandler() {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    YOUTUBE_REQUEST_FILTER,
    (details, callback) => {
      const requestHeaders = { ...details.requestHeaders, Referer: YOUTUBE_REFERER };
      // Diagnostic only: never print cookies or any other request headers.
      console.log(`[native-scroll-youtube] youtube-request ${details.url} referer-present=${requestHeaders.Referer === YOUTUBE_REFERER}`);
      callback({ requestHeaders });
    },
  );
}

function createWindow() {
  const window = new BrowserWindow({
    width: 326,
    height: 720,
    useContentSize: true,
    resizable: false,
    title: 'FocusReels — Native Scroll YouTube Prototype',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  window.removeMenu();
  window.webContents.on('console-message', (_event, _level, message) => {
    if (message.startsWith('[native-scroll-youtube]')) console.log(message);
  });
  window.loadFile(path.join(__dirname, 'index-youtube.html'));
}

app.whenReady().then(() => {
  // Register before BrowserWindow/loadFile so the first API request is covered.
  installYoutubeRefererHandler();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
