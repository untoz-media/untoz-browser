const { launch, sleep } = require("./alpha-harness.cjs");
const https = require("node:https");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
(async () => {
  fs.mkdirSync("test-results/tls", { recursive: true });
  const openssl =
    process.env.OPENSSL ||
    (process.platform === "win32"
      ? "C:/Program Files/Git/usr/bin/openssl.exe"
      : "openssl");
  const cert = spawnSync(
    openssl,
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      "test-results/tls/key.pem",
      "-out",
      "test-results/tls/cert.pem",
      "-days",
      "2",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost",
    ],
    { encoding: "utf8" },
  );
  if (cert.status !== 0)
    throw new Error(
      "OpenSSL is required for the isolated self-signed TLS test. Set OPENSSL to its executable path.",
    );
  let hits = 0;
  const server = https.createServer(
    {
      key: fs.readFileSync("test-results/tls/key.pem"),
      cert: fs.readFileSync("test-results/tls/cert.pem"),
    },
    (_req, res) => {
      hits++;
      res.end("MUST NOT LOAD");
    },
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const h = await launch();
  const results = [];
  try {
    for (const [name, url, expectBlocked] of [
      ["valid", "https://example.com/", false],
      ["self-signed", `https://localhost:${server.address().port}/`, true],
      ["expired", "https://expired.badssl.com/", true],
      ["hostname mismatch", "https://wrong.host.badssl.com/", true],
    ]) {
      await h.command({ type: "navigate", input: url });
      await sleep(5000);
      const s = await h.snapshot(),
        t = s.tabs.find((t) => t.id === s.activeTabId);
      const result = {
        name,
        url,
        error: t.error,
        title: t.title,
        loading: t.isLoading,
      };
      results.push(result);
      if (expectBlocked) assert.match(t.error || "", /certificate/);
      else assert.equal(t.error, undefined);
      console.log("PASS TLS", JSON.stringify(result));
    }
    assert.equal(hits, 0);
  } finally {
    fs.writeFileSync(
      "test-results/tls-results.json",
      JSON.stringify(results, null, 2),
    );
    await h.app.close();
    server.closeAllConnections();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
