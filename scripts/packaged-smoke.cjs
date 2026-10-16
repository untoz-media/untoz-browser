const { _electron: electron } = require("playwright-core");
const { mkdtempSync } = require("node:fs");
const { join, resolve } = require("node:path");
const { tmpdir } = require("node:os");
(async () => {
  const profile = mkdtempSync(join(tmpdir(), "untoz-packaged-"));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  const app = await electron.launch({
    executablePath: resolve("release/win-unpacked/Untoz Browser.exe"),
    args: [`--user-data-dir=${profile}`],
    env,
  });
  try {
    const page = await app.firstWindow();
    await page
      .getByRole("heading", {
        name: /Good (morning|afternoon|evening), Luis\./,
      })
      .waitFor();
    const state = await page.evaluate(() => window.untozBrowser.snapshot());
    if (state.tabs.length !== 1 || state.tabs[0].url !== "untoz://newtab")
      throw new Error("Packaged startup failed");
    console.log(
      "PASS Packaged Windows executable launches with local UI and working IPC",
    );
    await page.evaluate(() =>
      window.untozBrowser.command({ type: "window", action: "close" }),
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
