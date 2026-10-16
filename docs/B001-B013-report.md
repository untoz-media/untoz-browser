# Untoz Browser implementation report

Date: 2026-10-03. Work completed directly in the existing Electron / React / TypeScript / Vite repository. No generated artwork, AI systems, feeds, telemetry or cloud services were added. Existing uncommitted changes were inspected and carried forward; no reset or automatic commit was used.

## 1. Starting point

### Recovery checkpoint after the follow-up request

The current working tree was audited again using git status/diff, recent commits,
package scripts, active source, timer/listener searches and real Electron tests.
Git still contained only the initial commit and README update; the substantial
browser work was uncommitted. The working implementation, rather than commit
titles or the older roadmap, was used as the evidence of completion.

At that checkpoint, the native browsing/private/privacy/storage foundations were
working and integration-tested. Missing from the follow-up checklist were Brave
Search, individual history deletion, removable download entries, and persisted
favorite favicons. These are now implemented. The UI design was preserved.

The recovery pass also fixed address drafts being cleared after Ctrl+T, favicon
loss on cached back/forward navigation, and session download listeners retaining
an old window after close/reopen. Permission and web-request handlers are also
released at window disposal, with a deny-only fallback until a new window starts.
Inactive open tabs remain explicitly owned and hidden, and closing destroys them;
there are no intentionally detached live tab contents.

No TODO/FIXME placeholders were found in the active browser paths. Dormant old UI
templates (Navbar, generic overlays and primitives) remain in the source tree but
are not mounted by the browser or included in its runtime bundle. Visible sidebar
and settings controls use real backend commands. The limitations below are
explicit partial capabilities, not hidden placeholder implementations.

### Original repository audit

- Electron 25.9.8, React 18, Zustand and Vite 4; a frameless dark shell and existing Untoz logo assets.
- An address resolver, navigation controls, sandboxed webview preferences and a narrow title-setting preload bridge existed in the working tree.
- All renderer tabs shared one webview. Switching tabs loaded a different URL into that same page; each tab did not retain independent navigation or DOM state.
- Popup requests navigated the existing page rather than opening a new tab. Active-tab close controls were missing. Sidebar items and Home content were largely placeholders.
- No working bookmark/history/download/private-session/settings persistence foundation.
- Baseline typecheck failed because both TypeScript projects included the same sources; lint failed because no ESLint configuration existed; build failed because Tailwind contained unquoted hyphenated object keys and undeclared plugins.

## 2. Implemented scope

| Milestone | Delivered foundation                                                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B001      | Main-owned independent WebContentsView per visited tab; UUID, URL, title, favicon, loading/back/forward/private/privacy state; adjacent-tab selection; explicit web-contents destruction; a fresh normal tab after the final tab closes.                                                                                                |
| B002      | HTTP/HTTPS, domain names, localhost ports, IPv4/IPv6, configurable search, back/forward/reload/stop, navigation events, title and favicon synchronization, inline failures, HTTP/HTTPS popups as new tabs.                                                                                                                              |
| B003      | Small tracker-host blocklist, conservative tracking-query removal, deny-by-default permission checks/requests, native explicit approval dialogs, sandboxing and isolation.                                                                                                                                                              |
| B004      | Shield count per current navigation, protection status, page permission list and grant revocation.                                                                                                                                                                                                                                      |
| B005      | Local React New Tab, existing branding, central search, up to 12 configurable quick links, no startup web requests from Home.                                                                                                                                                                                                           |
| B006      | Local bookmark toggle, removal, listing and opening, including small persisted favicon images; stable IDs and creation/update timestamps for future migration/sync.                                                                                                                                                                     |
| B007      | URL/title/timestamp history; most recent visit per URL, maximum 3,000 entries; clear history; no private-tab history. UI shows 300 entries at a time with Show older history; individual entries can be deleted.                                                                                                                        |
| B008      | Electron download events, progress, completion/cancellation/failure, cancel action, guarded file opening, Show in folder, source URL and removal of finished entries without deleting files, native save dialog and configurable default folder.                                                                                        |
| B009      | Separate nonpersistent private partition with cache disabled; cleanup of cookies/storage/cache/auth/connections after the final private tab; private download metadata removed and active private downloads cancelled at session end.                                                                                                   |
| B010      | Fresh New Tab or optional normal-session restore, four search providers (DuckDuckGo, Google, Bing and Brave Search), tracker toggle, clear browsing data, clear site data on exit, permission grant revocation, dark/light/system theme, download location/save prompting.                                                              |
| B011      | Minimal normal-tab URLs plus active normal index; lazy restored pages, with only the selected page initially loaded; no private URLs in session state.                                                                                                                                                                                  |
| B012      | Hidden inactive native views with explicit window ownership, explicit cleanup, Chromium background throttling enabled, coalesced state updates, library IPC deltas, debounced atomic disk writes, bounded history/download metadata, no tab animations or permanent application polling. Background lifecycle limitations remain below. |
| B013      | Upgraded Electron to 44.5.1, validated trusted main-frame IPC and payloads, disabled renderer webview embedding, explicit safe navigation protocols, no remote preload, restrictive chrome CSP, safe development startup and default certificate rejection. Further release hardening remains below.                                    |

