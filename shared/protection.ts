import { isWebUrl } from "./navigation";

const MULTI_PART_SUFFIXES = [
  "co.uk",
  "org.uk",
  "com.au",
  "co.jp",
  "com.br",
  "co.nz",
  "com.mx",
  "co.za",
  "com.pt",
];

export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0"
  );
}

/** Upgrade a public http page to https. Loopback stays on http so local tools keep working. */
export function upgradeToHttps(value: string): string | null {
  if (!isWebUrl(value)) return null;
  const url = new URL(value);
  if (url.protocol !== "http:") return null;
  if (isLoopbackHost(url.hostname)) return null;
  url.protocol = "https:";
  return url.href;
}

export function siteKey(hostname: string): string {
  const host = hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
  if (
    isLoopbackHost(host) ||
    host.includes(":") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  )
    return host;
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const lastThree = parts.slice(-3).join(".");
  if (MULTI_PART_SUFFIXES.some((suffix) => lastThree.endsWith("." + suffix)))
    return lastThree;
  return parts.slice(-2).join(".");
}

export function isThirdPartyRequest(
  requestUrl: string,
  documentUrl: string,
): boolean {
  try {
    if (!isWebUrl(requestUrl) || !isWebUrl(documentUrl)) return false;
    return (
      siteKey(new URL(requestUrl).hostname) !==
      siteKey(new URL(documentUrl).hostname)
    );
  } catch {
    return false;
  }
}
