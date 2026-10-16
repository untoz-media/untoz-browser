import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FiltersEngine, Request } from "@ghostery/adblocker";
import { NetworkFilters } from "../electron/filters";
import {
  isWebUrl,
  isInlineFavicon,
  isTracker,
  resolveNavigateInput,
  stripTrackingParameters,
} from "../shared/navigation";
import { DEFAULT_SETTINGS, NEW_TAB, type Tab } from "../shared/browser";
import { PRODUCT_LINKS } from "../shared/links";
import {
  isThirdPartyRequest,
  siteKey,
  upgradeToHttps,
} from "../shared/protection";
import { isCommand } from "../shared/commands";
import {
  Storage,
  acceptedDownloadDirectory,
  addHistory,
  sessionSnapshot,
  validSettings,
} from "../electron/storage";

test("Alpha settings migrate with privacy defaults and bounded exceptions", () => {
  const settings = validSettings(
    {
      theme: "midnight",
      adBlocking: false,
      siteExceptions: ["example.com", "example.com", "https://bad.test/path"],
    },
    DEFAULT_SETTINGS,
  );
  assert.equal(settings.theme, "midnight");
  assert.equal(settings.adBlocking, false);
  assert.equal(settings.removeTrackingParameters, true);
  assert.deepEqual(settings.siteExceptions, ["example.com"]);
  assert.equal(validSettings({}, DEFAULT_SETTINGS).adBlocking, true);
});

test("Standard network filters honor resource types, third-party rules and exceptions", () => {
  const engine = FiltersEngine.parse(
    "||ads.example^$script,third-party\n@@||ads.example/allowed.js$script",
    { loadCosmeticFilters: false },
  );
  const request = (
    url: string,
    sourceUrl = "https://publisher.test",
    type: "script" | "image" = "script",
  ) => Request.fromRawDetails({ url, sourceUrl, type });
  assert.equal(engine.match(request("https://ads.example/ad.js")).match, true);
  assert.equal(
    engine.match(request("https://ads.example/allowed.js")).match,
    false,
  );
  assert.equal(
    engine.match(request("https://ads.example/ad.js", "https://ads.example"))
      .match,
    false,
  );
  assert.equal(
    engine.match(
      request("https://ads.example/ad.js", "https://publisher.test", "image"),
    ).match,
    false,
  );
});

test("Bundled list hashes validate and established lists match actual ad/tracker requests", () => {
  const filters = new NetworkFilters(join(process.cwd(), "resources/filters"));
  assert.equal(
    filters.match(
      "https://www.google-analytics.com/collect",
      "https://publisher.test",
      "xhr",
      false,
      true,
    ),
    "trackers",
  );
  assert.equal(
    filters.match(
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
      "https://publisher.test",
      "script",
      true,
      false,
    ),
    "ads",
  );
  assert.equal(
    filters.match(
      "https://www.google-analytics.com/collect",
      "https://publisher.test",
      "xhr",
      false,
      false,
    ),
    undefined,
  );
  assert.equal(
    filters.match(
      "https://example.com/article",
      "https://example.com",
      "xhr",
      true,
      true,
    ),
    undefined,
  );
});

