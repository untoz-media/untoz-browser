import { useEffect, useRef } from 'react';
import { useTabsStore } from '@/store/useTabsStore';

interface WebViewProps {
  url: string;
}

export const WebView = ({ url }: WebViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeTabId, updateTab } = useTabsStore();

  useEffect(() => {
    const container = containerRef.current;
    const browser = window.untozBrowser;
    if (!container || !browser) return;

    const syncBounds = () => {
      const rect = container.getBoundingClientRect();
      browser.setBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    const observer = new ResizeObserver(syncBounds);
    observer.observe(container);
    window.addEventListener('resize', syncBounds);
    syncBounds();

    const unsubscribeNavigation = browser.onNavigationState((state) => {
      if (!activeTabId) return;
      updateTab(activeTabId, {
        url: state.url || url,
        title: state.title || 'Nova Aba',
      });
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBounds);
      unsubscribeNavigation();
    };
  }, [activeTabId, updateTab, url]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-background"
      aria-label="Área de navegação web"
    />
  );
};
