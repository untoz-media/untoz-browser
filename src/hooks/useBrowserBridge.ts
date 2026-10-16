import { useEffect, useRef } from 'react';
import { isHttpUrl } from '@/lib/navigation';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useTabsStore } from '@/store/useTabsStore';

export function useBrowserBridge(visible: boolean) {
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const updateTab = useTabsStore((state) => state.updateTab);
  const addTab = useTabsStore((state) => state.addTab);
  const recordVisit = useHistoryStore((state) => state.recordVisit);
  const active = tabs.find((tab) => tab.id === activeTabId) ?? null;
  const requested = useRef(new Map<string, string>());
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const browser = window.untozBrowser;
    if (!browser) return;

    const unsubscribeNavigation = browser.onNavigationState((state) => {
      const webUrl = isHttpUrl(state.url);
      if (webUrl) requested.current.set(state.tabId, state.url);
      updateTab(state.tabId, {
        ...(webUrl ? { url: state.url } : {}),
        title: state.title || 'Nova aba',
        canGoBack: state.canGoBack,
        canGoForward: state.canGoForward,
        isLoading: state.isLoading,
      });
      if (!state.isLoading && webUrl) recordVisit(state.url, state.title || state.url);
    });
    const unsubscribeFavicon = browser.onFavicon((update) => {
      if (update.favicon) updateTab(update.tabId, { favicon: update.favicon });
    });
    const unsubscribeOpen = browser.onOpenUrl((url) => {
      if (isHttpUrl(url)) addTab(url, 'Nova aba');
    });

    return () => {
      unsubscribeNavigation();
      unsubscribeFavicon();
      unsubscribeOpen();
    };
  }, [addTab, recordVisit, updateTab]);

  useEffect(() => {
    const browser = window.untozBrowser;
    if (!browser) return;

    const ids = new Set(tabs.map((tab) => tab.id));
    for (const id of seen.current) {
      if (!ids.has(id)) {
        browser.closeTab(id);
        requested.current.delete(id);
      }
    }
    seen.current = ids;

    if (!visible || !active || !isHttpUrl(active.url)) {
      browser.hide();
      return;
    }

    browser.ensureTab(active.id);
    browser.showTab(active.id);
    if (requested.current.get(active.id) !== active.url) {
      requested.current.set(active.id, active.url);
      browser.navigate(active.url, active.id);
    }
  }, [active, tabs, visible]);
}
