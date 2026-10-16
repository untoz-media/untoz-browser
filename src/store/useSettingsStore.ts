import { create } from 'zustand';
import type { SearchEngineId } from '@/lib/navigation';
import { DEFAULT_SETTINGS, sanitizeSettings, type BrowserSettings } from '@/lib/settings';
import { browserStorage, readJson, writeJson } from '@/lib/storage';

const STORAGE_KEY = 'untoz.settings';

interface SettingsStore extends BrowserSettings {
  setHomepage: (homepage: string) => boolean;
  setSearchEngine: (searchEngine: SearchEngineId) => void;
}

function persist(settings: BrowserSettings) {
  writeJson(browserStorage(), STORAGE_KEY, settings);
}

const initial = sanitizeSettings(readJson(browserStorage(), STORAGE_KEY, DEFAULT_SETTINGS));

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...initial,
  setHomepage: (homepage) => {
    const next = sanitizeSettings({ ...get(), homepage });
    if (next.homepage !== homepage) return false;
    set(next);
    persist(next);
    return true;
  },
  setSearchEngine: (searchEngine) => {
    const next = sanitizeSettings({ ...get(), searchEngine });
    set(next);
    persist({ homepage: next.homepage, searchEngine: next.searchEngine });
  },
}));
