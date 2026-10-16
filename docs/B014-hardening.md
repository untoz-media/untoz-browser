# B014 notes — 2026-10-16

Two passes on `local-version-2026-10-03`. `main` and the older PR #1 were not used.
There is still no account, telemetry, sync, or AI assistant.

## Design and privacy

The window chrome follows the navy target: U mark, tab strip, rounded address
bar with a star, local profile chip, and a sidebar for Home, Favorites,
History, Downloads, public shortcuts (Untoz+, Studio AI, HQ, Cloud), Extensions,
Workspaces, Settings, a dark/light switch, and the local profile. The start
page greets that profile by time of day, with a rounded search field and
shortcut tiles. The marketing frame, AURA panel, AURA tile, and sidebar AI item
are not part of the app. "Studio AI" is only a shortcut to the public Untoz
studios page. The profile name defaults to Luis and never signs in.

Privacy, on by default:

- EasyList and EasyPrivacy, with a per-site switch and separate ad, tracker, and tracking-parameter counters.
- HTTPS-only upgrades public `http` page loads. `localhost`, `127.0.0.1`, and `::1` stay on `http`.
- Third-party cookie blocking removes `Cookie` and `Set-Cookie` when the request site differs from the page. Subdomains of the same site still share cookies.
- Fingerprinting protection disables non-proxied WebRTC UDP, reduces a cross-site `Referer` to the origin, and cancels hyperlink pings. It does not rewrite canvas, audio, or fonts.
- Private windows use an in-memory partition. Clear cookies, site data, and cache on exit remains optional.
- DuckDuckGo stays the default search engine. Electron keeps `contextIsolation`, `sandbox`, and `nodeIntegration: false`, with permission prompts.

Workspaces save the normal pages open in this window, on this device, up to 20
sets. Extensions are listed so the sidebar matches the target, and the panel
says this build does not load them.

## Hardening

The first pass kept the 2026-10-03 browser behavior and fixed the defects below.

## Audit

Done and kept:

- Independent `WebContentsView` tabs, navigation, popups-as-tabs, shortcuts.
- Local Home, favorites, history (3,000 stored, 300 shown at a time), private tabs.
- EasyList / EasyPrivacy blocking, tracking-parameter removal, permission prompts.
- Settings for search, theme, downloads, clear-on-exit, and site exceptions.
- Session restore for normal tabs only. Private data stays out of `browser-data.json`.

Broken or risky before this pass:

- Closing the window could destroy it before the close command's reply was delivered.
- A failed private-partition cleanup left later private tabs with a "try again" message that would never succeed, and a cleanup failure could skip clear-on-exit.
- Reload always called `loadURL`, which pushes another history entry. A crashed renderer still needs `loadURL`.
- Holding Ctrl+T or Ctrl+W repeated the shortcut.
- A thrown filter match could skip the network callback and stall the request.
- Saved download folders were accepted even when they were not absolute. Collision renaming could loop. A missing folder was not created.
- Favorite and history titles stayed on the early title if the page title arrived later.
- An empty address submission raised an error. A failed shortcut save closed the form anyway.
- Certificate failures from codes -220 through -299 were described as certificate errors. Chromium certificate codes are -200 through -219.
- On Linux, the alpha forced-quit test killed only the main process, so child processes kept the profile and the next launch hung.

Not done, and not removed:

- Restart-persistent download resume, antivirus integration, extensions, sync, accounts, AI, VPN, or Tor.
- Home still replaces the current page and drops that page's back stack. Keeping the hidden page would spend the memory the performance goal is trying to avoid.
- Page Visibility for hidden tabs is still an Electron limitation. Views are hidden and background throttling is on. Universal timer suspension is not claimed.
- Third-party cookies are blocked, not partitioned. A site cannot opt a single cookie back in.
- Fingerprinting protection is the WebRTC, Referer, and ping subset above.
- The memory goal (under 500 MB with 10 tabs) is not met by the local fixture below.
- Windows code signing. No certificate is configured, so signing is skipped.
- Filter-list `.bin` files under `resources/filters` are runtime data, not build output. They stay in git. `node_modules`, `dist`, `dist-electron`, and `release` were already untracked. `.gitignore` now also names installer and portable binary extensions.

## Dependency advisories