Shortcuts: Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+L, Alt+Left, Alt+Right and Ctrl+R. macOS command modifiers are accepted by the implementation, but this session validated Windows only.

## 3. Added files

- `shared/browser.ts`, `shared/commands.ts`, `shared/navigation.ts`, `shared/search.ts`: typed bridge/state, runtime command validation, shared navigation/privacy URL rules.
- `electron/tabs.ts`, `electron/privacy.ts`, `electron/storage.ts`, `electron/downloads.ts`, `electron/favicon.ts`: native tab ownership, privacy policy, local versioned data, downloads and bounded session-aware favicon loading.
- `src/pages/Panels.tsx`, `src/vite-env.d.ts`: working management pages and Vite asset typing.
- `.eslintrc.cjs`, `.prettierignore`: usable lint/format configuration.
- `tests/core.test.ts`, `scripts/test.cjs`, `scripts/electron-smoke.cjs`, `scripts/dev-smoke.cjs`, `scripts/packaged-smoke.cjs`: unit, Electron integration, development and packaged startup validation.
- `docs/B001-B013-report.md`: this report.

`src/lib/resolveNavigateInput.ts` and `src/types/electron-api.d.ts` were already untracked at audit time. They were updated, not introduced from scratch by this session.

## 4. Substantially modified files

