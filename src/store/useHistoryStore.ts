import { create } from 'zustand';
import { clearHistory, recordVisit, type HistoryEntry } from '@/lib/history';
import { createTabId } from '@/lib/tabs';
import { browserStorage, readJson, writeJson } from '@/lib/storage';

const STORAGE_KEY = 'untoz.history';

interface HistoryStore {
  entries: HistoryEntry[];
  recordVisit: (url: string, title: string) => void;
  clearHistory: () => void;
}

function persist(entries: HistoryEntry[]) {
  writeJson(browserStorage(), STORAGE_KEY, entries);
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: readJson<HistoryEntry[]>(browserStorage(), STORAGE_KEY, []),
  recordVisit: (url, title) => {
    set((state) => {
      const entries = recordVisit(state.entries, {
        id: createTabId(),
        url,
        title: title || url,
        visitedAt: Date.now(),
      });
      persist(entries);
      return { entries };
    });
  },
  clearHistory: () => {
    const entries = clearHistory();
    persist(entries);
    set({ entries });
  },
}));
