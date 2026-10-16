import type { SearchEngine } from "./search";
export const IPC = {
  command: "browser:command",
  state: "browser:state",
  snapshot: "browser:snapshot",
  focusAddress: "browser:focus-address",
} as const;
export const NEW_TAB = "untoz://newtab";
export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  private: boolean;
  blockedTrackers: number;
  blockedAds: number;
  removedParameters: number;
  protectionEnabled: boolean;
  permissions: string[];
  error?: string;
}
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
  updatedAt: number;
}
export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}
export interface QuickLink {
  id: string;
  title: string;
  url: string;
}
export interface Workspace {
  id: string;
  name: string;
  urls: string[];
}
export interface Settings {
  restoreSession: boolean;
  searchEngine: SearchEngine;
  trackerProtection: boolean;
  adBlocking: boolean;
  removeTrackingParameters: boolean;
  httpsOnly: boolean;
  blockThirdPartyCookies: boolean;
  fingerprintingProtection: boolean;
  siteExceptions: string[];
  theme: "dark" | "light" | "system" | "midnight";
  askDownloadLocation: boolean;
  downloadDirectory: string;
  clearSiteDataOnExit: boolean;
  profileName: string;
}
export const DEFAULT_SETTINGS: Settings = {
  restoreSession: false,
  searchEngine: "duckduckgo",
  trackerProtection: true,
  adBlocking: true,
  removeTrackingParameters: true,
  httpsOnly: true,
  blockThirdPartyCookies: true,
  fingerprintingProtection: true,
  siteExceptions: [],
  theme: "dark",
  askDownloadLocation: true,
  downloadDirectory: "",
  clearSiteDataOnExit: false,
  profileName: "Luis",
};
export interface Download {
  id: string;
  filename: string;
  sourceUrl?: string;
  active: boolean;
  received: number;
  total: number;
  state: "progressing" | "paused" | "completed" | "cancelled" | "failed";
  private: boolean;
}
export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
  settings: Settings;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  quickLinks: QuickLink[];
  workspaces: Workspace[];
  downloads: Download[];
  storageError?: string;
  about?: {
    version: string;
    electron: string;
    chromium: string;
    filtersUpdated: string;
  };
}
export type Command =
  | { type: "new-tab"; url?: string; private?: boolean }
  | { type: "activate-tab" | "close-tab"; id: string }
  | { type: "navigate"; input: string }
  | {
      type:
        | "back"
        | "forward"
        | "reload"
        | "stop"
        | "bookmark"
        | "clear-history"
        | "clear-data"
        | "clear-cookies"
        | "open-licenses"
        | "toggle-site-protection"
        | "revoke-permissions"
        | "choose-download-directory";
    }
  | { type: "remove-bookmark" | "remove-quick-link"; id: string }
  | { type: "remove-history"; url: string }
  | { type: "add-quick-link"; title: string; url: string }
  | { type: "save-workspace"; name: string }
  | { type: "open-workspace" | "remove-workspace"; id: string }
  | { type: "settings"; settings: Partial<Settings> }
  | {
      type: "download";
      id: string;
      action: "cancel" | "open" | "show" | "remove" | "pause" | "resume";
    }
  | {
      type: "viewport";
      bounds: { x: number; y: number; width: number; height: number };
      visible: boolean;
    }
  | { type: "window"; action: "minimize" | "maximize" | "close" };
export interface BrowserAPI {
  command(command: Command): Promise<void>;
  snapshot(): Promise<BrowserState>;
  onState(callback: (state: Partial<BrowserState>) => void): () => void;
  onFocusAddress(callback: () => void): () => void;
}
