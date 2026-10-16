const { launch, sleep } = require("./alpha-harness.cjs");
const fs = require("node:fs");
(async () => {
  const h = await launch();
  const rows = [];
  const sites = [
    [
      "YouTube",
      "https://www.youtube.com/",
      "https://accounts.google.com/ServiceLogin",
    ],
    ["Twitch", "https://www.twitch.tv/", "https://www.twitch.tv/login"],
    [
      "Spotify Web",
      "https://open.spotify.com/",
      "https://accounts.spotify.com/login",
    ],
    [
      "Google Docs",
      "https://docs.google.com/",
      "https://accounts.google.com/ServiceLogin",
    ],
    ["Reddit", "https://www.reddit.com/", "https://www.reddit.com/login/"],
    ["X", "https://x.com/", "https://x.com/i/flow/login"],
    ["Discord Web", "https://discord.com/app", "https://discord.com/login"],
    ["Untoz", "https://untoz.site/", null],
    ["Untoz+", "https://untozplus.com/", null],
  ];
  try {
    for (const [name, url, auth] of sites) {
      for (const [kind, address] of [
        ["landing", url],
        ["authentication", auth],
      ]) {
        if (!address) continue;
        await h.command({ type: "navigate", input: address });
        await sleep(6000);
        const state = await h.snapshot();
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        let dom;
        try {
          const id = await h.active();
          if (id)
            dom = await h.evalGuest(
              id,
              `(() => { const before = scrollY; scrollBy(0, 400); return { title: document.title, text: document.body?.innerText.slice(0, 500), inputs: document.querySelectorAll('input').length, videos: document.querySelectorAll('video').length, scrollHeight: document.documentElement.scrollHeight, before }; })()`,
            );
        } catch (error) {
          dom = { error: String(error) };
        }
        const result = {
          name,
          kind,
          requested: address,
          final: tab.url,
          loading: tab.isLoading,
          error: tab.error,
          blockedAds: tab.blockedAds,
          blockedTrackers: tab.blockedTrackers,
          dom,
        };
        rows.push(result);
        console.log(JSON.stringify(result));
        // No credentials, messages, uploads or acceptance clicks are submitted to real sites.
      }
    }
  } finally {
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync(
      "test-results/website-compat.json",
      JSON.stringify(
        {
          at: new Date().toISOString(),
          mode: "unauthenticated landing/auth page observations, 6s per URL",
          rows,
        },
        null,
        2,
      ),
    );
    await h.app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
