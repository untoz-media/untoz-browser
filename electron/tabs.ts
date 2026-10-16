import {
  WebContentsView,
  Menu,
  session,
  type BrowserWindow,
  type Session,
  type WebContents,
  type Input,
} from "electron";
import { randomUUID } from "node:crypto";
import { IPC, NEW_TAB, type Tab } from "../shared/browser";
import { isWebUrl, resolveNavigateInput } from "../shared/navigation";
import { Storage, addHistory, sessionSnapshot } from "./storage";
import { Privacy } from "./privacy";
import { Downloads } from "./downloads";
import { loadFavicon } from "./favicon";

interface RuntimeTab {
  data: Tab;
  view?: WebContentsView;
  faviconRequest?: AbortController;
  faviconSource?: string;
}
export class Tabs {
  readonly entries = new Map<string, RuntimeTab>();
  activeId = "";
  readonly normalSession = session.fromPartition("persist:untoz-browser");
  private privateSession?: Session;
  private privateUsed = false;
  private privateCleaning = false;
  private bounds = { x: 200, y: 96, width: 800, height: 600 };
  private visible = false;
  private fullscreenId?: string;
  private closing = false;
  private clearingData = false;
  readonly privacy: Privacy;
  readonly downloads: Downloads;
  constructor(
    private window: BrowserWindow,
    readonly storage: Storage,
    private changed: () => void,
  ) {
    this.privacy = new Privacy(
      window,
      () => storage.data.settings,
      changed,
      (id, kind, count = 1) => {
        const tab = this.byContents(id);
        if (tab) {
          if (kind === "ads") tab.data.blockedAds += count;
          else if (kind === "trackers") tab.data.blockedTrackers += count;
          else tab.data.removedParameters += count;
          changed();
        }
      },
      (id) => this.entries.get(this.activeId)?.view?.webContents.id === id,
    );
    this.downloads = new Downloads(
      window,
      () => storage.data.settings,
      changed,
    );
    this.configure(this.normalSession, false);
    this.shortcuts(window.webContents);
    window.on("resize", () => this.layout());
  }
  private configure(ses: Session, isPrivate: boolean) {
    this.privacy.configure(ses);
    this.downloads.configure(ses, isPrivate);
  }
  snapshot() {
    return [...this.entries.values()].map((t) => ({
      ...t.data,
      protectionEnabled: this.privacy.siteEnabled(t.data.url, t.data.private),
      permissions: t.view
        ? this.privacy.permissions(t.view.webContents.id)
        : [],
    }));
  }
  restore() {
    const saved = this.storage.data.session;
    const urls = this.storage.data.settings.restoreSession ? saved.urls : [];
    for (const url of urls) this.create(url, false, false);
    if (!this.entries.size) this.create();
    else
      this.activate(
        [...this.entries.keys()][
          Math.min(Math.max(0, saved.activeIndex), this.entries.size - 1)
        ],
      );
  }
  create(input = NEW_TAB, isPrivate = false, activate = true) {
    if (this.closing || this.clearingData) return "";
    if (this.entries.size >= 100)
      throw new Error("Close a tab before opening more.");
    if (isPrivate && this.privateCleaning)
      throw new Error("Private data is being cleared. Try again in a moment.");
    const url = resolveNavigateInput(
      input,
      this.storage.data.settings.searchEngine,
    );
    if (!url) throw new Error("Only HTTP and HTTPS addresses are supported.");
    const id = randomUUID();
    this.entries.set(id, {
      data: {
        id,
        url,
        title: url === NEW_TAB ? "New Tab" : new URL(url).hostname,
        private: isPrivate,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        blockedTrackers: 0,
        blockedAds: 0,
        removedParameters: 0,
        protectionEnabled: true,
        permissions: [],
      },
    });
    if (activate) this.activate(id);
    this.persist();
    this.changed();
    return id;
  }
  activate(id: string) {
    const tab = this.entries.get(id);
    if (!tab) return;
    if (this.fullscreenId && this.fullscreenId !== id) {
      this.fullscreenId = undefined;
      this.window.setFullScreen(false);
    }
    this.activeId = id;
    if (tab.data.url !== NEW_TAB && !tab.view) {
      this.ensureView(tab);
      this.load(tab, tab.data.url);
    }
    // Tab selection is interactive: do not wait for the loading/progress IPC batch.
    this.window.webContents.send(IPC.state, {
      tabs: this.snapshot(),
      activeTabId: id,
    });
    if (tab.data.url === NEW_TAB) {
      this.window.webContents.focus();
      this.window.webContents.send(IPC.focusAddress);
    }
    this.layout();
    this.persist();
    this.changed();
  }
  private ensureView(tab: RuntimeTab) {
    if (tab.view) return tab.view;
    if (tab.data.private && !this.privateSession) {
      this.privateSession = session.fromPartition("untoz-private", {
        cache: false,
      });
      this.configure(this.privateSession, true);
    }
    if (tab.data.private) this.privateUsed = true;
    const view = new WebContentsView({
      webPreferences: {
        session: tab.data.private ? this.privateSession : this.normalSession,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        backgroundThrottling: true,
        navigateOnDragDrop: false,
        spellcheck: false,
        autoplayPolicy: "document-user-activation-required",
      },
    });
    tab.view = view;
    this.window.contentView.addChildView(view);
    view.setVisible(false);
    const wc = view.webContents;
    this.shortcuts(wc);
    wc.on("context-menu", (_event, params) => {
      const template: Electron.MenuItemConstructorOptions[] = [];
      if (
        params.mediaType === "video" &&
        params.mediaFlags.canShowPictureInPicture
      ) {
        template.push({
          label: "Picture in Picture",
          click: () => {
            // Only a fixed, browser-owned expression; no website text is interpolated.
            void wc
              .executeJavaScript(
                `(() => { const el = document.elementFromPoint(${Math.round(params.x)}, ${Math.round(params.y)}); const video = el instanceof HTMLVideoElement ? el : el?.closest('video'); if (!video) return; return document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture(); })()`,
                true,
              )
              .catch(() => {});
          },
        });
      }
      if (params.isEditable)
        template.push(
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        );
      else if (params.selectionText) template.push({ role: "copy" });
      if (template.length)
        Menu.buildFromTemplate(template).popup({ window: this.window });
    });
    wc.on("enter-html-full-screen", () => {
      this.fullscreenId = tab.data.id;
      this.layout();
    });
    wc.on("leave-html-full-screen", () => {
      this.fullscreenId = undefined;
      this.layout();
    });

    const sync = () => {
      if (wc.isDestroyed() || !this.entries.has(tab.data.id)) return;
      tab.data.canGoBack = wc.navigationHistory.canGoBack();
      tab.data.canGoForward = wc.navigationHistory.canGoForward();
      this.changed();
    };
    const guard = (event: Electron.Event, url: string) => {
      if (!isWebUrl(url)) event.preventDefault();
    };
    wc.on("will-navigate", guard);
    wc.on("will-redirect", guard);
    wc.on("will-frame-navigate", (event) => {
      if (
        !isWebUrl(event.url) &&
        event.url !== "about:blank" &&
        !event.url.startsWith("blob:")
      )
        event.preventDefault();
    });
    wc.setWindowOpenHandler(({ url }) => {
      if (isWebUrl(url) && this.entries.size < 100)
        this.create(url, tab.data.private);
      return { action: "deny" };
    });
    wc.on("did-start-navigation", (_event, url, inPlace, mainFrame) => {
      if (!mainFrame || inPlace) return;
      tab.data.error = undefined;
      const sameOrigin =
        isWebUrl(wc.getURL()) &&
        isWebUrl(url) &&
        new URL(wc.getURL()).origin === new URL(url).origin;
      // Chromium may reuse a cached icon without re-emitting page-favicon-updated on back/forward.
      if (!sameOrigin) tab.data.favicon = undefined;
      tab.data.blockedTrackers = 0;
      tab.data.blockedAds = 0;
      tab.data.removedParameters = 0;
      tab.faviconRequest?.abort();
      if (!tab.data.favicon) tab.faviconSource = undefined;
      this.privacy.revoke(wc.id);
      this.layout();
    });
    wc.on("did-start-loading", () => {
      tab.data.isLoading = true;
      sync();
    });
    wc.on("did-stop-loading", () => {
      tab.data.isLoading = false;
      sync();
    });
    const navigate = (url: string) => {
      if (!isWebUrl(url)) return;
      tab.data.url = url;
      tab.data.error = undefined;
      this.persist();
      sync();
    };
    wc.on("did-navigate", (_event, url) => navigate(url));
    wc.on("did-navigate-in-page", (_event, url, main) => {
      if (main) {
        navigate(url);
        this.recordHistory(tab);
      }
    });
    wc.on("page-title-updated", (_event, title) => {
      tab.data.title = title.slice(0, 300);
      this.changed();
    });
    wc.on("page-favicon-updated", (_event, icons) => {
      const url = icons.find(isWebUrl);
      if (!url || url === tab.faviconSource) return;
      tab.faviconSource = url;
      tab.faviconRequest?.abort();
      const request = new AbortController();
      tab.faviconRequest = request;
      const timeout = setTimeout(() => request.abort(), 5000);
      void loadFavicon(wc.session, url, request.signal)
        .then((icon) => {
          if (!request.signal.aborted && this.entries.has(tab.data.id)) {
            tab.data.favicon = icon;
            if (
              icon &&
              !tab.data.private &&
              this.storage.data.bookmarks.some(
                (b) => b.url === tab.data.url && b.favicon !== icon,
              )
            ) {
              this.storage.data.bookmarks = this.storage.data.bookmarks.map(
                (b) =>
                  b.url === tab.data.url
                    ? { ...b, favicon: icon, updatedAt: Date.now() }
                    : b,
              );
              this.storage.schedule();
            }
            this.changed();
          }
        })
        .catch(() => {})
        .finally(() => clearTimeout(timeout));
    });
    wc.on("did-finish-load", () => {
      this.recordHistory(tab);
      sync();
    });
    wc.on("did-fail-load", (_event, code, description, url, main) => {
      if (!main || code === -3) return;
      if (isWebUrl(url)) {
        tab.data.url = url;
        tab.data.title = new URL(url).hostname;
      }
      tab.data.error =
        code <= -200 && code >= -299
          ? "The site’s security certificate could not be verified. Connection blocked."
          : `This page could not be loaded (${description}). Check the address and your connection.`;
      tab.data.isLoading = false;
      this.layout();
      sync();
    });
    wc.on("render-process-gone", (_event, details) => {
      tab.data.error = `This tab stopped unexpectedly (${details.reason}). Reload to try again.`;
      tab.data.isLoading = false;
      this.layout();
      this.changed();
    });
    return view;
  }
  private recordHistory(tab: RuntimeTab) {
    if (tab.data.private || tab.data.error || !isWebUrl(tab.data.url)) return;
    this.storage.data.history = addHistory(this.storage.data.history, {
      url: tab.data.url,
      title: tab.data.title,
      timestamp: Date.now(),
    });
    this.storage.schedule();
    this.changed();
  }
  private load(tab: RuntimeTab, url: string) {
    tab.data.url = url;
    tab.data.error = undefined;
    const view = this.ensureView(tab);
    void view.webContents.loadURL(tab.data.url).catch(() => {
      /* did-fail-load provides the user-facing error. */
    });
    this.layout();
    this.persist();
    this.changed();
  }
  navigate(input: string) {
    const url = resolveNavigateInput(
      input,
      this.storage.data.settings.searchEngine,
    );
    if (!url)
      throw new Error(
        "Enter an HTTP/HTTPS address or a search. File and script URLs are blocked.",
      );
    const tab = this.entries.get(this.activeId);
    if (!tab) return;
    if (url === NEW_TAB) {
      this.releaseView(tab);
      tab.data = {
        ...tab.data,
        url,
        title: "New Tab",
        favicon: undefined,
        error: undefined,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        blockedTrackers: 0,
        blockedAds: 0,
        removedParameters: 0,
        protectionEnabled: true,
      };
      this.persist();
      this.changed();
    } else this.load(tab, url);
  }
  command(type: "back" | "forward" | "reload" | "stop") {
    const tab = this.entries.get(this.activeId);
    const wc = tab?.view?.webContents;
    if (!wc || !tab) return;
    if (type === "back" && wc.navigationHistory.canGoBack())
      wc.navigationHistory.goBack();
    if (type === "forward" && wc.navigationHistory.canGoForward())
      wc.navigationHistory.goForward();
    if (type === "reload") {
      tab.data.error = undefined;
      this.load(tab, tab.data.url);
    }
    if (type === "stop") wc.stop();
  }
  private releaseView(tab: RuntimeTab) {
    tab.faviconRequest?.abort();
    tab.faviconSource = undefined;
    if (!tab.view) return;
    const wc = tab.view.webContents;
    if (this.fullscreenId === tab.data.id) {
      this.fullscreenId = undefined;
      this.window.setFullScreen(false);
    }
    this.privacy.revoke(wc.id);
    if (this.window.contentView.children.includes(tab.view))
      this.window.contentView.removeChildView(tab.view);
    if (!wc.isDestroyed()) wc.close({ waitForBeforeUnload: false });
    tab.view = undefined;
  }
  async close(id: string) {
    const ids = [...this.entries.keys()];
    const index = ids.indexOf(id);
    const tab = this.entries.get(id);
    if (!tab) return;
    this.releaseView(tab);
    this.entries.delete(id);
    if (id === this.activeId) {
      const next = ids[index + 1] ?? ids[index - 1];
      if (next) this.activate(next);
      else if (!this.closing) this.create();
    }
    if (![...this.entries.values()].some((t) => t.data.private))
      await this.clearPrivate();
    this.persist();
    this.changed();
  }
  private async clearPrivate() {
    const ses = this.privateSession;
    this.downloads.clearPrivate();
    this.privacy.clearPrivateExceptions();
    if (!ses || !this.privateUsed) return;
    this.privateCleaning = true;
    try {
      await ses.closeAllConnections();
      await ses.clearStorageData();
      await ses.clearCache();
      await ses.clearAuthCache();
      this.privateUsed = false;
      this.privateCleaning = false;
    } catch {
      // Fail closed: do not reuse this partition if any private-data cleanup failed.
      throw new Error(
        "Private data could not be cleared. Restart Untoz before opening another private tab.",
      );
    }
  }
  viewport(bounds: typeof this.bounds, visible: boolean) {
    this.bounds = bounds;
    this.visible = visible;
    this.layout();
  }
  private layout() {
    if (this.window.isDestroyed()) return;
    const [width, height] = this.window.getContentSize();
    const x = Math.max(0, Math.min(width, Math.round(this.bounds.x)));
    const y = Math.max(0, Math.min(height, Math.round(this.bounds.y)));
    for (const tab of this.entries.values())
      if (tab.view) {
        const show =
          this.visible && tab.data.id === this.activeId && !tab.data.error;
        tab.view.setVisible(show);
        if (show)
          tab.view.setBounds(
            this.fullscreenId === tab.data.id
              ? { x: 0, y: 0, width, height }
              : {
                  x,
                  y,
                  width: Math.max(
                    0,
                    Math.min(width - x, Math.round(this.bounds.width)),
                  ),
                  height: Math.max(
                    0,
                    Math.min(height - y, Math.round(this.bounds.height)),
                  ),
                },
          );
      }
  }
  persist() {
    this.storage.data.session = this.storage.data.settings.restoreSession
      ? sessionSnapshot(this.snapshot(), this.activeId)
      : { urls: [], activeIndex: 0 };
    this.storage.schedule();
  }
  byContents(id: number) {
    return [...this.entries.values()].find(
      (t) => t.view?.webContents.id === id,
    );
  }
  async clearData(cookiesOnly = false) {
    if (this.clearingData) return;
    this.clearingData = true;
    // Close every page before clearing so live pages cannot immediately recreate cookies/storage.
    const oldPrivate = this.privateSession;
    for (const tab of this.entries.values()) this.releaseView(tab);
    this.entries.clear();
    this.downloads.cancelAll();
    this.privacy.revoke();
    try {
      await Promise.all(
        [this.normalSession, ...(oldPrivate ? [oldPrivate] : [])].map(
          async (ses) => {
            await ses.closeAllConnections();
            await ses.clearStorageData(
              cookiesOnly ? { storages: ["cookies"] } : undefined,
            );
            if (!cookiesOnly) {
              await ses.clearCache();
              await ses.clearAuthCache();
            }
          },
        ),
      );
    } finally {
      this.clearingData = false;
      if (!this.entries.size) this.create();
    }
    this.privateUsed = false;
    if (!cookiesOnly) this.storage.data.history = [];
    this.downloads.clearPrivate();
  }
  async dispose() {
    this.closing = true;
    this.persist();
    this.storage.flush();
    this.downloads.dispose();
    for (const tab of this.entries.values()) this.releaseView(tab);
    this.entries.clear();
    this.privacy.dispose();
    await this.clearPrivate();
    if (this.storage.data.settings.clearSiteDataOnExit) {
      await this.normalSession.clearStorageData();
      await this.normalSession.clearCache();
    }
  }
  private shortcuts(wc: WebContents) {
    wc.on("before-input-event", (event, input: Input) => {
      if (input.type !== "keyDown") return;
      const key = input.key.toLowerCase();
      const ctrl = input.control || input.meta;
      let handled = true;
      if (ctrl && key === "t") {
        if (this.entries.size < 100 && !this.privateCleaning)
          this.create(
            NEW_TAB,
            this.entries.get(this.activeId)?.data.private ?? false,
          );
      } else if (ctrl && key === "w")
        void this.close(this.activeId).catch(console.error);
      else if (ctrl && key === "l") {
        this.window.webContents.focus();
        this.window.webContents.send(IPC.focusAddress);
      } else if (ctrl && key === "tab") {
        const ids = [...this.entries.keys()];
        const i = ids.indexOf(this.activeId);
        this.activate(
          ids[(i + (input.shift ? -1 : 1) + ids.length) % ids.length],
        );
      } else if (ctrl && key === "r") this.command("reload");
      else if (input.alt && key === "arrowleft") this.command("back");
      else if (input.alt && key === "arrowright") this.command("forward");
      else handled = false;
      if (handled) event.preventDefault();
    });
  }
}
