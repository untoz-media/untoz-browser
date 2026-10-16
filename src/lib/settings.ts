import {
  DEFAULT_HOMEPAGE,
  DEFAULT_SEARCH_ENGINE,
  SEARCH_ENGINES,
  isHttpUrl,
  type SearchEngineId,
} from '@/lib/navigation';

export interface BrowserSettings {
  homepage: string;
  searchEngine: SearchEngineId;
}

export const DEFAULT_SETTINGS: BrowserSettings = {
  homepage: DEFAULT_HOMEPAGE,
  searchEngine: DEFAULT_SEARCH_ENGINE,
};

export function sanitizeSettings(value: unknown): BrowserSettings {
  const candidate = value && typeof value === 'object' ? (value as Partial<BrowserSettings>) : {};
  const homepage =
    typeof candidate.homepage === 'string' && isHttpUrl(candidate.homepage)
      ? candidate.homepage
      : DEFAULT_SETTINGS.homepage;
  const searchEngine =
    typeof candidate.searchEngine === 'string' && candidate.searchEngine in SEARCH_ENGINES
      ? (candidate.searchEngine as SearchEngineId)
      : DEFAULT_SETTINGS.searchEngine;
  return { homepage, searchEngine };
}
