import { X } from "lucide-react";
import { useState } from "react";
import { SEARCH_ENGINES } from "../../shared/search";
import { send, useTabsStore, type Panel } from "@/store/useTabsStore";
import type { Settings } from "../../shared/browser";
const PANEL_TITLES: Record<Exclude<Panel, null>, string> = {
  bookmarks: "Favorites",
  history: "History",
  downloads: "Downloads",
  settings: "Settings",
  privacy: "Site privacy",
  about: "About",
};
function formatBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0 B";
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function Panels() {
  const state = useTabsStore();
  const [historyLimit, setHistoryLimit] = useState(300);
  const [bookmarkQuery, setBookmarkQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const tab = state.tabs.find((t) => t.id === state.activeTabId);
  const bookmarkNeedle = bookmarkQuery.trim().toLowerCase();
  const historyNeedle = historyQuery.trim().toLowerCase();
  const bookmarks = state.bookmarks.filter(
    (b) =>
      !bookmarkNeedle ||
      b.title.toLowerCase().includes(bookmarkNeedle) ||
      b.url.toLowerCase().includes(bookmarkNeedle),
  );
  const history = state.history.filter(
    (h) =>
      !historyNeedle ||
      h.title.toLowerCase().includes(historyNeedle) ||
      h.url.toLowerCase().includes(historyNeedle),
  );
  const set = (settings: Partial<Settings>) =>
    void send({ type: "settings", settings });
  const open = (url: string) => {
    state.setPanel(null);
    void send({ type: "new-tab", url, private: tab?.private });
  };
  return (
    <section className="panel">
      <header>
        <div>
          <div className="eyebrow">UNTOZ BROWSER</div>
          <h1>{state.panel ? PANEL_TITLES[state.panel] : ""}</h1>
        </div>
        <button aria-label="Close panel" onClick={() => state.setPanel(null)}>
          <X size={21} />
        </button>
      </header>
      {state.panel === "bookmarks" && (
        <>
          <p className="muted">
            Saved on this device. Use the star in the address bar to save a
            page.
          </p>
          {state.bookmarks.length > 0 && (
            <input
              className="panel-search"
              aria-label="Search favorites"
              placeholder="Search favorites"
              value={bookmarkQuery}
              onChange={(e) => setBookmarkQuery(e.target.value)}
            />
          )}
          {!state.bookmarks.length && (
            <p className="empty-state">
              Your favorite places will appear here.
            </p>
          )}
          {state.bookmarks.length > 0 && !bookmarks.length && (
            <p className="empty-state">No favorites match that search.</p>
          )}
          {bookmarks.map((b) => (
            <div className="list-row" key={b.id}>
              {b.favicon && (
                <img src={b.favicon} width={16} height={16} alt="" />
              )}
              <button className="list-main" onClick={() => open(b.url)}>
                <strong>{b.title}</strong>
                <span>{b.url}</span>
              </button>
              <button
                aria-label={`Remove ${b.title}`}
                onClick={() => void send({ type: "remove-bookmark", id: b.id })}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </>
      )}
      {state.panel === "history" && (
        <>
          <div className="panel-tools">
            <p className="muted">
              Recent pages, stored locally. Private tabs are never recorded.
            </p>
            <button
              className="action"
              disabled={!state.history.length}
              onClick={() => void send({ type: "clear-history" })}
            >
              Clear history
            </button>
          </div>
          {state.history.length > 0 && (
            <input
              className="panel-search"
              aria-label="Search history"
              placeholder="Search history"
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
            />
          )}
          {!state.history.length && (
            <p className="empty-state">No browsing history.</p>
          )}
          {state.history.length > 0 && !history.length && (
            <p className="empty-state">No history matches that search.</p>
          )}
          {history.slice(0, historyLimit).map((h) => (
            <div className="list-row" key={h.url}>
              <button className="list-main" onClick={() => open(h.url)}>
                <strong>{h.title}</strong>
                <span>{h.url}</span>
              </button>
              <time>{new Date(h.timestamp).toLocaleString()}</time>
              <button
                aria-label={`Delete history item ${h.title}`}
                onClick={() =>
                  void send({ type: "remove-history", url: h.url })
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {history.length > historyLimit && (
            <button
              className="action"
              onClick={() => setHistoryLimit((limit) => limit + 300)}
            >
              Show older history
            </button>
          )}
        </>
      )}
      {state.panel === "downloads" && (
        <>
          <p className="muted">
            Downloads from this browser session. Pause and resume last until
            Untoz closes. Saved files remain on your device.
          </p>
          {!state.downloads.length && (
            <p className="empty-state">No downloads yet.</p>
          )}
          {state.downloads.map((d) => (
            <div className="download-row" key={d.id}>
              <strong>
                {d.filename}
                {d.private ? " · Private" : ""}
              </strong>
              {d.sourceUrl && (
                <span className="download-source">{d.sourceUrl}</span>
              )}
              <span>
                {d.state} · {formatBytes(d.received)}
                {d.total > 0 ? ` / ${formatBytes(d.total)}` : ""}
              </span>
              <progress
                value={
                  d.total
                    ? d.received
                    : d.active
                      ? undefined
                      : d.state === "completed"
                        ? 1
                        : 0
                }
                max={d.total || 1}
              />
              <div>
                {d.active && d.state !== "paused" && (
                  <button
                    className="action"
                    onClick={() =>
                      void send({
                        type: "download",
                        id: d.id,
                        action: "pause",
                      })
                    }
                  >
                    Pause
                  </button>
                )}
                {d.state === "paused" && (
                  <button
                    className="action"
                    onClick={() =>
                      void send({
                        type: "download",
                        id: d.id,
                        action: "resume",
                      })
                    }
                  >
                    Resume
                  </button>
                )}
                {d.active && (
                  <button
                    className="action"
                    onClick={() =>
                      void send({
                        type: "download",
                        id: d.id,
                        action: "cancel",
                      })
                    }
                  >
                    Cancel
                  </button>
                )}
                {d.state === "completed" && (
                  <>
                    <button
                      className="action"
                      onClick={() =>
                        void send({
                          type: "download",
                          id: d.id,
                          action: "open",
                        })
                      }
                    >
                      Open
                    </button>
                    <button
                      className="action"
                      onClick={() =>
                        void send({
                          type: "download",
                          id: d.id,
                          action: "show",
                        })
                      }
                    >
                      Show in folder
                    </button>
                  </>
                )}
                {!d.active && (
                  <button
                    className="action"
                    onClick={() =>
                      void send({
                        type: "download",
                        id: d.id,
                        action: "remove",
                      })
                    }
                  >
                    Remove from list
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
      {state.panel === "privacy" && (
        <>
          <div className="privacy-card">
            <h2>
              {tab?.protectionEnabled &&
              (state.settings.adBlocking ||
                state.settings.trackerProtection ||
                state.settings.removeTrackingParameters)
                ? "Privacy protections are on"
                : "Privacy protections are off"}
            </h2>
            <p>
              {tab?.blockedAds || 0} ads blocked · {tab?.blockedTrackers || 0}{" "}
              trackers blocked
            </p>
            <p>{tab?.removedParameters || 0} tracking parameters removed</p>
            <p className="muted">
              Actual requests blocked on this page using EasyList and
              EasyPrivacy. Network filtering only; some ads and trackers may
              remain.
            </p>
            {tab?.url.startsWith("http") && (
              <Toggle
                label={`Protection for ${new URL(tab.url).hostname}`}
                checked={tab.protectionEnabled}
                onChange={() => void send({ type: "toggle-site-protection" })}
              />
            )}
            <p className="muted">
              Changes apply to future requests. Reload to apply to this page.
              Private site exceptions are cleared when the last private tab
              closes.
            </p>
          </div>
          <h2>Permissions for this page</h2>
          <p>{tab?.permissions.join(", ") || "No permissions granted."}</p>
          <button
            className="action"
            onClick={() => void send({ type: "revoke-permissions" })}
          >
            Revoke all permission grants
          </button>
          <p className="muted">
            Reload open pages to stop already-running media or location access.
          </p>
          <p className="muted">
            {tab?.private
              ? "This tab uses an isolated, in-memory private session."
              : "This is a normal browsing tab."}
          </p>
        </>
      )}
      {state.panel === "about" && (
        <div className="settings-content">
          <h2>Untoz Browser</h2>
          <p className="eyebrow">Alpha 0.1</p>
          <p>A lightweight browser built around privacy by default.</p>
          <dl className="version-list">
            <dt>Untoz Browser version</dt>
            <dd>{state.about?.version}</dd>
            <dt>Chromium</dt>
            <dd>{state.about?.chromium}</dd>
            <dt>Electron</dt>
            <dd>{state.about?.electron}</dd>
            <dt>Filter lists bundled</dt>
            <dd>{state.about?.filtersUpdated?.slice(0, 10)}</dd>
          </dl>
          <button className="action" onClick={() => open("https://untoz.site")}>
            Untoz website
          </button>
          <h2>Privacy information</h2>
          <p>
            Browsing data stays in this profile. Private tabs use memory-only
            sessions and are never restored. Bookmarks you explicitly save and
            files you download remain on your device.
          </p>
          <p>
            Ad and tracker protection is free. Filter lists are bundled; opening
            this page sends no network requests. No analytics, account, or
            automatic filter polling.
          </p>
          <h2>Open-source licenses</h2>
          <p>
            Untoz Browser: MIT. Electron and React: MIT. Ghostery filter engine:
            MPL-2.0. EasyList and EasyPrivacy: CC BY-SA 3.0. License texts and
            source links accompany the application in resources and Electron’s
            LICENSES.chromium.html.
          </p>
          <button
            className="action"
            onClick={() => void send({ type: "open-licenses" })}
          >
            Read local license notices
          </button>
          <p>© 2026 Untoz</p>
        </div>
      )}
      {state.panel === "settings" && (
        <div className="settings-content">
          <h2>Tabs</h2>
          <Toggle
            label="Restore normal tabs at startup"
            checked={state.settings.restoreSession}
            onChange={(restoreSession) => set({ restoreSession })}
          />
          <p className="muted">
            When off, start with a fresh New Tab. Private tabs are never
            restored.
          </p>
          <h2>Search</h2>
          <label className="setting-row">
            Default search engine
            <select
              value={state.settings.searchEngine}
              onChange={(e) =>
                set({
                  searchEngine: e.target.value as Settings["searchEngine"],
                })
              }
            >
              {Object.entries(SEARCH_ENGINES).map(([id, engine]) => (
                <option key={id} value={id}>
                  {engine.label}
                </option>
              ))}
            </select>
          </label>
          <h2>Privacy &amp; security</h2>
          <Toggle
            label="Block ads (EasyList)"
            checked={state.settings.adBlocking}
            onChange={(adBlocking) => set({ adBlocking })}
          />
          <Toggle
            label="Remove tracking parameters"
            checked={state.settings.removeTrackingParameters}
            onChange={(removeTrackingParameters) =>
              set({ removeTrackingParameters })
            }
          />
          <Toggle
            label="Block trackers (EasyPrivacy)"
            checked={state.settings.trackerProtection}
            onChange={(trackerProtection) => set({ trackerProtection })}
          />
          <Toggle
            label="Clear cookies, site storage and cache on exit"
            checked={state.settings.clearSiteDataOnExit}
            onChange={(clearSiteDataOnExit) => set({ clearSiteDataOnExit })}
          />
          <p className="muted">
            Cookies work normally during browsing. Clear on exit signs you out
            of websites.
          </p>
          <h2>Cookie controls</h2>
          <p className="muted">
            Cookies are allowed during browsing. Delete them below or enable
            clear on exit to sign out of websites. Selective third-party cookie
            blocking is not available in this alpha.
          </p>
          <div className="panel-tools">
            <button
              className="action"
              onClick={() => void send({ type: "clear-cookies" })}
            >
              Delete all cookies…
            </button>
            <button
              className="action"
              onClick={() => void send({ type: "clear-data" })}
            >
              Clear browsing data…
            </button>
            <button
              className="action"
              onClick={() => void send({ type: "revoke-permissions" })}
            >
              Revoke permission grants
            </button>
          </div>
          <p className="muted">
            Permission grants last for the current page only. Reload pages after
            revoking to stop active access. Device and unsupported permissions
            are denied.
          </p>
          {state.settings.siteExceptions.length > 0 && (
            <>
              <h2>Normal-site protection exceptions</h2>
              {state.settings.siteExceptions.map((host) => (
                <div className="setting-row" key={host}>
                  <span>{host}</span>
                  <button
                    className="action"
                    onClick={() =>
                      set({
                        siteExceptions: state.settings.siteExceptions.filter(
                          (h) => h !== host,
                        ),
                      })
                    }
                  >
                    Remove exception
                  </button>
                </div>
              ))}
            </>
          )}
          <h2>Appearance</h2>
          <label className="setting-row">
            Theme
            <select
              value={state.settings.theme}
              onChange={(e) =>
                set({ theme: e.target.value as Settings["theme"] })
              }
            >
              <option value="dark">Untoz Dark</option>
              <option value="midnight">Midnight</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <h2>Downloads</h2>
          <Toggle
            label="Ask where to save each file"
            checked={state.settings.askDownloadLocation}
            onChange={(askDownloadLocation) => set({ askDownloadLocation })}
          />
          <div className="setting-row">
            <span className="directory">
              {state.settings.downloadDirectory}
            </span>
            <button
              className="action"
              onClick={() => void send({ type: "choose-download-directory" })}
            >
              Choose folder…
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
