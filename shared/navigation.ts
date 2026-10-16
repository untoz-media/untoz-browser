import { NEW_TAB, type Settings } from "./browser";
import { SEARCH_ENGINES } from "./search";
export function isInlineFavicon(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 24 * 1024 &&
    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value)
  );
}
export function isWebUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
export function resolveNavigateInput(
  input: string,
  engine: Settings["searchEngine"] = "duckduckgo",
): string | null {
  const value = input.trim();
  if (!value || value.length > 8192) return null;
  if (value === NEW_TAB || value === "about:blank") return NEW_TAB;
  const local =
    /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|\[[a-f\d:]+\])(?::\d+)?(?:[/?#].*)?$/i;
  if (local.test(value))
    return isWebUrl(`http://${value}`) ? new URL(`http://${value}`).href : null;
  if (
    /^[a-z][a-z\d+.-]*:/i.test(value) &&
    !/^[^\s/:]+\.\w+:\d+(?:[/?#]|$)/.test(value)
  ) {
    return isWebUrl(value) ? new URL(value).href : null;
  }
  const host = value.replace(/^\/\//, "");
  if (
    !/\s/.test(host) &&
    /^[^/:?#]+\.[^/:?#]+(?::\d+)?(?:[/?#].*)?$/.test(host)
  ) {
    return isWebUrl(`https://${host}`) ? new URL(`https://${host}`).href : null;
  }
  const base = SEARCH_ENGINES[engine].queryURL;
  return base + encodeURIComponent(value);
}
const TRACKING_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
]);
/** Preserve signed URLs and the original encoding/order of all unrelated query data. */
export function stripTrackingParameters(value: string): string {
  if (!isWebUrl(value)) return value;
  const url = new URL(value);
  if (
    [...url.searchParams.keys()].some((k) =>
      /signature|^sig$|^x-amz-|^x-goog-/i.test(k),
    )
  )
    return value;
  const hashIndex = value.indexOf("#");
  const base = hashIndex < 0 ? value : value.slice(0, hashIndex);
  const hash = hashIndex < 0 ? "" : value.slice(hashIndex);
  const q = base.indexOf("?");
  if (q < 0) return value;
  const parts = base.slice(q + 1).split("&");
  const filtered = parts.filter((p) => {
    try {
      return !TRACKING_KEYS.has(
        decodeURIComponent(p.split("=")[0]).toLowerCase(),
      );
    } catch {
      return true;
    }
  });
  return filtered.length === parts.length
    ? value
    : base.slice(0, q) +
        (filtered.length ? "?" + filtered.join("&") : "") +
        hash;
}
export const TRACKER_HOSTS = [
  "doubleclick.net",
  "google-analytics.com",
  "googlesyndication.com",
  "scorecardresearch.com",
  "connect.facebook.net",
  "hotjar.com",
  "clarity.ms",
];
export function isTracker(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return TRACKER_HOSTS.some(
      (domain) => host === domain || host.endsWith("." + domain),
    );
  } catch {
    return false;
  }
}
