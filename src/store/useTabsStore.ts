import { create } from 'zustand';
import { DEFAULT_HOMEPAGE } from '@/lib/navigation';
import { addTab as addTabState, createTabId, removeTab as removeTabState, updateTab as updateTabState, type BrowserTab } from '@/lib/tabs';

interface TabsStore {
  tabs: BrowserTab[];
  activeTabId: string | null;
  addTab: (url: string, title?: string) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<BrowserTab>) => void;
}

export const useTabsStore = create<TabsStore>((set) => ({
  tabs: [{ id: '1', url: DEFAULT_HOMEPAGE, title: 'Untoz' }],
  activeTabId: '1',
  addTab: (url, title = 'Nova aba') => {
    const id = createTabId();
    set((state) => addTabState(state, { id, url, title }));
    return id;
  },
  removeTab: (id) => {
    set((state) => removeTabState(state, id));
  },
  setActiveTab: (id) => {
    set({ activeTabId: id });
  },
  updateTab: (id, updates) => {
    set((state) => updateTabState(state, id, updates));
  },
}));
