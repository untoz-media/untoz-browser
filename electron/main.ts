import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  session,
  shell,
  type IpcMainInvokeEvent,
} from "electron";
import { isAbsolute, join } from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { IPC, type BrowserState } from "../shared/browser";
import { isCommand } from "../shared/commands";
import { isWebUrl } from "../shared/navigation";
import { Storage, validSettings } from "./storage";
import { Tabs } from "./tabs";

if (process.env.UNTOZ_TEST_PROFILE && !app.isPackaged)
  app.setPath("userData", process.env.UNTOZ_TEST_PROFILE);
const profileDirectory = app.commandLine.getSwitchValue("user-data-dir");
if (profileDirectory && isAbsolute(profileDirectory))
  app.setPath("userData", profileDirectory);
const primaryInstance = app.requestSingleInstanceLock();
let mainWindow: BrowserWindow | null = null;
let tabs: Tabs;
let storage: Storage;
let publishTimer: ReturnType<typeof setTimeout> | undefined;
let disposing = false;
let previousState: BrowserState | undefined;
const rendererFile = join(__dirname, "../dist/index.html");
const rendererURL =
  process.env.VITE_DEV_SERVER_URL || pathToFileURL(rendererFile).href;
function trusted(event: IpcMainInvokeEvent) {
  return (
    !!mainWindow &&
    event.sender === mainWindow.webContents &&
    event.senderFrame === mainWindow.webContents.mainFrame &&
    event.senderFrame.url.split("#")[0] === rendererURL.split("#")[0]
  );
}
function snapshot(): BrowserState {
  return {
    tabs: tabs.snapshot(),
    activeTabId: tabs.activeId,
    settings: storage.data.settings,
    bookmarks: storage.data.bookmarks,
    history: storage.data.history,
    quickLinks: storage.data.quickLinks,
    downloads: tabs.downloads.snapshot(),
    storageError: storage.error,
    about: {
      version: app.getVersion(),
      electron: process.versions.electron,
      chromium: process.versions.chrome,
      filtersUpdated: tabs.privacy.filters.updated,
    },
  };
}
function publish() {
  if (publishTimer || disposing) return;
  publishTimer = setTimeout(() => {
    publishTimer = undefined;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const state = snapshot();
    mainWindow.setTitle(
      `${state.tabs.find((t) => t.id === state.activeTabId)?.title || "New Tab"} — Untoz Browser`,
    );
    // Library arrays are immutable. Send them only when changed, not on every loading/progress event.
    const patch: Partial<BrowserState> = {
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      downloads: state.downloads,
      storageError: state.storageError,
    };
    if (state.settings !== previousState?.settings)
      patch.settings = state.settings;
    if (state.bookmarks !== previousState?.bookmarks)
      patch.bookmarks = state.bookmarks;
    if (state.history !== previousState?.history) patch.history = state.history;
    if (state.quickLinks !== previousState?.quickLinks)
      patch.quickLinks = state.quickLinks;
    previousState = state;
    mainWindow.webContents.send(IPC.state, patch);
  }, 50);
}
function registerIPC() {
  ipcMain.handle(IPC.snapshot, (event) => {
    if (!trusted(event)) throw new Error("Untrusted sender");
    return snapshot();
  });
  ipcMain.handle(IPC.command, async (event, command: unknown) => {
    if (!trusted(event) || !isCommand(command) || disposing || !mainWindow)
      throw new Error("Invalid browser command");
    switch (command.type) {
      case "open-licenses": {
        const file = join(
          app.isPackaged ? process.resourcesPath : app.getAppPath(),
          app.isPackaged ? "licenses" : "resources/licenses",
          "THIRD-PARTY-NOTICES.txt",
        );
        const error = await shell.openPath(file);
        if (error) throw new Error(error);
        break;
      }
      case "new-tab":
        if (tabs.entries.size >= 100)
          throw new Error("Close a tab before opening more.");
        tabs.create(command.url, command.private);
        break;
      case "activate-tab":
        tabs.activate(command.id);
        break;
      case "close-tab":
        await tabs.close(command.id);
        break;
      case "navigate":
        tabs.navigate(command.input);
        break;
      case "back":
      case "forward":
      case "reload":
      case "stop":
        tabs.command(command.type);
        break;
      case "viewport":
        tabs.viewport(command.bounds, command.visible);
        return;
      case "bookmark": {
        const tab = tabs.entries.get(tabs.activeId)?.data;
        if (!tab || !isWebUrl(tab.url)) break;
        const existing = storage.data.bookmarks.find((b) => b.url === tab.url);
        if (existing)
          storage.data.bookmarks = storage.data.bookmarks.filter(
            (b) => b.id !== existing.id,
          );
        else
          storage.data.bookmarks = [
            ...storage.data.bookmarks,
            {
              id: randomUUID(),
              url: tab.url,
              title: tab.title,
              favicon: tab.favicon,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ];
        break;
      }
      case "remove-bookmark":
        storage.data.bookmarks = storage.data.bookmarks.filter(
          (b) => b.id !== command.id,
        );
        break;
      case "clear-history":
        storage.data.history = [];
        break;
      case "remove-history":
        storage.data.history = storage.data.history.filter(
          (h) => h.url !== command.url,
        );
        break;
      case "toggle-site-protection": {
        const tab = tabs.entries.get(tabs.activeId)?.data;
        if (!tab || !isWebUrl(tab.url)) break;
        if (tab.private) tabs.privacy.togglePrivateSite(tab.url);
        else {
          const host = new URL(tab.url).hostname;
          const sites = storage.data.settings.siteExceptions;
          storage.data.settings = {
            ...storage.data.settings,
            siteExceptions: sites.includes(host)
              ? sites.filter((h) => h !== host)
              : [...sites, host].slice(-1000),
          };
        }
        break;
      }
      case "clear-cookies":
      case "clear-data": {
        const result = await dialog.showMessageBox(mainWindow, {
          type: "warning",
          message:
            command.type === "clear-cookies"
              ? "Clear all cookies?"
              : "Clear browsing data?",
          detail:
            command.type === "clear-cookies"
              ? "All tabs will close and all cookies will be deleted. You will be signed out. History and other site storage remain."
              : "All tabs will close. Cookies, site storage, cache, history and permission grants will be cleared. Bookmarks and downloaded files remain.",
          buttons: ["Cancel", "Clear data"],
          defaultId: 0,
          cancelId: 0,
        });
        if (result.response === 1)
          await tabs.clearData(command.type === "clear-cookies");
        break;
      }
      case "revoke-permissions":
        tabs.privacy.revoke();
        break;
      case "settings":
        storage.data.settings = validSettings(
          command.settings,
          storage.data.settings,
        );
        tabs.persist();
        break;
      case "add-quick-link":
        if (!isWebUrl(command.url) || !command.title.trim())
          throw new Error("Enter a title and a complete HTTP/HTTPS URL.");
        if (storage.data.quickLinks.length >= 12)
          throw new Error("Up to 12 quick links are supported.");
        storage.data.quickLinks = [
          ...storage.data.quickLinks,
          { id: randomUUID(), title: command.title.trim(), url: command.url },
        ];
        break;
      case "remove-quick-link":
        storage.data.quickLinks = storage.data.quickLinks.filter(
          (q) => q.id !== command.id,
        );
        break;
      case "choose-download-directory": {
        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ["openDirectory", "createDirectory"],
        });
        if (!result.canceled && result.filePaths[0])
          storage.data.settings = {
            ...storage.data.settings,
            downloadDirectory: result.filePaths[0],
          };
        break;
      }
      case "download":
        await tabs.downloads.action(command.id, command.action);
        break;
      case "window":
        if (command.action === "minimize") mainWindow.minimize();
        else if (command.action === "maximize") {
          if (mainWindow.isMaximized()) mainWindow.unmaximize();
          else mainWindow.maximize();
        } else mainWindow.close();
        return;
    }
    storage.schedule();
    publish();
  });
}
function createWindow() {
  disposing = false;
  previousState = undefined;
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#061021",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    title: "Untoz Browser",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
    },
  });
  mainWindow = win;
  tabs = new Tabs(win, storage, publish);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
  win.once("ready-to-show", () => win.show());
  win.on("close", (event) => {
    if (disposing) return;
    event.preventDefault();
    disposing = true;
    clearTimeout(publishTimer);
    publishTimer = undefined;
    void tabs
      .dispose()
      .catch(console.error)
      .finally(() => {
        storage.flush();
        win.destroy();
      });
  });
  win.on("closed", () => {
    mainWindow = null;
  });
  tabs.restore();
  void (process.env.VITE_DEV_SERVER_URL
    ? win.loadURL(rendererURL)
    : win.loadFile(rendererFile));
}
if (primaryInstance)
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler(
      (_wc, _permission, callback) => callback(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    storage = new Storage(
      join(app.getPath("userData"), "browser-data.json"),
      publish,
    );
    if (!storage.data.settings.downloadDirectory)
      storage.data.settings.downloadDirectory = app.getPath("downloads");
    registerIPC();
    createWindow();
    app.on("activate", () => {
      if (!mainWindow) createWindow();
    });
  });
else app.quit();
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
