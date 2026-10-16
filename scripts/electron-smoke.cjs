const { _electron: electron } = require("playwright-core");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "untoz-smoke-"));
  const results = path.resolve("test-results");
  fs.mkdirSync(results, { recursive: true });
  const server = http.createServer((req, res) => {
    if (req.url === "/slow-download") {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="slow-test.bin"',
        "Content-Length": 10000000,
      });
      const timer = setInterval(() => res.write(Buffer.alloc(1000)), 100);
      res.on("close", () => clearInterval(timer));
      return;
    }
    if (req.url === "/slow-page") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write("<title>Slow Page</title><p>Waiting");
      return;
    }
    if (req.url === "/favicon.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(fs.readFileSync("assets/logo/favicon.png"));
      return;
    }
    if (req.url.startsWith("/download")) {
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="untoz-test.txt"',
      });
      res.end("Untoz download verification");
      return;
    }
    if (req.url.startsWith("/redirect")) {
      res.writeHead(302, { Location: "/two" });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<title>${req.url.startsWith("/two") ? "Page Two" : "Page One"}</title><link rel="icon" href="/favicon.png"><h1>${req.url}</h1><input id="memory"><a id="next" href="/two">Next</a><a id="popup" href="/two?popup=1" target="_blank">Popup</a>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let app;
  let page;
  const env = { ...process.env, UNTOZ_TEST_PROFILE: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  const launch = async () => {
    app = await electron.launch({
      args: ["."],
      cwd: process.cwd(),
      env,
      timeout: 30000,
    });
    page = await app.firstWindow();
    page.on("pageerror", (e) => console.error("Renderer error:", e));
    await page.waitForFunction(() => !!window.untozBrowser, { timeout: 15000 });
    await page
      .getByRole("heading", {
        name: /Good (morning|afternoon|evening), Luis\./,
      })
      .waitFor({ timeout: 15000 });
  };
  const command = (c) =>
    page.evaluate((c) => window.untozBrowser.command(c), c);
  const snapshot = () => page.evaluate(() => window.untozBrowser.snapshot());
  const until = async (predicate, message) => {
    const end = Date.now() + 15000;
    while (Date.now() < end) {
      const s = await snapshot();
      if (predicate(s)) return s;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(message);
  };
  const guestId = async (url) =>
    app.evaluate(
      ({ webContents }, url) =>
        webContents.getAllWebContents().find((w) => w.getURL() === url)?.id,
      url,
    );
  const guestEval = (id, code) =>
    app.evaluate(
      ({ webContents }, { id, code }) =>
        webContents.fromId(id).executeJavaScript(code, true),
      { id, code },
    );
  const check = (name) => console.log(`PASS ${name}`);
  try {
    await launch();
    await page.screenshot({ path: path.join(results, "home.png") });
    let state = await snapshot();
    assert.equal(state.tabs.length, 1);
    assert.equal(state.tabs[0].url, "untoz://newtab");
    check("Electron startup and local new tab");
    const first = state.activeTabId;
    await command({
      type: "navigate",
      input: `${origin}/one?utm_source=test&q=keep`,
    });
    state = await until(
      (s) => s.tabs[0].title === "Page One" && !s.tabs[0].isLoading,
      "First navigation timed out",
    );
    assert.equal(state.tabs[0].url, `${origin}/one?q=keep`);
    const wc1 = await guestId(`${origin}/one?q=keep`);
    assert.ok(wc1);
    await until(
      (s) => s.tabs[0].favicon?.startsWith("data:image/png"),
      "Favicon not synchronized",
    );
    check("Favicon loaded inside the page session");
    await guestEval(
      wc1,
      'document.querySelector("#memory").value = "still here"',
    );
    await command({ type: "new-tab", url: `${origin}/two` });
    state = await until(
      (s) =>
        s.tabs.length === 2 &&
        s.tabs[1].title === "Page Two" &&
        !s.tabs[1].isLoading,
      "Second navigation timed out",
    );
    const second = state.activeTabId;
    const wc2 = await guestId(`${origin}/two`);
    assert.notEqual(wc1, wc2);
    assert.equal(
      await app.evaluate(
        ({ BrowserWindow }, id) =>
          BrowserWindow.getAllWindows()[0].contentView.children.some(
            (view) => view.webContents?.id === id && !view.getVisible(),
          ),
        wc1,
      ),
      true,
    );
    assert.equal(
      await app.evaluate(
        ({ webContents }, id) =>
          webContents.fromId(id).getBackgroundThrottling(),
        wc1,
      ),
      true,
    );
    check(
      "Inactive pages remain owned, hidden and configured for background throttling",
    );
    await command({ type: "activate-tab", id: first });
    assert.equal(
      await guestEval(wc1, 'document.querySelector("#memory").value'),
      "still here",
    );
    check("Independent tabs preserve DOM without reload");
    await command({ type: "navigate", input: `${origin}/two?history=1` });
    state = await until(
      (s) => s.tabs[0].canGoBack && !s.tabs[0].isLoading,
      "Back state not updated",
    );
    assert.equal(state.tabs[1].canGoBack, false);
    await command({ type: "back" });
    await until(
      (s) => s.tabs[0].url === `${origin}/one?q=keep` && s.tabs[0].canGoForward,
      "Back navigation failed",
    );
    await command({ type: "forward" });
    await until(
      (s) => s.tabs[0].url.includes("history=1") && !s.tabs[0].isLoading,
      "Forward navigation failed",
    );
    check("Independent back/forward navigation");
    await guestEval(wc1, 'document.querySelector("#popup").click()');
    state = await until(
      (s) => s.tabs.length === 3 && s.tabs[2].title === "Page Two",
      "Popup did not create a tab",
    );
    assert.equal(
      await app.evaluate(
        ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
      ),
      1,
    );
    check("target blank stays in Untoz tabs");
    await command({ type: "close-tab", id: second });
    assert.equal(
      await app.evaluate(
        ({ webContents }, id) => !!webContents.fromId(id),
        wc2,
      ),
      false,
    );
    check("Closing a tab releases web contents");
    await command({ type: "activate-tab", id: first });
    await until(
      (s) => s.tabs.find((t) => t.id === first)?.favicon,
      "Favorite favicon not ready",
    );
    await command({ type: "bookmark" });
    state = await snapshot();
    assert.equal(state.bookmarks.length, 1);
    assert.ok(state.bookmarks[0].favicon?.startsWith("data:image/png"));
    await command({ type: "reload" });
    await until((s) => !s.tabs[0].isLoading, "Reload failed");
    state = await snapshot();
    assert.equal(
      state.history.filter((h) => h.url.includes("history=1")).length,
      1,
    );
    check("Bookmarks and deduplicated history");
    const historyToDelete = state.history.find((h) =>
      h.url.includes("history=1"),
    ).url;
    await command({ type: "remove-history", url: historyToDelete });
    assert.equal(
      (await snapshot()).history.some((h) => h.url === historyToDelete),
      false,
    );
    check("Individual history entries can be deleted");
    await guestEval(
      wc1,
      'fetch("https://www.google-analytics.com/collect").catch(() => null)',
    );
    state = await until(
      (s) => s.tabs[0].blockedTrackers > 0,
      "Tracker count missing",
    );
    check("Tracker requests blocked and counted");
    assert.equal(
      await guestEval(wc1, 'typeof window.untozBrowser + ":" + typeof require'),
      "undefined:undefined",
    );
    check("Remote pages have no preload bridge or Node");
    await app.evaluate(({ dialog }) => {
      globalThis.permissionPrompts = [];
      dialog.showMessageBox = async (_window, options) => {
        globalThis.permissionPrompts.push(options.message);
        return { response: 0, checkboxChecked: false };
      };
    });
    assert.equal(
      await guestEval(wc1, "Notification.requestPermission()"),
      "denied",
    );
    assert.equal(
      await app.evaluate(() => globalThis.permissionPrompts.length),
      1,
    );
    check("Website permission requests reach a deny-by-default prompt");
    await app.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => ({
        response: 1,
        checkboxChecked: false,
      });
    });
    await command({ type: "navigate", input: `${origin}/permissions` });
    await until(
      (s) => s.tabs[0].url.endsWith("/permissions") && !s.tabs[0].isLoading,
      "Permission page failed",
    );
    assert.equal(
      await guestEval(wc1, "Notification.requestPermission()"),
      "granted",
    );
    assert.ok((await snapshot()).tabs[0].permissions.includes("notifications"));
    await command({ type: "revoke-permissions" });
    assert.deepEqual((await snapshot()).tabs[0].permissions, []);
    check("Explicit permission approval and revocation");
    const beforeShortcut = (await snapshot()).tabs.length;
    await app.evaluate(({ webContents }, id) => {
      const wc = webContents.fromId(id);
      wc.focus();
      wc.sendInputEvent({
        type: "keyDown",
        keyCode: "t",
        modifiers: ["control"],
      });
      wc.sendInputEvent({
        type: "keyUp",
        keyCode: "t",
        modifiers: ["control"],
      });
    }, wc1);
    await until(
      (s) => s.tabs.length === beforeShortcut + 1,
      "Ctrl+T from guest failed",
    );
    const key = async (keyCode, modifiers) =>
      app.evaluate(
        ({ BrowserWindow }, { keyCode, modifiers }) => {
          const wc = BrowserWindow.getAllWindows()[0].webContents;
          wc.sendInputEvent({ type: "keyDown", keyCode, modifiers });
          wc.sendInputEvent({ type: "keyUp", keyCode, modifiers });
        },
        { keyCode, modifiers },
      );
    await key("w", ["control"]);
    await until((s) => s.tabs.length === beforeShortcut, "Ctrl+W failed");
    await key("l", ["control"]);
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("aria-label") ===
        "Search or enter address",
    );
    check("Keyboard shortcuts work with webpage focus");
    const addressInput = page.getByRole("textbox", {
      name: "Search or enter address",
      exact: true,
    });
    await key("t", ["control"]);
    await until(
      (s) => s.tabs.length === beforeShortcut + 1,
      "New tab shortcut failed",
    );
    await addressInput.fill(`${origin}/typed-address`);
    assert.equal(await addressInput.inputValue(), `${origin}/typed-address`);
    await addressInput.press("Enter");
    await until(
      (s) =>
        s.tabs.some((t) => t.url.endsWith("/typed-address") && !t.isLoading),
      "Address entry after Ctrl+T failed",
    );
    await key("w", ["control"]);
    state = await until(
      (s) => s.tabs.length === beforeShortcut,
      "Close typed tab failed",
    );
    const activeBeforeCycle = state.activeTabId;
    await key("Tab", ["control"]);
    await until(
      (s) => s.activeTabId !== activeBeforeCycle,
      "Next tab shortcut failed",
    );
    await key("Tab", ["control", "shift"]);
    await until(
      (s) => s.activeTabId === activeBeforeCycle,
      "Previous tab shortcut failed",
    );
    check("Address entry after Ctrl+T and tab cycling");
    await command({ type: "activate-tab", id: first });
    const beforeBack = (await snapshot()).tabs.find((t) => t.id === first).url;
    await key("Left", ["alt"]);
    await until(
      (s) =>
        s.tabs.find((t) => t.id === first).url !== beforeBack &&
        !s.tabs.find((t) => t.id === first).isLoading,
      "Alt+Left failed",
    );
    await key("Right", ["alt"]);
    await until(
      (s) =>
        s.tabs.find((t) => t.id === first).url === beforeBack &&
        !s.tabs.find((t) => t.id === first).isLoading,
      "Alt+Right failed",
    );
    await guestEval(
      wc1,
      'document.querySelector("#memory").value = "reload marker"',
    );
    await app.evaluate(
      ({ BrowserWindow, webContents }, id) =>
        new Promise((resolve) => {
          webContents.fromId(id).once("did-finish-load", () => resolve(true));
          const shell = BrowserWindow.getAllWindows()[0].webContents;
          shell.sendInputEvent({
            type: "keyDown",
            keyCode: "r",
            modifiers: ["control"],
          });
          shell.sendInputEvent({
            type: "keyUp",
            keyCode: "r",
            modifiers: ["control"],
          });
        }),
      wc1,
    );
    assert.equal(
      await guestEval(wc1, 'document.querySelector("#memory").value'),
      "",
    );
    await command({ type: "navigate", input: origin + "/slow-page" });
    await until(
      (s) =>
        s.tabs.find((t) => t.id === first).url.endsWith("/slow-page") &&
        s.tabs.find((t) => t.id === first).isLoading,
      "Slow page never started",
    );
    await command({ type: "stop" });
    await until(
      (s) => !s.tabs.find((t) => t.id === first).isLoading,
      "Stop loading failed",
    );
    check("Alt navigation, Ctrl+R and Stop loading");
    await command({ type: "navigate", input: origin + "/one" });
    await until(
      (s) =>
        s.tabs.find((t) => t.id === first).title === "Page One" &&
        !s.tabs.find((t) => t.id === first).isLoading,
      "Return to local page failed",
    );
    await command({ type: "new-tab", private: true, url: `${origin}/private` });
    state = await until(
      (s) =>
        s.tabs.some((t) => t.private && !t.isLoading && t.title === "Page One"),
      "Private page timed out",
    );
    const secret = state.tabs.find((t) => t.private);
    const privateWc = await guestId(`${origin}/private`);
    await guestEval(
      privateWc,
      'document.cookie="private_test=1"; localStorage.setItem("private_test", "1")',
    );
    assert.equal(
      await app.evaluate(
        ({ webContents }, id) => webContents.fromId(id).session.isPersistent(),
        privateWc,
      ),
      false,
    );
    assert.equal(
      state.history.some((h) => h.url.includes("/private")),
      false,
    );
    await command({ type: "close-tab", id: secret.id });
    await command({
      type: "new-tab",
      private: true,
      url: `${origin}/private-again`,
    });
    await until(
      (s) =>
        s.tabs.some((t) => t.private && !t.isLoading && t.title === "Page One"),
      "Second private page timed out",
    );
    const privateWc2 = await guestId(`${origin}/private-again`);
    assert.equal(await guestEval(privateWc2, "document.cookie"), "");
    assert.equal(
      await guestEval(privateWc2, 'localStorage.getItem("private_test")'),
      null,
    );
    check("Private partition is ephemeral and cleared after last private tab");
    await command({
      type: "settings",
      settings: { restoreSession: true, askDownloadLocation: false },
    });
    // Set the trusted test profile's download folder through the main-process session default,
    // then use the actual native folder chooser stub for the explicit settings action.
    await app.evaluate(({ dialog }, profile) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [profile],
      });
    }, profile);
    await command({ type: "choose-download-directory" });
    await command({ type: "activate-tab", id: first });
    await guestEval(
      wc1,
      `location.href=${JSON.stringify(origin + "/download")}`,
    );
    state = await until(
      (s) => s.downloads.some((d) => d.state === "completed"),
      "Download did not complete",
    );
    assert.equal(
      fs.readFileSync(path.join(profile, "untoz-test.txt"), "utf8"),
      "Untoz download verification",
    );
    check("Download completes with progress metadata");
    await guestEval(
      wc1,
      `location.href=${JSON.stringify(origin + "/slow-download")}`,
    );
    state = await until(
      (s) => s.downloads.some((d) => d.filename === "slow-test.bin"),
      "Slow download missing",
    );
    const slow = state.downloads.find((d) => d.filename === "slow-test.bin");
    await command({ type: "download", id: slow.id, action: "cancel" });
    await until(
      (s) => s.downloads.find((d) => d.id === slow.id)?.state === "cancelled",
      "Cancellation failed",
    );
    check("Active downloads can be cancelled");
    const completed = state.downloads.find((d) => d.state === "completed");
    assert.equal(completed.sourceUrl, origin + "/download");
    await command({ type: "download", id: completed.id, action: "remove" });
    assert.equal(
      (await snapshot()).downloads.some((d) => d.id === completed.id),
      false,
    );
    assert.ok(fs.existsSync(path.join(profile, "untoz-test.txt")));
    check("Removing a download entry preserves the downloaded file");
    await command({ type: "settings", settings: { searchEngine: "brave" } });
    await command({
      type: "navigate",
      input: "http://127.0.0.1:1/unreachable",
    });
    state = await until(
      (s) => s.tabs.find((t) => t.id === first)?.error,
      "Network error not surfaced",
    );
    check("Navigation errors are visible");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.screenshot({ path: path.join(results, "settings.png") });
    await page
      .getByRole("button", { name: "Close panel", exact: true })
      .click();
    await command({ type: "navigate", input: `${origin}/one` });
    await until(
      (s) =>
        s.tabs.find((t) => t.id === first)?.url === `${origin}/one` &&
        !s.tabs.find((t) => t.id === first)?.isLoading,
      "Final page failed",
    );
    await command({ type: "window", action: "close" });
    await app.close();
    app = undefined;
    const saved = JSON.parse(
      fs.readFileSync(path.join(profile, "browser-data.json"), "utf8"),
    );
    assert.equal(
      saved.session.urls.some((url) => url.includes("private")),
      false,
    );
    assert.equal(saved.bookmarks.length, 1);
    check("Only normal session URLs are persisted");
    app = await electron.launch({ args: ["."], cwd: process.cwd(), env });
    page = await app.firstWindow();
    await page.waitForFunction(() => !!window.untozBrowser);
    state = await until(
      (s) =>
        s.tabs.length === saved.session.urls.length &&
        s.tabs.some((t) => t.title === "Page One"),
      "Session restore failed",
    );
    assert.equal(
      state.tabs.some((t) => t.private),
      false,
    );
    assert.equal(state.bookmarks.length, 1);
    check("Session and bookmarks survive restart");
    assert.equal(state.settings.searchEngine, "brave");
    assert.ok(state.bookmarks[0].favicon?.startsWith("data:image/png"));
    check("Brave Search configuration and favorite favicons survive restart");
    await command({ type: "clear-history" });
    assert.equal((await snapshot()).history.length, 0);
    await app.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => ({
        response: 1,
        checkboxChecked: false,
      });
    });
    await command({ type: "clear-data" });
    state = await snapshot();
    assert.equal(state.tabs.length, 1);
    assert.equal(state.history.length, 0);
    assert.equal(state.bookmarks.length, 1);
    check("Clear browsing data closes pages and preserves bookmarks");
    await command({ type: "close-tab", id: state.activeTabId });
    assert.equal((await snapshot()).tabs.length, 1);
    check("Closing final tab opens a fresh new tab");
    await page
      .getByRole("textbox", { name: "Search or enter address", exact: true })
      .fill("javascript:alert(1)");
    await page
      .getByRole("textbox", { name: "Search or enter address", exact: true })
      .press("Enter");
    await page.getByRole("alert").waitFor();
    await new Promise((r) => setTimeout(r, 150));
    assert.match(await page.getByRole("alert").innerText(), /blocked/);
    await page
      .getByRole("button", { name: "Dismiss message", exact: true })
      .click();
    check("Invalid address feedback survives viewport updates until dismissed");
    await app.evaluate(({ app }) => {
      globalThis.preventTestQuit = (event) => event.preventDefault();
      app.on("before-quit", globalThis.preventTestQuit);
    });
    await command({ type: "window", action: "close" });
    for (
      let i = 0;
      i < 100 &&
      (await app.evaluate(
        ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
      ));
      i++
    )
      await new Promise((r) => setTimeout(r, 50));
    assert.equal(
      await app.evaluate(({ session }) =>
        session
          .fromPartition("persist:untoz-browser")
          .listenerCount("will-download"),
      ),
      0,
    );
    const newWindow = app.waitForEvent("window");
    await app.evaluate(({ app }) => app.emit("activate"));
    page = await newWindow;
    await page.waitForFunction(() => !!window.untozBrowser);
    assert.equal(
      await app.evaluate(({ session }) =>
        session
          .fromPartition("persist:untoz-browser")
          .listenerCount("will-download"),
      ),
      1,
    );
    await app.evaluate(({ app }) =>
      app.removeListener("before-quit", globalThis.preventTestQuit),
    );
    check(
      "Window reopen releases old session listeners and registers exactly one download handler",
    );
    await command({ type: "window", action: "close" });
    await app.close();
    app = undefined;
    console.log(
      "Electron smoke suite passed. Screenshots: test-results/home.png, test-results/settings.png",
    );
  } finally {
    if (app) {
      await app
        .evaluate(({ app }) => {
          if (globalThis.preventTestQuit)
            app.removeListener("before-quit", globalThis.preventTestQuit);
        })
        .catch(() => {});
      await app.close().catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    // Profiles are confined to mkdtemp's dedicated directory; retain them for debugging failures.
    console.log(`Isolated test profile: ${profile}`);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