- `electron/main.ts`, `electron/preload.ts`: lifecycle, trusted IPC, native window actions and a typed narrow bridge.
- `src/App.tsx`, `src/store/useTabsStore.ts`, `src/main.tsx`: renderer state now mirrors the main process; no renderer-owned guest pages or router wrapper.
- `src/components/navigation/TopNavigationBar.tsx`, `Sidebar.tsx`, `src/components/ui/Tab.tsx`, `Tabs.tsx`, `WebView.tsx`: working navigation, tab controls, sidebar and native viewport measurement.
- `src/pages/Home.tsx`, `src/index.css`: local Home and consistent lightweight blue/dark/light chrome using the existing logo.
- `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `index.html`, `.gitignore`: tooling, dependencies, packaging, strict checking, valid Tailwind and CSP.
- `README.md`, `MISSION.md`, `ROADMAP.md`: current implementation and validation scope.

Small pre-existing strict/type/lint repairs were made in Search, ContextMenu, Navbar, Dialog, Modal, Toast, Button and Dropdown. Existing changes to Input were retained and formatted.

## 5. Architecture decisions

The application remains Electron + React/TypeScript/Vite with Zustand. The shared webview was the broken core, so page ownership moved to the Electron main process using the current [WebContentsView API](https://www.electronjs.org/docs/latest/api/web-contents-view). Each visited tab retains its own Chromium history and DOM. Local New Tabs and unselected restored tabs do not allocate guest contents.

Normal tabs share the existing `persist:untoz-browser` partition, preserving normal-site login semantics. Private tabs share a distinct memory-only partition while the private session exists. The partition is cleared before reuse; cleanup failure blocks further private use until restart. [Electron session partitions](https://www.electronjs.org/docs/latest/api/session#sessionfrompartitionpartition-options) distinguish persistent and in-memory storage.

Only trusted chrome receives the preload bridge. Remote pages have no preload, Node integration or IPC access. IPC operations identify existing tabs/downloads rather than accepting arbitrary filesystem paths or executable code. Window ownership and payload validation are checked in the main process. A single-instance lock prevents two processes overwriting the same profile; an absolute `--user-data-dir` selects a separate profile.

`browser-data.json` lives under Electron's `app.getPath('userData')`. It has a versioned schema, atomically replaced through a temporary file. It stores settings, bookmarks, history, shortcuts and optional normal-session URLs. Private runtime state and download records never enter this file. Corrupt data is preserved instead of silently overwritten. Downloaded files and explicitly saved bookmarks remain after private browsing, as described in the UI.

## 6. Privacy and security protections

- Tracker requests are blocked for a small exact/domain-suffix host list. This is not a comprehensive ad blocker or fingerprinting defense.
- Recognized tracking parameters are removed from GET page navigations; signed URLs and unrelated query encoding/order are preserved. Tracker protection can be disabled for compatibility.
- Camera/microphone, geolocation, notifications, sanitized clipboard writes and fullscreen require an explicit native prompt on the active top-level page. Device permissions, unsupported permissions, embedded-frame requests and background-tab requests are denied. Grants expire at navigation/close and can be revoked in settings.
- Certificate failures remain blocked; no certificate acceptance overrides or disabled web security.
- Context isolation, sandboxing and disabled Node integration apply to both shell and pages. The Electron plugin's default `--no-sandbox` development argument is explicitly overridden.
- Chrome CSP permits packaged code/local assets; Vite development uses a per-start nonce for its injected preamble. The dev server binds only to loopback.
- Favicons use the originating page's session, with no credential forwarding, redirect following or external fallback service; bounded input, timeout/cancellation and a small in-memory raster result keep remote URLs out of privileged chrome image requests.
- Opening downloads requires confirmation and an allowed document/media extension; other file types remain accessible through Show in folder. Filename sanitation and collision avoidance protect the selected download folder.
- Permission revocation removes grants immediately, but already-running capture/location activity may require reloading the page; the UI states this limitation.

## 7. Performance work

- No full-page reload during tab switching; inactive WebContentsView instances remain owned by the window and tab manager, hidden until selected. Only closing a tab detaches and destroys its web contents.
- Closing tabs explicitly closes their web contents, aborts favicon requests and removes page permission state. Closing all private tabs clears the reusable private partition instead of allocating accumulating private partitions.
- Restored inactive tabs are lazy. Loading/privacy updates are coalesced at 50 ms and download updates at 200 ms. Unchanged history/bookmark/settings libraries are omitted from frequent IPC messages.
- Persistence is debounced at 400 ms and flushed at shutdown; only a short JSON write is synchronous. History and download metadata are bounded.
- Removed unused Framer Motion, React Router, Node polyfills, concurrently and cross-env packages. Only React, React DOM, Zustand and Lucide remain production dependencies.
- Renderer output is approximately 167 KB JS / 54 KB gzip and 26 KB CSS / 6 KB gzip, plus the existing 65 KB logo. No RAM/startup-time target is claimed from these measurements.
- Important limitation: Electron 44 on this machine still reports inactive pages as `visible` through the Page Visibility API, even when their native view is hidden. Native ownership, hidden views and background-throttling configuration are tested; universal timer suspension is not claimed. Aggressive page freezing was deliberately not added because media/call compatibility needs investigation.

## 8–9. Validation and results

| Check                             | Result                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial `npx tsc --noEmit`        | Failed: overlapping project references; repaired.                                                                                                                                                                                                                                                                                                                                                |
| Initial `npm run lint`            | Failed: absent configuration; repaired.                                                                                                                                                                                                                                                                                                                                                          |
| Initial `npm run build`           | Failed: invalid Tailwind config; repaired.                                                                                                                                                                                                                                                                                                                                                       |
| `npm run typecheck`               | Passed strict checks covering renderer, main, shared contracts and Vite config.                                                                                                                                                                                                                                                                                                                  |
| `npm run lint`                    | Passed with zero warnings.                                                                                                                                                                                                                                                                                                                                                                       |
| `npm test`                        | Six passing test groups covering addresses/search, URL safety, tracking/signed query preservation, IPC validation, private restore exclusion, history deduplication and persistence/corrupt-file protection.                                                                                                                                                                                     |
| `npm run test:electron`           | Passed 28 real Electron integration checks against a local HTTP server in temporary isolated profiles. Includes page independence, DOM retention, native lifecycle, navigation, popups, favicons, tracker counts, no remote bridge, explicit permission decisions, keyboard input, private storage cleanup, downloads/cancellation, error display, session restore, bookmarks and data clearing. |
| `npm run test:dev`                | Passed Vite/React development startup, preload IPC and sandbox checks in an isolated profile.                                                                                                                                                                                                                                                                                                    |
| `npm run build`                   | Passed Windows x64 packaging; portable output is `release/Untoz Browser 1.0.0.exe`.                                                                                                                                                                                                                                                                                                              |
| `node scripts/packaged-smoke.cjs` | Passed: packaged Windows executable launched with local UI and working IPC using an isolated profile.                                                                                                                                                                                                                                                                                            |
| `npm audit --omit=dev`            | Zero production dependency vulnerabilities at validation time.                                                                                                                                                                                                                                                                                                                                   |
| Full dependency audit             | 13 high advisories remain in build-tool dependency chains (Tailwind globbing and electron-builder's download/cache dependencies). No blind force upgrade was used to hide these.                                                                                                                                                                                                                 |
| Visual review                     | Electron screenshots inspected for Home and Settings; saved under ignored `test-results/`. No artwork was generated.                                                                                                                                                                                                                                                                             |

Permission integration tests substitute dialog responses inside the test process; actual Windows hardware and OS permission dialogs still need manual checks. Integration test profiles are temporary and intentionally retained for failure diagnosis. No tests clear the user's normal profile.

## 10. Manual desktop testing still needed

- Camera/microphone hardware, geolocation services, notifications and fullscreen approval/denial; ensure OS-level behavior matches the browser prompt.
- HTTPS certificate failure scenarios, offline transitions, real-world redirects, authentication and sites using popup/opener messaging.
- Long-running video/audio/WebRTC, background CPU/RAM and many-tab operation. Verify all shortcuts with international keyboard layouts and different focus contexts.
- Native Save As cancellation, uncommon download failures, file-open confirmation, Show in folder and Windows file associations.
- Light/system theme, high-DPI/multiple monitors, resizing/maximizing, screen readers and keyboard-only operation.
- Portable wrapper launch on a clean Windows machine; code-signing/SmartScreen, executable branding and update distribution.

## 11. Remaining issues and explicit limits

- This is a working browser foundation, not a release-certified browser or a comprehensive privacy product. Build-tool advisories and background page lifecycle behavior remain release work.
- Build artifacts are unsigned and currently use Electron's default executable icon. Existing Untoz branding is used inside the app.
- Popups with HTTP/HTTPS destinations become tabs; blank popup scripting, opener-dependent login/payment flows and non-web external protocols are intentionally not implemented yet.
- Downloads are session-only metadata, with no restart persistence/resume or antivirus integration. Native filesystem files remain until the user deletes them.
- Cookie control currently means normal cookies versus clearing site data on exit; there is no exposed nonfunctional third-party-cookie switch.
- No persistent per-site permission exceptions, tab discard/memory-pressure policy, extension system, account/cloud sync, auto-update service or AI functionality.
- Home replaces a tab's remote page and releases its contents; returning from local Home does not retain that previous remote page's history stack.
- Storage writes are atomic but synchronous/debounced; sustained disk-pressure and forced-process termination behavior need stress testing. Clear-on-exit applies to orderly shutdown.

## 12. Recommended next milestone

**B014 — Desktop compatibility and release hardening.** Resolve background timer/visibility behavior with measured CPU/RAM tests, test real-site authentication/media, complete OS permission/download/certificate cases, remediate remaining build dependencies, and sign/brand the Windows release. Keep further feature expansion behind those reliability checks.
