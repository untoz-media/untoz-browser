import { app, BrowserView, BrowserWindow, ipcMain, screen, type WebContents } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  isHttpUrl,
  isSafeTabId,
  readNavigateRequest,
  sanitizeBounds,
  type ViewBounds,
} from '../src/lib/navigation';

const moduleDir = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
const views = new Map<string, BrowserView>();
let activeTabId: string | null = null;
let lastBounds: ViewBounds = { x: 0, y: 0, width: 0, height: 0 };

const sendNavigationState = (tabId: string, contents: WebContents) => {
  if (!mainWindow || contents.isDestroyed()) return;
  mainWindow.webContents.send('browser:navigation-state', {
    tabId,
    url: contents.getURL(),
    title: contents.getTitle(),
    canGoBack: contents.canGoBack(),
    canGoForward: contents.canGoForward(),
    isLoading: contents.isLoading(),
  });
};

const destroyView = (view: BrowserView) => {
  const contents = view.webContents as WebContents & { destroy?: () => void };
  if (contents.isDestroyed()) return;
  contents.removeAllListeners();
  if (typeof contents.destroy === 'function') {
    contents.destroy();
    return;
  }
  contents.stop();
};

const attachView = (tabId: string, view: BrowserView) => {
  const contents = view.webContents;
  const send = () => sendNavigationState(tabId, contents);

  contents.on('did-start-loading', send);
  contents.on('did-stop-loading', send);
  contents.on('did-navigate', send);
  contents.on('did-navigate-in-page', send);
  contents.on('page-title-updated', send);
  contents.on('did-fail-load', (_event, _errorCode, _description, _validatedURL, isMainFrame) => {
    if (isMainFrame) send();
  });
  contents.on('page-favicon-updated', (_event, favicons) => {
    mainWindow?.webContents.send('browser:favicon-updated', {
      tabId,
      favicon: favicons[0] ?? '',
    });
  });
  contents.on('will-navigate', (event, url) => {
    if (!isHttpUrl(url)) event.preventDefault();
  });
  contents.on('will-redirect', (event, url) => {
    if (!isHttpUrl(url)) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) mainWindow?.webContents.send('browser:open-url', url);
    return { action: 'deny' };
  });
};

const createView = (tabId: string) => {
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });
  view.setBackgroundColor('#ffffff');
  attachView(tabId, view);
  views.set(tabId, view);
  return view;
};

const showTab = (tabId: string) => {
  const view = views.get(tabId);
  if (!view || !mainWindow || view.webContents.isDestroyed()) return;
  activeTabId = tabId;
  mainWindow.setBrowserView(view);
  view.setBounds(lastBounds);
  sendNavigationState(tabId, view.webContents);
  mainWindow.webContents.send('browser:request-bounds');
};

const hideView = () => {
  mainWindow?.setBrowserView(null);
};

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.85),
    height: Math.floor(height * 0.85),
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(moduleDir, 'preload.js'),
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
    mainWindow.loadFile(join(moduleDir, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('browser:request-bounds');
  });

  mainWindow.on('closed', () => {
    for (const view of views.values()) destroyView(view);
    views.clear();
    activeTabId = null;
    mainWindow = null;
  });
};

const viewFor = (tabId: string) => views.get(tabId);

ipcMain.on('browser:set-bounds', (_event, bounds: unknown) => {
  const safe = sanitizeBounds(bounds);
  if (!safe) return;
  lastBounds = safe;
  if (!activeTabId) return;
  viewFor(activeTabId)?.setBounds(safe);
});

ipcMain.on('browser:ensure-tab', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string' || !isSafeTabId(tabId) || views.has(tabId)) return;
  createView(tabId);
});

ipcMain.on('browser:show-tab', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string' || !isSafeTabId(tabId)) return;
  showTab(tabId);
});

ipcMain.on('browser:hide', () => {
  hideView();
});

ipcMain.on('browser:close-tab', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string' || !isSafeTabId(tabId)) return;
  const view = views.get(tabId);
  if (!view) return;
  if (activeTabId === tabId) {
    hideView();
    activeTabId = null;
  }
  views.delete(tabId);
  destroyView(view);
});

ipcMain.on('browser:navigate', (_event, payload: unknown) => {
  const request = readNavigateRequest(payload, activeTabId);
  if (!request) return;
  const view = views.get(request.tabId) ?? createView(request.tabId);
  view.webContents.loadURL(request.url);
  if (activeTabId === request.tabId) showTab(request.tabId);
});

ipcMain.on('browser:back', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string') return;
  const contents = viewFor(tabId)?.webContents;
  if (contents && !contents.isDestroyed() && contents.canGoBack()) contents.goBack();
});

ipcMain.on('browser:forward', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string') return;
  const contents = viewFor(tabId)?.webContents;
  if (contents && !contents.isDestroyed() && contents.canGoForward()) contents.goForward();
});

ipcMain.on('browser:reload', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string') return;
  const contents = viewFor(tabId)?.webContents;
  if (contents && !contents.isDestroyed()) contents.reload();
});

ipcMain.on('browser:stop', (_event, tabId: unknown) => {
  if (typeof tabId !== 'string') return;
  const contents = viewFor(tabId)?.webContents;
  if (contents && !contents.isDestroyed()) contents.stop();
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
