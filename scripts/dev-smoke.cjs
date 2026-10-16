const { spawn } = require("node:child_process");
const { mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { _electron: electron } = require("playwright-core");
(async () => {
  const profile = mkdtempSync(join(tmpdir(), "untoz-dev-"));
  const env = {
    ...process.env,
    UNTOZ_DEV_NO_LAUNCH: "1",
    UNTOZ_TEST_PROFILE: profile,
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  vite.stdout.on("data", (d) => {
    output += d;
  });
  vite.stderr.on("data", (d) => {
    output += d;
  });
  let app;
  try {
    const end = Date.now() + 30000;
    while (Date.now() < end && !output.includes("dist-electron/preload.js"))
      await new Promise((r) => setTimeout(r, 150));
    if (!output.includes("dist-electron/preload.js")) throw new Error(output);
    app = await electron.launch({
      args: ["."],
      env: { ...env, VITE_DEV_SERVER_URL: "http://127.0.0.1:3000/" },
    });
    const page = await app.firstWindow();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.getByRole("heading", { name: "Untoz Browser" }).waitFor();
    const state = await page.evaluate(() => window.untozBrowser.snapshot());
    if (state.tabs.length !== 1 || errors.length)
      throw new Error(errors.join("\n") || "No initial tab");
    const sandboxed = await app.evaluate(
      ({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
          .sandbox,
    );
    if (!sandboxed) throw new Error("Sandbox disabled");
    console.log(
      "PASS Vite development startup, React refresh preamble, preload IPC and sandbox",
    );
    await page.evaluate(() =>
      window.untozBrowser.command({ type: "window", action: "close" }),
    );
  } finally {
    if (app) await app.close().catch(() => {});
    vite.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
