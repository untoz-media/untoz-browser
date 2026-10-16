import { useEffect, useRef } from 'react';

interface WebViewProps {
  visible: boolean;
}

export const WebView = ({ visible }: WebViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const browser = window.untozBrowser;
    if (!container || !browser || !visible) return;

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
    const unsubscribeBounds = browser.onRequestBounds(syncBounds);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBounds);
      unsubscribeBounds();
    };
  }, [visible]);

  return (
    <div
      ref={containerRef}
      className={visible ? 'relative w-full h-full bg-background' : 'hidden'}
      aria-label="Área de navegação web"
      aria-hidden={!visible}
    />
  );
};
