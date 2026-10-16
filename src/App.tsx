import { useEffect } from "react";
import { connectBrowser, send, useTabsStore } from "@/store/useTabsStore";
import { TopNavigationBar } from "@/components/navigation/TopNavigationBar";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Tabs } from "@/components/ui/Tabs";
import { WebView } from "@/components/ui/WebView";
import { IconButton } from "@/components/ui/IconButton";
import { Panels } from "@/pages/Panels";
import { Minus, Square, X } from "lucide-react";
import icon from "../assets/logo/icon.png";
export default function App() {
  const privateTab = useTabsStore(
    (s) => !!s.tabs.find((t) => t.id === s.activeTabId)?.private,
  );
  const theme = useTabsStore((s) => s.settings.theme);
  const panel = useTabsStore((s) => s.panel);
  const error = useTabsStore((s) => s.error || s.storageError);
  useEffect(connectBrowser, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.private = String(privateTab);
  }, [theme, privateTab]);
  return (
    <div className="browser-shell">
      <header className="titlebar app-drag">
        <div className="brand">
          <img src={icon} alt="" />
          <strong>Untoz</strong>
        </div>
        <Tabs />
        <div className="window-controls app-no-drag">
          <IconButton
            aria-label="Minimize"
            onClick={() => void send({ type: "window", action: "minimize" })}
          >
            <Minus size={15} />
          </IconButton>
          <IconButton
            aria-label="Maximize or restore"
            onClick={() => void send({ type: "window", action: "maximize" })}
          >
            <Square size={13} />
          </IconButton>
          <IconButton
            aria-label="Close window"
            onClick={() => void send({ type: "window", action: "close" })}
          >
            <X size={17} />
          </IconButton>
        </div>
      </header>
      <TopNavigationBar />
      {error && (
        <div role="alert" className="notice">
          {error}
          <button
            onClick={() => useTabsStore.setState({ error: undefined })}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
      <main className="browser-main">
        <Sidebar />
        <div className="browser-content">
          <WebView />
          {panel && <Panels />}
        </div>
      </main>
    </div>
  );
}
