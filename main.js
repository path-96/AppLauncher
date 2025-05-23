const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const isDev = !app.isPackaged;

  // Disable the default menu
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 500,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
    titleBarStyle: 'hiddenInset',
  });

  const urlToLoad = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '.next/production/index.html')}`;

  win.loadURL(urlToLoad);
});