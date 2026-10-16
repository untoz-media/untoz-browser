import { FiltersEngine, Request } from "@ghostery/adblocker";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export class NetworkFilters {
  readonly ads: FiltersEngine;
  readonly trackers: FiltersEngine;
  readonly updated: string;
  constructor(folder: string) {
    const manifest = JSON.parse(
      readFileSync(join(folder, "manifest.json"), "utf8"),
    ) as { fetchedAt: string; lists: { name: string; sha256: string }[] };
    const load = (name: string) => {
      const data = readFileSync(join(folder, `${name}.bin`));
      if (
        createHash("sha256").update(data).digest("hex") !==
        manifest.lists.find((l) => l.name === name)?.sha256
      )
        throw new Error("Filter integrity check failed");
      return FiltersEngine.deserialize(data);
    };
    this.ads = load("easylist");
    this.trackers = load("easyprivacy");
    this.updated = manifest.fetchedAt;
  }
  match(
    url: string,
    sourceUrl: string,
    type: Electron.OnBeforeRequestListenerDetails["resourceType"],
    ads: boolean,
    trackers: boolean,
  ): "ads" | "trackers" | undefined {
    const request = Request.fromRawDetails({ url, sourceUrl, type });
    // Attribute overlap to trackers once. Per-list exceptions remain respected by each engine.
    if (trackers && this.trackers.match(request).match) return "trackers";
    if (ads && this.ads.match(request).match) return "ads";
    return undefined;
  }
}
