// Explicit developer action only; never runs on browser startup.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { FiltersEngine } = require("@ghostery/adblocker");
(async () => {
  const folder = path.resolve("resources/filters");
  fs.mkdirSync(folder, { recursive: true });
  const manifest = {
    fetchedAt: new Date().toISOString(),
    engine: require("@ghostery/adblocker/package.json").version,
    lists: [],
  };
  for (const name of ["easylist", "easyprivacy"]) {
    const url = `https://easylist.to/easylist/${name}.txt`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const data = await response.text();
    if (
      !data.startsWith("[Adblock") ||
      data.length < 10000 ||
      data.length > 15000000
    )
      throw new Error("Unexpected filter list");
    const engine = FiltersEngine.parse(data, {
      loadCosmeticFilters: false,
      loadCSPFilters: false,
      enableHtmlFiltering: false,
      enableInMemoryCache: false,
    });
    const binary = Buffer.from(engine.serialize());
    fs.writeFileSync(path.join(folder, `${name}.txt`), data);
    fs.writeFileSync(path.join(folder, `${name}.bin`), binary);
    manifest.lists.push({
      name,
      url,
      bytes: binary.length,
      sha256: crypto.createHash("sha256").update(binary).digest("hex"),
      sourceSha256: crypto.createHash("sha256").update(data).digest("hex"),
    });
  }
  fs.writeFileSync(
    path.join(folder, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(manifest);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
