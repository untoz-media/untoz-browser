const { _electron: electron } = require("playwright-core");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(
  profile = fs.mkdtempSync(path.join(os.tmpdir(), "untoz-alpha-")),
) {
  const env = { ...process.env, UNTOZ_TEST_PROFILE: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  const app = await electron.launch({
    args: ["."],
    cwd: process.cwd(),
    env,
    timeout: 30000,
  });
  const page = await app.firstWindow();
  await page.waitForFunction(() => !!window.untozBrowser);
  const command = (c) =>
    page.evaluate((c) => window.untozBrowser.command(c), c);
  const snapshot = () => page.evaluate(() => window.untozBrowser.snapshot());
  const until = async (predicate) => {
    for (let i = 0; i < 200; i++) {
      const s = await snapshot();
      if (predicate(s)) return s;
      await sleep(100);
    }
    throw new Error("Timed out waiting for browser state");
  };
  const active = () =>
    app.evaluate(({ BrowserWindow }) => {
      const view = BrowserWindow.getAllWindows()[0].contentView.children.find(
        (v) => v.getVisible(),
      );
      return view?.webContents?.id;
    });
  const evalGuest = (id, code, gesture = true) =>
    app.evaluate(
      ({ webContents }, { id, code, gesture }) =>
        webContents.fromId(id).executeJavaScript(code, gesture),
      { id, code, gesture },
    );
  const navigate = async (url, privateTab) => {
    await command(
      privateTab === undefined
        ? { type: "navigate", input: url }
        : { type: "new-tab", url, private: privateTab },
    );
    await until((s) => {
      const t = s.tabs.find((t) => t.id === s.activeTabId);
      return (
        !t.isLoading &&
        (t.error || t.url === url || t.title !== new URL(url).hostname)
      );
    });
    await sleep(250);
    return active();
  };
  return {
    app,
    page,
    profile,
    command,
    snapshot,
    until,
    active,
    evalGuest,
    navigate,
  };
}
module.exports = { launch, sleep };
