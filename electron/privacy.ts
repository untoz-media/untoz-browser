import {
  app,
  dialog,
  type BrowserWindow,
  type Session,
  type WebContents,
} from "electron";
import { isWebUrl, stripTrackingParameters } from "../shared/navigation";
import { isThirdPartyRequest, upgradeToHttps } from "../shared/protection";
import { join } from "node:path";
import { NetworkFilters } from "./filters";
import type { Settings } from "../shared/browser";

let filters: NetworkFilters;
export class Privacy {
  readonly filters = (filters ??= new NetworkFilters(
    join(app.getAppPath(), "resources/filters"),
  ));
  private privateExceptions = new Set<string>();
  siteEnabled(url: string, isPrivate = false) {
    if (!isWebUrl(url)) return true;
    const host = new URL(url).hostname;
    return !(isPrivate
      ? this.privateExceptions.has(host)
      : this.settings().siteExceptions.includes(host));
  }
  togglePrivateSite(url: string) {
    const host = new URL(url).hostname;
    if (this.privateExceptions.has(host)) this.privateExceptions.delete(host);
    else this.privateExceptions.add(host);
  }
  clearPrivateExceptions() {
    this.privateExceptions.clear();
  }

  private grants = new Map<number, Set<string>>();
  private pending = new Set<number>();
  private revisions = new Map<number, number>();
  private sessions = new Set<Session>();
  constructor(
    private window: BrowserWindow,
    private settings: () => Settings,
    private changed: () => void,
    private blocked: (
      id: number,
      kind: "ads" | "trackers" | "parameters",
      count?: number,
    ) => void,
    private active: (id: number) => boolean,
  ) {}
  permissions(id: number): string[] {
    return [...(this.grants.get(id) ?? [])];
  }
  revoke(id?: number) {
    if (id === undefined) {
      this.grants.clear();
      for (const key of this.pending)
        this.revisions.set(key, (this.revisions.get(key) ?? 0) + 1);
    } else {
      this.grants.delete(id);
      if (this.pending.has(id))
        this.revisions.set(id, (this.revisions.get(id) ?? 0) + 1);
    }
    this.changed();
  }
  configure(ses: Session) {
    this.sessions.add(ses);
    ses.setPermissionCheckHandler((wc, permission, origin, details) => {
      // Media checks are intentionally denied: camera/microphone must go through the explicit request flow.
      return (
        !!wc &&
        permission !== "media" &&
        details.isMainFrame &&
        origin === this.origin(wc) &&
        !!this.grants.get(wc.id)?.has(permission)
      );
    });
    ses.setDevicePermissionHandler(() => false);
    ses.setPermissionRequestHandler(
      async (wc, permission, callback, details) => {
        const origin = this.origin(wc);
        if (
          !origin ||
          !details.isMainFrame ||
          !this.active(wc.id) ||
          this.pending.has(wc.id) ||
          ![
            "media",
            "geolocation",
            "notifications",
            "clipboard-sanitized-write",
            "fullscreen",
          ].includes(permission)
        )
          return callback(false);
        const requestOrigin = (() => {
          try {
            return new URL(details.requestingUrl).origin;
          } catch {
            return "";
          }
        })();
        if (requestOrigin !== origin) return callback(false);
        this.pending.add(wc.id);
        const revision = this.revisions.get(wc.id) ?? 0;
        try {
          const name =
            permission === "media"
              ? `camera / microphone (${"mediaTypes" in details ? details.mediaTypes?.join(", ") || "media" : "media"})`
              : permission;
          const answer = await dialog.showMessageBox(this.window, {
            type: "question",
            title: "Website permission",
            message: `${origin} wants access to ${name}.`,
            detail:
              "Allow only if you trust this site. Access lasts until this tab navigates or closes.",
            buttons: ["Deny", "Allow for this page"],
            defaultId: 0,
            cancelId: 0,
            noLink: true,
          });
          const allow =
            answer.response === 1 &&
            !wc.isDestroyed() &&
            this.origin(wc) === origin &&
            this.active(wc.id) &&
            revision === (this.revisions.get(wc.id) ?? 0);
          if (allow) {
            const grants = this.grants.get(wc.id) ?? new Set<string>();
            grants.add(permission);
            this.grants.set(wc.id, grants);
            this.changed();
          }
          callback(allow);
        } catch {
          callback(false);
        } finally {
          this.pending.delete(wc.id);
          this.revisions.delete(wc.id);
        }
      },
    );
    ses.webRequest.onBeforeRequest(
      { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
      (details, callback) => {
        try {
          const settings = this.settings();
          const wc = details.webContents;
          const topUrl =
            details.resourceType === "mainFrame"
              ? details.url
              : wc?.getURL() || details.referrer;
          if (
            settings.httpsOnly &&
            details.resourceType === "mainFrame" &&
            details.method === "GET"
          ) {
            const upgraded = upgradeToHttps(details.url);
            if (upgraded) return callback({ redirectURL: upgraded });
          }
          if (
            settings.fingerprintingProtection &&
            details.resourceType === "ping"
          )
            return callback({ cancel: true });
          const isPrivate = !ses.isPersistent();
          if (!this.siteEnabled(topUrl, isPrivate)) return callback({});
          if (details.resourceType !== "mainFrame") {
            const kind = this.filters.match(
              details.url,
              details.frame?.url || topUrl || details.url,
              details.resourceType,
              settings.adBlocking,
              settings.trackerProtection,
            );
            if (kind) {
              if (details.webContentsId !== undefined)
                this.blocked(details.webContentsId, kind);
              return callback({ cancel: true });
            }
          }
          if (
            settings.removeTrackingParameters &&
            details.resourceType === "mainFrame" &&
            details.method === "GET"
          ) {
            const clean = stripTrackingParameters(details.url);
            if (clean !== details.url) {
              const count =
                [...new URL(details.url).searchParams].length -
                [...new URL(clean).searchParams].length;
              if (details.webContentsId !== undefined)
                this.blocked(details.webContentsId, "parameters", count);
              return callback({ redirectURL: clean });
            }
          }
          callback({});
        } catch {
          // A matcher failure must not leave the request hanging.
          callback({});
        }
      },
    );
    ses.webRequest.onBeforeSendHeaders(
      { urls: ["http://*/*", "https://*/*"] },
      (details, callback) => {
        try {
          const settings = this.settings();
          const topUrl = details.webContents?.getURL() || details.referrer;
          const thirdParty = isThirdPartyRequest(details.url, topUrl);
          const requestHeaders = { ...details.requestHeaders };
          let changed = false;
          if (settings.blockThirdPartyCookies && thirdParty) {
            for (const key of Object.keys(requestHeaders))
              if (key.toLowerCase() === "cookie") {
                delete requestHeaders[key];
                changed = true;
              }
          }
          if (settings.fingerprintingProtection && thirdParty) {
            for (const key of Object.keys(requestHeaders))
              if (key.toLowerCase() === "referer") {
                try {
                  requestHeaders[key] =
                    new URL(requestHeaders[key]).origin + "/";
                  changed = true;
                } catch {
                  delete requestHeaders[key];
                  changed = true;
                }
              }
          }
          callback(changed ? { requestHeaders } : {});
        } catch {
          callback({});
        }
      },
    );
    ses.webRequest.onHeadersReceived(
      { urls: ["http://*/*", "https://*/*"] },
      (details, callback) => {
        try {
          const settings = this.settings();
          const topUrl = details.webContents?.getURL() || details.referrer;
          if (
            !settings.blockThirdPartyCookies ||
            !isThirdPartyRequest(details.url, topUrl) ||
            !details.responseHeaders
          )
            return callback({});
          const responseHeaders = { ...details.responseHeaders };
          let changed = false;
          for (const key of Object.keys(responseHeaders))
            if (key.toLowerCase() === "set-cookie") {
              delete responseHeaders[key];
              changed = true;
            }
          callback(changed ? { responseHeaders } : {});
        } catch {
          callback({});
        }
      },
    );
  }
  private origin(wc: WebContents) {
    try {
      return !wc.isDestroyed() && isWebUrl(wc.getURL())
        ? new URL(wc.getURL()).origin
        : "";
    } catch {
      return "";
    }
  }
  dispose() {
    this.revoke();
    for (const ses of this.sessions) {
      ses.setPermissionCheckHandler(() => false);
      ses.setPermissionRequestHandler((_wc, _permission, callback) =>
        callback(false),
      );
      ses.setDevicePermissionHandler(() => false);
      ses.webRequest.onBeforeRequest(null);
      ses.webRequest.onBeforeSendHeaders(null);
      ses.webRequest.onHeadersReceived(null);
    }
    this.sessions.clear();
  }
}
