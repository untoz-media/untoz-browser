import { readFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import {
  DEFAULT_SETTINGS,
  NEW_TAB,
  type Bookmark,
  type HistoryEntry,
  type QuickLink,
  type Settings,
  type Tab,
  type Workspace,
} from "../shared/browser";
import { PRODUCT_LINKS } from "../shared/links";
import { isWebUrl, isInlineFavicon } from "../shared/navigation";
import { SEARCH_ENGINES } from "../shared/search";

export interface SavedData {
  version: 1;
  settings: Settings;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  quickLinks: QuickLink[];
  workspaces: Workspace[];
  session: { urls: string[]; activeIndex: number };
}
export function sessionSnapshot(
  tabs: Tab[],
  activeId: string,
): SavedData["session"] {
  const normal = tabs.filter((t) => !t.private);
  return {
    urls: normal.map((t) => t.url),
    activeIndex: Math.max(
      0,
      normal.findIndex((t) => t.id === activeId),
    ),
  };
}
export function addHistory(
  history: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [entry, ...history.filter((h) => h.url !== entry.url)].slice(0, 3000);
}
/** Only an absolute folder from this profile is accepted. Relative paths are ignored. */
export function acceptedDownloadDirectory(value: unknown): string {
  return typeof value === "string" && value.length <= 4096 && isAbsolute(value)
    ? value
    : "";
}
export function validSettings(
  input: Partial<Settings>,
  current: Settings,
): Settings {
  const result = { ...current };
  for (const key of [
    "restoreSession",
    "trackerProtection",
    "adBlocking",
    "removeTrackingParameters",
    "askDownloadLocation",
    "clearSiteDataOnExit",
    "httpsOnly",
    "blockThirdPartyCookies",
    "fingerprintingProtection",
  ] as const)
    if (typeof input[key] === "boolean") result[key] = input[key];
  if (["dark", "light", "system", "midnight"].includes(input.theme ?? ""))
    result.theme = input.theme!;
  if (
    typeof input.searchEngine === "string" &&
    Object.prototype.hasOwnProperty.call(SEARCH_ENGINES, input.searchEngine)
  )
    result.searchEngine = input.searchEngine!;
  if (Array.isArray(input.siteExceptions))
    result.siteExceptions = [
      ...new Set(
        input.siteExceptions.filter(
          (host) =>
            typeof host === "string" &&
            /^[a-z0-9.:[\]-]+$/i.test(host) &&
            host.length <= 253,
        ),
      ),
    ].slice(0, 1000);
  if (typeof input.profileName === "string") {
    const name = input.profileName.trim().slice(0, 40);
    if (name) result.profileName = name;
  }
  return result;
}
export class Storage {
  data: SavedData = {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    bookmarks: [],
    history: [],
    quickLinks: PRODUCT_LINKS.map((link) => ({ ...link })),
    workspaces: [],
    session: { urls: [], activeIndex: 0 },
  };
  error?: string;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(
    private path: string,
    private onError: () => void = () => {},
  ) {
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as SavedData;
      if (raw.version !== 1) throw new Error("Unsupported storage version");
      this.data.settings = validSettings(
        raw.settings ?? {},
        this.data.settings,
      );
      this.data.settings.downloadDirectory = acceptedDownloadDirectory(
        raw.settings?.downloadDirectory,
      );
      this.data.bookmarks = (Array.isArray(raw.bookmarks) ? raw.bookmarks : [])
        .filter(
          (b) =>
            b &&
            typeof b.id === "string" &&
            typeof b.title === "string" &&
            isWebUrl(b.url),
        )
        .slice(0, 5000)
        .map((b) => ({
          id: b.id,
          title: b.title,
          url: b.url,
          createdAt: Number.isFinite(b.createdAt) ? b.createdAt : 0,
          updatedAt: Number.isFinite(b.updatedAt) ? b.updatedAt : 0,
          favicon: isInlineFavicon(b.favicon) ? b.favicon : undefined,
        }));
      this.data.history = (Array.isArray(raw.history) ? raw.history : [])
        .filter(
          (h) =>
            h &&
            isWebUrl(h.url) &&
            typeof h.title === "string" &&
            Number.isFinite(h.timestamp),
        )
        .slice(0, 3000);
      this.data.quickLinks = (
        Array.isArray(raw.quickLinks) ? raw.quickLinks : this.data.quickLinks
      )
        .filter(
          (q) =>
            q &&
            typeof q.id === "string" &&
            typeof q.title === "string" &&
            isWebUrl(q.url),
        )
        .slice(0, 12);
      this.data.workspaces = (
        Array.isArray(raw.workspaces) ? raw.workspaces : []
      )
        .filter(
          (workspace) =>
            workspace &&
            typeof workspace.id === "string" &&
            typeof workspace.name === "string" &&
            Array.isArray(workspace.urls),
        )
        .slice(0, 20)
        .map((workspace) => ({
          id: workspace.id,
          name: workspace.name.slice(0, 40),
          urls: workspace.urls.filter((url) => isWebUrl(url)).slice(0, 30),
        }))
        .filter((workspace) => workspace.name && workspace.urls.length);
      this.data.session = {
        urls: (Array.isArray(raw.session?.urls) ? raw.session.urls : [])
          .filter((u) => u === NEW_TAB || isWebUrl(u))
          .slice(0, 100),
        activeIndex: Number.isInteger(raw.session?.activeIndex)
          ? raw.session.activeIndex
          : 0,
      };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT")
        this.error =
          "Saved browser data could not be read. The original file will be preserved until restart.";
    }
  }
  schedule() {
    if (!this.timer) this.timer = setTimeout(() => this.flush(), 400);
  }
  flush() {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.error) return;
    try {
      mkdirSync(dirname(this.path), { recursive: true });
      writeFileSync(this.path + ".tmp", JSON.stringify(this.data), "utf8");
      renameSync(this.path + ".tmp", this.path);
    } catch {
      this.error =
        "Browser data could not be saved. Check available disk space and folder permissions.";
      this.onError();
    }
  }
}
