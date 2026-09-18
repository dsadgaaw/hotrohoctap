const { app, BrowserWindow, ipcMain, session } = require('electron');

let mainWindow;
let isStudyLocked = false;

// Giả lập User-Agent Chrome chuẩn để vượt kiểm tra nhúng của YouTube (Lỗi 153 & 152-4)
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.webContents.setUserAgent(CHROME_USER_AGENT);
  mainWindow.loadFile('index.html');
  mainWindow.maximize();

  mainWindow.on('close', (e) => {
    if (isStudyLocked) {
      e.preventDefault();
      mainWindow.focus();
      mainWindow.webContents.send('force-show-emergency-modal');
    }
  });
}

app.whenReady().then(() => {
  app.userAgentFallback = CHROME_USER_AGENT;

  // Ghi đè Header Referer, Origin & User-Agent gửi tới YouTube
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.youtube.com/';
      details.requestHeaders['Origin'] = 'https://www.youtube.com';
      details.requestHeaders['User-Agent'] = CHROME_USER_AGENT;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  createWindow();
});

// QUẢN LÝ SỰ KIỆN TOÀN MÀN HÌNH VÀ BẢO MẬT
ipcMain.on('start-study-session', () => {
  isStudyLocked = true;
  if (mainWindow) {
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    if (mainWindow.setVisibleOnAllWorkspaces) {
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
  }
});

ipcMain.on('unlock-app', () => {
  isStudyLocked = false;
  if (mainWindow) {
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    if (mainWindow.setVisibleOnAllWorkspaces) {
      mainWindow.setVisibleOnAllWorkspaces(false);
    }
  }
});

ipcMain.on('focus-app', () => {
  if (mainWindow) {
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }
});

ipcMain.on('exit-fullscreen', () => {
  isStudyLocked = false;
  if (mainWindow) {
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    if (mainWindow.setVisibleOnAllWorkspaces) {
      mainWindow.setVisibleOnAllWorkspaces(false);
    }
  }
});

ipcMain.on('set-fullscreen', (event, flag) => {
  if (mainWindow) mainWindow.setFullScreen(flag);
});

ipcMain.on('quit-app', () => {
  isStudyLocked = false;
  app.quit();
});

ipcMain.on('close-window', () => {
  isStudyLocked = false;
  if (mainWindow) mainWindow.close();
});