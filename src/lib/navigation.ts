export const NEW_TAB_URL = 'untoz://newtab';

export const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
} as const;

export type SearchEngineId = keyof typeof SEARCH_ENGINES;

export const DEFAULT_HOMEPAGE = 'https://www.untoz.com';
export const DEFAULT_SEARCH_ENGINE: SearchEngineId = 'google';

const HOST_LIKE =
  /^(localhost|(\d{1,3}\.){3}\d{1,3}|[\w.-]+\.[a-z]{2,})(:\d+)?([/?#].*)?$/i;
const DANGEROUS_SCHEME = /^(javascript|data|file|blob|chrome|chrome-extension|vbscript|about|mailto|view-source):/i;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isInternalUrl(value: string): boolean {
  return value === NEW_TAB_URL;
}

export function resolveAddress(
  value: string,
  searchEngine: SearchEngineId = DEFAULT_SEARCH_ENGINE
): string | null {
  const input = value.trim();
  if (!input) return null;
  if (isInternalUrl(input)) return input;

  if (input.includes('://') || DANGEROUS_SCHEME.test(input)) {
    return isHttpUrl(input) ? input : null;
  }

  if (HOST_LIKE.test(input) && !/\s/.test(input)) {
    const withScheme = `https://${input}`;
    return isHttpUrl(withScheme) ? withScheme : null;
  }

  const base = SEARCH_ENGINES[searchEngine] ?? SEARCH_ENGINES.google;
  return `${base}${encodeURIComponent(input)}`;
}

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function sanitizeBounds(value: unknown): ViewBounds | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const x = candidate.x;
  const y = candidate.y;
  const width = candidate.width;
  const height = candidate.height;
  if (![x, y, width, height].every((item) => typeof item === 'number' && Number.isFinite(item))) {
    return null;
  }
  return {
    x: Math.max(0, Math.round(x as number)),
    y: Math.max(0, Math.round(y as number)),
    width: Math.max(0, Math.round(width as number)),
    height: Math.max(0, Math.round(height as number)),
  };
}

export function isSafeTabId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

export interface NavigateRequest {
  tabId: string;
  url: string;
}

export function readNavigateRequest(payload: unknown, activeTabId: string | null): NavigateRequest | null {
  if (typeof payload === 'string') {
    if (!activeTabId || !isHttpUrl(payload)) return null;
    return { tabId: activeTabId, url: payload };
  }
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.url !== 'string' || !isHttpUrl(candidate.url)) return null;
  const tabId = typeof candidate.tabId === 'string' ? candidate.tabId : activeTabId;
  if (!tabId || !isSafeTabId(tabId)) return null;
  return { tabId, url: candidate.url };
}
