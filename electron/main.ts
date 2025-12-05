import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Be cautious with this setting in production
    },
  });

  if (process.env.NODE_ENV === 'development') {
    // Development mode: load from the Next.js dev server
    mainWindow.loadURL('http://localhost:9002/');
    // Open dev tools
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load from the exported static files
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../../out/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS it's common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
