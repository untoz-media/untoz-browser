const { launch, sleep } = require("./alpha-harness.cjs");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
(async () => {
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<title>Benchmark ${req.url}</title><style>body{font:16px system-ui;max-width:1000px;margin:auto}article{padding:12px;border-bottom:1px solid #ccc}</style><h1>Local article/dashboard fixture</h1><input placeholder="Search">${Array.from({ length: 300 }, (_, i) => `<article><h2>Article ${i}</h2><p>Repeatable local content with links and text. No network variability.</p><a href="/next">Read more</a></article>`).join("")}<script>window.tickCount=0;window.fixtureTimer=setInterval(()=>window.tickCount++,1000)</script>`,
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const h = await launch();
  const rows = [];
  try {
    for (let count = 1; count <= 20; count++) {
      await h.navigate(`${origin}/${count}`, count === 1 ? undefined : false);
      if (![1, 5, 10, 20].includes(count)) continue;
      await sleep(2500);
      const samples = [];
      for (let i = 0; i < 3; i++) {
        samples.push(
          await h.app.evaluate(
            ({ app, webContents, session, BrowserWindow }) => ({
              metrics: app
                .getAppMetrics()
                .map((m) => ({
                  pid: m.pid,
                  type: m.type,
                  workingSetKB: m.memory.workingSetSize,
                  privateKB: m.memory.privateBytes,
                  cpu: m.cpu.percentCPUUsage,
                })),
              webContents: webContents.getAllWebContents().length,
              listeners: webContents
                .getAllWebContents()
                .map((w) => ({
                  type: w.getType(),
                  id: w.id,
                  count: w
                    .eventNames()
                    .reduce((n, event) => n + w.listenerCount(event), 0),
                })),
              downloadListeners: session
                .fromPartition("persist:untoz-browser")
                .listenerCount("will-download"),
              ownedViews:
                BrowserWindow.getAllWindows()[0].contentView.children.length,
            }),
          ),
        );
        await sleep(1000);
      }
      const row = { tabs: count, samples };
      rows.push(row);
      console.log(
        `MEASURED ${count} tabs: ${samples.map((s) => (s.metrics.reduce((n, m) => n + m.workingSetKB, 0) / 1024).toFixed(1)).join(", ")} MiB summed working set`,
      );
    }
    const s = await h.snapshot();
    for (const t of s.tabs.slice(1))
      await h.command({ type: "close-tab", id: t.id });
    await sleep(2000);
    rows.push({
      afterClosingToOne: await h.app.evaluate(
        ({ webContents, BrowserWindow }) => ({
          webContents: webContents.getAllWebContents().length,
          ownedViews:
            BrowserWindow.getAllWindows()[0].contentView.children.length,
        }),
      ),
    });
  } finally {
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync(
      "test-results/benchmark.json",
      JSON.stringify(
        {
          at: new Date().toISOString(),
          cpu: os.cpus()[0].model,
          totalMemoryGiB: os.totalmem() / 1024 ** 3,
          platform: os.release(),
          method:
            "3 samples after 2.5s settling; main+GPU+utility+renderers; working sets double-count shared pages; isolated profile; 300-article local fixture with one deliberate 1Hz timer per page; not real-world media workload",
          rows,
        },
        null,
        2,
      ),
    );
    await h.app.close();
    server.closeAllConnections();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
