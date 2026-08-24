import { create } from 'zustand';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
}

interface TabsStore {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (url: string, title?: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [
    { id: '1', url: 'https://www.untoz.com', title: 'Untoz' },
  ],
  activeTabId: '1',
  addTab: (url, title = 'New Tab') => {
    const id = Math.random().toString(36).substr(2, 9);
    set(state => {
      const newTab = { id, url, title };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: id,
      };
    });
  },
  removeTab: (id) => {
    set(state => {
      const tabs = state.tabs.filter(tab => tab.id !== id);
      let activeTabId = state.activeTabId;
      if (activeTabId === id) {
        // activate the next tab, or the previous if none
        const remaining = tabs.find(t => t.id !== id);
        activeTabId = remaining ? remaining.id : null;
      }
      return { tabs, activeTabId };
    });
  },
  setActiveTab: (id) => {
    set({ activeTabId: id });
  },
  updateTab: (id, updates) => {
    set(state => ({
      tabs: state.tabs.map(tab =>
        tab.id === id ? { ...tab, ...updates } : tab
      ),
    }));
  },
}));