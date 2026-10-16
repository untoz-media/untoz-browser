import { useLayoutEffect, useRef } from "react";
import { send, useTabsStore } from "@/store/useTabsStore";
import { NEW_TAB } from "../../../shared/browser";
import { Home } from "@/pages/Home";
export function WebView() {
  const ref = useRef<HTMLDivElement>(null);
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const panel = useTabsStore((s) => s.panel);
  const ready = useTabsStore((s) => s.ready);
  const visible = !panel && !!tab && tab.url !== NEW_TAB && !tab.error;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !ready) return;
    const update = () => {
      const r = element.getBoundingClientRect();
      void send({
        type: "viewport",
        bounds: { x: r.x, y: r.y, width: r.width, height: r.height },
        visible,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [visible, ready]);
  return (
    <div className="page-viewport" ref={ref}>
      {!panel && (!tab || tab.url === NEW_TAB) && <Home />}
      {!panel && tab?.error && (
        <div className="page-error">
          <h1>Unable to open this page</h1>
          <p>{tab.error}</p>
          <p className="muted">{tab.url}</p>
          <button
            className="action"
            onClick={() => void send({ type: "reload" })}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
