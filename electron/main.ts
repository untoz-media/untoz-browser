import { app, BrowserView, BrowserWindow, ipcMain, screen } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let browserView: BrowserView | null = null;

const sendNavigationState = () => {
  if (!mainWindow || !browserView || browserView.webContents.isDestroyed()) return;

  mainWindow.webContents.send('browser:navigation-state', {
    url: browserView.webContents.getURL(),
    title: browserView.webContents.getTitle(),
    canGoBack: browserView.webContents.canGoBack(),
    canGoForward: browserView.webContents.canGoForward(),
    isLoading: browserView.webContents.isLoading(),
  });
};

const createBrowserView = () => {
  if (!mainWindow) return;

  browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setBrowserView(browserView);
  browserView.setBackgroundColor('#ffffff');

  const contents = browserView.webContents;

  contents.on('did-start-loading', sendNavigationState);
  contents.on('did-stop-loading', sendNavigationState);
  contents.on('did-navigate', sendNavigationState);
  contents.on('did-navigate-in-page', sendNavigationState);
  contents.on('page-title-updated', sendNavigationState);
  contents.on('page-favicon-updated', (_event, favicons) => {
    mainWindow?.webContents.send('browser:favicon-updated', favicons[0] ?? '');
  });

  contents.setWindowOpenHandler(({ url }) => {
    contents.loadURL(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', () => {
    setTimeout(sendNavigationState, 0);
  });

  contents.loadURL('https://www.untoz.com');
  mainWindow.webContents.send('browser:request-bounds');
};

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.85),
    height: Math.floor(height * 0.85),
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    createBrowserView();
  });

  mainWindow.on('closed', () => {
    browserView?.webContents.close();
    browserView = null;
    mainWindow = null;
  });
};

ipcMain.on('browser:set-bounds', (_event, bounds) => {
  if (!browserView) return;

  browserView.setBounds({
    x: Math.max(0, Math.round(bounds.x)),
    y: Math.max(0, Math.round(bounds.y)),
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height)),
  });
});

ipcMain.on('browser:navigate', (_event, url: string) => {
  if (!browserView || !url) return;
  browserView.webContents.loadURL(url);
});

ipcMain.on('browser:back', () => {
  if (browserView?.webContents.canGoBack()) browserView.webContents.goBack();
});

ipcMain.on('browser:forward', () => {
  if (browserView?.webContents.canGoForward()) browserView.webContents.goForward();
});

ipcMain.on('browser:reload', () => {
  browserView?.webContents.reload();
});

ipcMain.on('browser:stop', () => {
  browserView?.webContents.stop();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