`npm audit` on this branch, after the overrides below: 0 critical, 5 high, 10 moderate, all in dev or build tools. `npm audit --omit=dev`: 0.

GitHub's "1 critical, 39 high" figure matches the default branch `main` (Electron 25, Vite 4), which this import does not use. Dependabot alerts for the repository were not readable with this token (HTTP 403).

Fixed without a major upgrade:

- `http-cache-semantics` overridden to 4.3.0.
- `source-map-js` overridden to 1.2.2.
- Electron 44.5.1 moved to 44.8.0, the current supported 44 patch (includes the `session.fetch` fix used for favicons).

Left in place because the published fix is not compatible:

- Tailwind 3.4.19 chain (`braces`, `micromatch`, `chokidar`, `fast-glob`): the advisory fix is Tailwind 4, which would replace the current design system. `braces` has no release after 3.0.3.
- `electron-builder` 26.17 (`sprintf-js` via its download logger) and `postcss-selector-parser`: suggested fixes are a downgrade to electron-builder 26.5.0 or a jump to Tailwind 4.

## Checks actually run on this Linux machine

Design pass, after the hardening results below:

| Check                   | Result                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`     | Passed                                                                                                                                                      |
| `npm run lint`          | Passed, zero warnings                                                                                                                                       |
| `npm test`              | 11 passed, 0 failed                                                                                                                                         |
| `npm run test:electron` | Passed, including window reopen                                                                                                                             |
| `npm run test:dev`      | Passed                                                                                                                                                      |
| `npm run test:alpha`    | Passed, including crash reload, forced termination, and About from the profile menu                                                                         |
| `npm run test:tls`      | Passed. example.com loaded. Self-signed localhost, expired.badssl.com, and wrong.host.badssl.com were blocked. The local self-signed server received 0 hits |
| UI exercise             | Passed on a temporary profile: theme switch, local rename, privacy toggles, honest extensions panel, workspace save                                         |

`npm run benchmark`, `npm run test:sites`, and `npm run build` were not repeated for the design pass. Their hardening results below still describe this tree. The design pass did not change the tab process model.

## Hardening checks

| Check                   | Result                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`     | Passed                                                                                                                           |
| `npm run lint`          | Passed, zero warnings                                                                                                            |
| `npm test`              | 9 passed, 0 failed                                                                                                               |
| `npm run test:electron` | Passed, including window reopen                                                                                                  |
| `npm run test:dev`      | Passed                                                                                                                           |
| `npm run test:alpha`    | Passed, including crash reload and forced termination                                                                            |
| `npm run test:tls`      | Passed for example.com, self-signed, expired.badssl.com, and wrong.host.badssl.com. The local self-signed server received 0 hits |
| `npm run benchmark`     | Ran. See below                                                                                                                   |
| `npm run test:sites`    | Ran. Pages loaded. Reddit's homepage returned Reddit's own network-security block; the Reddit login page loaded                  |
| `npm run build`         | Renderer, main, and preload built. Portable exe produced. NSIS installer did not finish                                          |
| `npm run test:packaged` | Not run. It launches `release/win-unpacked/Untoz Browser.exe`, which is a Windows PE                                             |

Benchmark, isolated profile, 300-article local page, summed working sets (these double-count shared memory): about 639 MiB at 1 tab, 1,078 MiB at 5, 1,633 MiB at 10, 2,746 MiB at 20. At 10 tabs the tab processes alone were about 1,180 MiB. After closing back to one tab, owned views returned to 1 and download listeners stayed at 1. CPU samples after settling were about 0. This is not the under-500 MB goal.

`npm run build` wrote `release/Untoz Browser Portable 0.1.0-alpha.1.exe` (108 MB, PE32). Signing was skipped because no certificate is configured. The NSIS target then failed: Wine on this host cannot load 32-bit `syswow64/ntdll.dll`, and the Setup exe left on disk is a 268 KB stub, not an installer. Those files are gitignored.

## Windows verification

From this branch, with Node.js 22.12 or newer:

```bat
npm install
npm run typecheck
npm run lint
npm test
npm run test:electron
npm run test:dev
npm run test:alpha
npm run test:tls
npm run benchmark
npm run build
node scripts/packaged-smoke.cjs
```

Close `npm run dev` before `test:electron`, `test:alpha`, or `build`. They all write `dist-electron/`. `npm run build` on Windows does not need Wine. No release was published.
