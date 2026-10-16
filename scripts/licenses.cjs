const fs = require("node:fs");
const path = require("node:path");
const lock = require("../package-lock.json");
let text = `UNTOZ BROWSER — THIRD-PARTY NOTICES\n\nUntoz Browser: MIT, Copyright 2026 Untoz.\nElectron/Chromium notices also ship as LICENSE.electron.txt and LICENSES.chromium.html beside the executable.\n\nEasyList and EasyPrivacy\nCopyright: their respective contributors.\nSource: https://easylist.to/easylist/easylist.txt and https://easylist.to/easylist/easyprivacy.txt\nLicense chosen: Creative Commons Attribution-ShareAlike 3.0 Unported.\nhttps://creativecommons.org/licenses/by-sa/3.0/legalcode\nThe original source lists, headers and manifest are included in resources/filters in the application archive.\nSerialized .bin files are network-only transformations made by Untoz using Ghostery 2.18.2.\nThe filter-list sources and their transformed binaries remain under CC BY-SA 3.0.\nNo endorsement is implied.\n\nGhostery/MPL covered source is unmodified and available at:\nhttps://www.npmjs.com/package/@ghostery/adblocker/v/2.18.2\nhttps://github.com/ghostery/adblocker\n\n`;
for (const [folder, pkg] of Object.entries(lock.packages)) {
  if (!folder || pkg.dev || !folder.startsWith("node_modules/")) continue;
  const packageFile = path.join(folder, "package.json");
  if (!fs.existsSync(packageFile)) continue;
  const meta = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  text += `\n${"=".repeat(60)}\n${meta.name} ${meta.version} — ${meta.license || "See license below"}\n`;
  for (const name of fs
    .readdirSync(folder)
    .filter((name) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(name))) {
    if (fs.statSync(path.join(folder, name)).isFile())
      text += `\n${name}\n${fs.readFileSync(path.join(folder, name), "utf8")}\n`;
  }
}
fs.mkdirSync("resources/licenses", { recursive: true });
fs.writeFileSync("resources/licenses/THIRD-PARTY-NOTICES.txt", text);
console.log(
  "License notices generated from installed production dependency tree",
);
