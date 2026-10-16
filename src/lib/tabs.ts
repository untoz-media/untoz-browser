export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
}

export interface TabsState {
  tabs: BrowserTab[];
  activeTabId: string | null;
}

export function createTabId(random: () => number = Math.random): string {
  const suffix = Math.floor(Math.abs(random()) * 1e12).toString(36);
  return `t${suffix || '0'}`;
}

export function addTab(state: TabsState, tab: BrowserTab): TabsState {
  return {
    tabs: [...state.tabs, tab],
    activeTabId: tab.id,
  };
}

export function removeTab(state: TabsState, id: string): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return state;
  const tabs = state.tabs.filter((tab) => tab.id !== id);
  if (state.activeTabId !== id) {
    return { tabs, activeTabId: state.activeTabId };
  }
  const neighbor = tabs[index] ?? tabs[index - 1] ?? null;
  return { tabs, activeTabId: neighbor ? neighbor.id : null };
}

export function updateTab(state: TabsState, id: string, updates: Partial<BrowserTab>): TabsState {
  return {
    ...state,
    tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, ...updates, id: tab.id } : tab)),
  };
}
