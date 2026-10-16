const { launch, sleep } = require("./alpha-harness.cjs");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const results = [];
  const check = (name) => {
    results.push({ name, status: "pass" });
    console.log(`PASS ${name}`);
  };
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/media.webm") || req.url.startsWith("/audio.wav")) {
      const name = req.url.split("?")[0].slice(1);
      const data = fs.readFileSync(path.join("tests/fixtures", name));
      res.setHeader(
        "Content-Type",
        name.endsWith("webm") ? "video/webm" : "audio/wav",
      );
      res.setHeader("Accept-Ranges", "bytes");
      if (req.headers.range) {
        const [, a, b] = /bytes=(\d+)-(\d*)/.exec(req.headers.range);
        const start = +a,
          end = b ? Math.min(+b, data.length - 1) : data.length - 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Content-Length": end - start + 1,
        });
        return res.end(data.subarray(start, end + 1));
      }
      return res.end(data);
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<title>Alpha Fixture</title><h1>Alpha compatibility fixture</h1><video id="v" src="/media.webm" controls width="320"></video><audio id="a" src="/audio.wav" controls></audio><input id="text"><input type="file" id="upload"><a href="/popup" target="_blank">New window</a><button onclick="alert('Native dialog')">Dialog</button><div style="height:2000px">Scrollable content</div><script>window.autoplayResult=document.querySelector('#v').play().then(()=> 'played',e=>e.name)</script>`,
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let h = await launch();
  try {
    let id = await h.navigate(
      `${origin}/start?utm_source=test&fbclid=abc&keep=1`,
    );
    await h.until((s) => s.tabs[0].url === `${origin}/start?keep=1`);
    assert.equal((await h.snapshot()).tabs[0].removedParameters, 2);
    check("Real navigation tracking-parameter removal and exact counter");
    assert.equal(
      await h.evalGuest(id, "window.autoplayResult", false),
      "NotAllowedError",
    );
    check("Unmuted autoplay requires user activation");
    await h.evalGuest(id, `Promise.all([v.play(), a.play()])`);
    await sleep(500);
    assert.equal(
      await h.evalGuest(
        id,
        "v.currentTime > 0 && a.currentTime > 0 && !v.paused",
      ),
      true,
    );
    await h.evalGuest(
      id,
      "v.pause(); a.pause(); v.currentTime=1; v.volume=0.25; v.muted=true;",
    );
    await sleep(200);
    assert.equal(
      await h.evalGuest(
        id,
        "v.paused && v.muted && v.volume===0.25 && Math.abs(v.currentTime-1)<0.2",
      ),
      true,
    );
    await h.evalGuest(id, "v.play()");
    check("HTML5 video/audio play, pause, seek, volume and muted playback");
    const pip = await h.evalGuest(
      id,
      `v.requestPictureInPicture().then(() => document.pictureInPictureElement===v).catch(e=>e.name+': '+e.message)`,
    );
    assert.equal(pip, true);
    await h.evalGuest(id, "document.exitPictureInPicture()");
    check("Native Chromium video Picture in Picture enters and exits");
    await h.app.evaluate(({ dialog }) => {
      globalThis.alphaPrompts = [];
      dialog.showMessageBox = async (_w, options) => {
        globalThis.alphaPrompts.push(options);
        return { response: 1 };
      };
    });
    const full = await h.evalGuest(
      id,
      "v.requestFullscreen().then(()=>document.fullscreenElement===v).catch(e=>e.message)",
    );
    assert.equal(full, true);
    await sleep(300);
    const size = await h.app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0];
      return {
        bounds: w.contentView.children.find((v) => v.getVisible()).getBounds(),
        size: w.getContentSize(),
      };
    });
    assert.equal(size.bounds.x, 0);
    assert.equal(size.bounds.y, 0);
    assert.equal(size.bounds.width, size.size[0]);
    await h.evalGuest(id, "document.exitFullscreen()");
    check("Fullscreen video fills native window and exits");
    const firstId = id;
    id = await h.navigate(`${origin}/second-media`, false);
    await h.evalGuest(id, "v.muted=true; v.play()");
    assert.equal(await h.evalGuest(firstId, "v.muted"), true);
    assert.equal(await h.evalGuest(id, "v.paused"), false);
    check("Independent controls in multiple media tabs");
    // Request matching is verified by the actual session interceptor, not by a painted counter.
    await h.evalGuest(
      id,
      `Promise.all([fetch('https://www.google-analytics.com/collect').catch(()=>null),fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').catch(()=>null)])`,
    );
    let state = await h.snapshot(),
      tab = state.tabs.find((t) => t.id === state.activeTabId);
    assert.ok(tab.blockedTrackers > 0);
    assert.ok(tab.blockedAds > 0);
    check(
      "EasyList ads and EasyPrivacy trackers are blocked and counted separately",
    );
    await h.command({ type: "toggle-site-protection" });
    state = await h.snapshot();
    assert.equal(
      state.tabs.find((t) => t.id === state.activeTabId).protectionEnabled,
      false,
    );
    assert.ok(state.settings.siteExceptions.includes("127.0.0.1"));
    await h.command({ type: "toggle-site-protection" });
    check("Site protection exception toggles and persists only normal sites");
    await h.command({ type: "settings", settings: { theme: "light" } });
    await h.page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    const normalColor = await h.page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    id = await h.navigate(`${origin}/private`, true);
    await h.page.waitForFunction(
      () => document.documentElement.dataset.private === "true",
    );
    assert.notEqual(
      await h.page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
      normalColor,
    );
    await h.page.screenshot({ path: "test-results/private-alpha.png" });
    await h.evalGuest(
      id,
      `(async()=>{ document.cookie='secret=1';localStorage.secret='1';sessionStorage.secret='1';await new Promise((resolve,reject)=>{const r=indexedDB.open('alpha-secret',1);r.onupgradeneeded=()=>r.result.createObjectStore('secret');r.onsuccess=()=>{r.result.close();resolve()};r.onerror=reject});await caches.open('alpha-secret').then(c=>c.put('/secret-cache',new Response('secret')));})()`,
    );
    assert.equal(
      await h.app.evaluate(
        ({ webContents }, id) => webContents.fromId(id).session.isPersistent(),
        id,
      ),
      false,
    );
    await h.command({ type: "toggle-site-protection" });
    const privateTab = (await h.snapshot()).activeTabId;
    await h.command({ type: "close-tab", id: privateTab });
    await h.page.waitForFunction(
      () => document.documentElement.dataset.private === "false",
    );
    assert.equal(
      await h.page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
      normalColor,
    );
    id = await h.navigate(`${origin}/private-again`, true);
    assert.deepEqual(
      await h.evalGuest(
        id,
        `(async()=>({cookie:document.cookie,local:localStorage.getItem('secret'),session:sessionStorage.getItem('secret'),dbs:(await indexedDB.databases()).map(d=>d.name),caches:await caches.keys()}))()`,
      ),
      { cookie: "", local: null, session: null, dbs: [], caches: [] },
    );
    assert.equal(
      (await h.snapshot()).tabs.find((t) => t.private).protectionEnabled,
      true,
    );
    check(
      "Private memory partition clears cookies, local/session storage, IndexedDB, CacheStorage and site exceptions; normal colors restore",
    );
    await h.command({
      type: "settings",
      settings: { restoreSession: true, theme: "midnight" },
    });
    await sleep(700);
    const saved = JSON.parse(
      fs.readFileSync(path.join(h.profile, "browser-data.json"), "utf8"),
    );
    assert.ok(saved.session.urls.every((u) => !u.includes("private")));
    const profile = h.profile;
    // Real forced termination: no window close/dispose handlers run.
    const pid = await h.app.evaluate(() => process.pid);
    if (process.platform === "win32")
      require("node:child_process").spawnSync("taskkill", [
        "/PID",
        String(pid),
        "/T",
        "/F",
      ]);
    else {
      // SIGKILL skips dispose, matching a forced termination. Child processes
      // must die too; otherwise they keep the profile lock and the next launch hangs.
      const killTree = (target) => {
        let children = "";
        try {
          children = fs.readFileSync(
            `/proc/${target}/task/${target}/children`,
            "utf8",
          );
        } catch {
          /* The process has already exited. */
        }
        for (const child of children.trim().split(/\s+/).filter(Boolean))
          killTree(Number(child));
        try {
          process.kill(target, "SIGKILL");
        } catch {
          /* Already gone. */
        }
      };
      killTree(pid);
    }
    await sleep(1500);
    h = await launch(profile);
    state = await h.snapshot();
    assert.ok(state.tabs.length >= 2);
    assert.ok(
      state.tabs.every((t) => !t.private && !t.url.includes("private")),
    );
    check(
      "Forced app termination restores normal tabs only from atomic persisted snapshot",
    );
    await h.command({
      type: "viewport",
      bounds: { x: 200, y: 100, width: 800, height: 500 },
      visible: true,
    });
    id = await h.active();
    await h.app.evaluate(
      ({ webContents }, id) => webContents.fromId(id).forcefullyCrashRenderer(),
      id,
    );
    await h.until((s) =>
      s.tabs
        .find((t) => t.id === s.activeTabId)
        .error?.includes("unexpectedly"),
    );
    await h.command({ type: "reload" });
    await h.until((s) => {
      const t = s.tabs.find((t) => t.id === s.activeTabId);
      return !t.error && !t.isLoading;
    });
    check("Guest renderer crash presents error and user reload recovers");
    await h.page.getByRole("button", { name: "About", exact: true }).click();
    await h.page.getByText("0.1.0-alpha.1", { exact: true }).waitFor();
    await h.page.screenshot({ path: "test-results/about-alpha.png" });
    check("Local About shows actual runtime versions and Alpha release");
  } finally {
    fs.writeFileSync(
      "test-results/alpha-results.json",
      JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
    );
    await h.app.close().catch(() => {});
    server.closeAllConnections();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