test("addresses, localhost ports, IPv6 and search engines", () => {
  for (const [input, expected] of [
    ["example.com", "https://example.com/"],
    ["example.com:8080/a", "https://example.com:8080/a"],
    ["localhost:3000/a?q=1", "http://localhost:3000/a?q=1"],
    ["127.0.0.1:8080", "http://127.0.0.1:8080/"],
    ["[::1]:3000", "http://[::1]:3000/"],
    ["https://example.com", "https://example.com/"],
    ["about:blank", NEW_TAB],
  ])
    assert.equal(resolveNavigateInput(input), expected);
  assert.equal(
    resolveNavigateInput("best movies 2026"),
    "https://duckduckgo.com/?q=best%20movies%202026",
  );
  assert.match(
    resolveNavigateInput("hello", "bing")!,
    /^https:\/\/www.bing.com/,
  );
  for (const input of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "data:text/html,hi",
    "https://user:pass@example.com",
    "https://",
    "",
  ])
    assert.equal(resolveNavigateInput(input), null);
});
test("tracking removal preserves unrelated encoding and signed query strings", () => {
  assert.equal(
    stripTrackingParameters(
      "https://example.com/?q=a%20b&utm_source=x&fbclid=y#part",
    ),
    "https://example.com/?q=a%20b#part",
  );
  assert.equal(
    stripTrackingParameters("https://example.com/?utm_source=x&sig=abc"),
    "https://example.com/?utm_source=x&sig=abc",
  );
  assert.equal(
    stripTrackingParameters("https://example.com/?X-Amz-Credential=x&gclid=y"),
    "https://example.com/?X-Amz-Credential=x&gclid=y",
  );
  assert.equal(
    stripTrackingParameters("https://example.com/?custom=1"),
    "https://example.com/?custom=1",
  );
  assert.equal(isTracker("https://sub.google-analytics.com/collect"), true);
  assert.equal(isTracker("https://notgoogle-analytics.com/"), false);
  assert.equal(isWebUrl("https://example.com/"), true);
});
test("IPC rejects malformed and hostile requests", () => {
  for (const value of [
    null,
    {},
    { type: "executeJavaScript", code: "evil" },
    { type: "new-tab", private: "yes" },
    {
      type: "viewport",
      bounds: { x: NaN, y: 0, width: 4, height: 4 },
      visible: true,
    },
    { type: "download", id: 5, action: "open" },
  ])
    assert.equal(isCommand(value), false);
  assert.equal(isCommand({ type: "navigate", input: "example.com" }), true);
  assert.equal(isCommand({ type: "settings", settings: {} }), true);
});
test("Brave Search and new removal commands are validated", () => {
  assert.equal(
    resolveNavigateInput("private search", "brave"),
    "https://search.brave.com/search?q=private%20search",
  );
  assert.equal(
    validSettings({ searchEngine: "brave" }, DEFAULT_SETTINGS).searchEngine,
    "brave",
  );
  assert.equal(
    isCommand({ type: "remove-history", url: "https://example.com" }),
    true,
  );
  assert.equal(isCommand({ type: "remove-history", url: 42 }), false);
  assert.equal(
    isCommand({ type: "download", id: "known-id", action: "remove" }),
    true,
  );
  assert.equal(
    isCommand({ type: "download", id: "known-id", action: "pause" }),
    true,
  );
  assert.equal(
    isCommand({ type: "download", id: "known-id", action: "resume" }),
    true,
  );
  assert.equal(
    isCommand({ type: "download", id: "known-id", action: "exec" }),
    false,
  );
  assert.equal(acceptedDownloadDirectory("relative/downloads"), "");
  assert.equal(acceptedDownloadDirectory("../outside"), "");
  assert.equal(
    acceptedDownloadDirectory(join(tmpdir(), "untoz-downloads")),
    join(tmpdir(), "untoz-downloads"),
  );
  assert.equal(isInlineFavicon("https://tracking.test/icon.png"), false);
  assert.equal(isInlineFavicon("data:image/svg+xml,<svg/>"), false);
});
test("private URLs never enter session restore and reloads do not spam history", () => {
  const tabs = [
    { id: "a", url: "https://normal.test", private: false },
    { id: "b", url: "https://secret.test", private: true },
  ] as Tab[];
  assert.deepEqual(sessionSnapshot(tabs, "b"), {
    urls: ["https://normal.test"],
    activeIndex: 0,
  });
  const entry = { url: "https://example.com", title: "Example", timestamp: 1 };
  assert.equal(addHistory([entry], { ...entry, timestamp: 2 }).length, 1);
  assert.equal(addHistory([entry], { ...entry, timestamp: 2 })[0].timestamp, 2);
});
test("versioned storage survives restart and protects corrupt input", () => {
  const dir = mkdtempSync(join(tmpdir(), "untoz-unit-"));
  try {
    const path = join(dir, "browser-data.json");
    const storage = new Storage(path);
    storage.data.settings.restoreSession = true;
    storage.flush();
    assert.equal(new Storage(path).data.settings.restoreSession, true);
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        settings: { downloadDirectory: "relative/downloads" },
      }),
    );
    assert.equal(new Storage(path).data.settings.downloadDirectory, "");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        settings: { downloadDirectory: dir },
      }),
    );
    assert.equal(new Storage(path).data.settings.downloadDirectory, dir);
    writeFileSync(path, "{broken");
    const broken = new Storage(path);
    broken.flush();
    assert.ok(broken.error);
    assert.equal(readFileSync(path, "utf8"), "{broken");
    assert.equal(
      validSettings({ theme: "invalid" as "dark" }, DEFAULT_SETTINGS).theme,
      "dark",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("https upgrade, third-party sites, and local profile defaults", () => {
  assert.equal(upgradeToHttps("http://example.com/a"), "https://example.com/a");
  assert.equal(
    upgradeToHttps("http://example.com:8080/a?q=1"),
    "https://example.com:8080/a?q=1",
  );
  assert.equal(upgradeToHttps("https://example.com/"), null);
  assert.equal(upgradeToHttps("http://127.0.0.1:3000/one"), null);
  assert.equal(upgradeToHttps("http://localhost:3000/a"), null);
  assert.equal(upgradeToHttps("http://[::1]:3000/"), null);
  assert.equal(siteKey("www.example.com"), "example.com");
  assert.equal(siteKey("news.bbc.co.uk"), "bbc.co.uk");
  assert.equal(
    isThirdPartyRequest(
      "https://ads.example.net/a.js",
      "https://www.example.com/page",
    ),
    true,
  );
  assert.equal(
    isThirdPartyRequest(
      "https://cdn.example.com/a.js",
      "https://www.example.com/page",
    ),
    false,
  );
  assert.equal(
    isThirdPartyRequest("http://127.0.0.1/a", "http://127.0.0.1/b"),
    false,
  );
  const settings = validSettings({}, DEFAULT_SETTINGS);
  assert.equal(settings.httpsOnly, true);
  assert.equal(settings.blockThirdPartyCookies, true);
  assert.equal(settings.fingerprintingProtection, true);
  assert.equal(settings.profileName, "Luis");
  assert.equal(
    validSettings({ profileName: "   " }, DEFAULT_SETTINGS).profileName,
    "Luis",
  );
  assert.equal(
    validSettings({ profileName: "  Ada  " }, DEFAULT_SETTINGS).profileName,
    "Ada",
  );
  assert.equal(isCommand({ type: "save-workspace", name: "Morning" }), true);
  assert.equal(
    isCommand({ type: "save-workspace", name: "x".repeat(41) }),
    false,
  );
  assert.equal(isCommand({ type: "open-workspace", id: "workspace-1" }), true);
  assert.equal(isCommand({ type: "remove-workspace", id: 4 }), false);
});
test("saved workspaces keep only named http sets", () => {
  const dir = mkdtempSync(join(tmpdir(), "untoz-workspace-"));
  try {
    const path = join(dir, "browser-data.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        workspaces: [
          {
            id: "w1",
            name: "Saved",
            urls: ["https://example.com/", "notaurl", "https://untoz.site/"],
          },
          { id: "bad", name: "", urls: ["https://example.com/"] },
        ],
      }),
    );
    const loaded = new Storage(path);
    assert.equal(loaded.data.workspaces.length, 1);
    assert.equal(loaded.data.workspaces[0].name, "Saved");
    assert.deepEqual(loaded.data.workspaces[0].urls, [
      "https://example.com/",
      "https://untoz.site/",
    ]);
    assert.equal(loaded.data.quickLinks[0].title, PRODUCT_LINKS[0].title);
    assert.equal(loaded.data.settings.httpsOnly, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
