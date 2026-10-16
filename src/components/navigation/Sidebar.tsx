import {
  Home,
  Star,
  History,
  Download,
  Settings,
  Lock,
  Shield,
  Info,
} from "lucide-react";
import { send, useTabsStore, type Panel } from "@/store/useTabsStore";
import { NEW_TAB } from "../../../shared/browser";
export function Sidebar() {
  const panel = useTabsStore((s) => s.panel);
  const privateTab = useTabsStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId)?.private,
  );
  const items = [
    { id: "bookmarks", label: "Favorites", icon: Star },
    { id: "history", label: "History", icon: History },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "about", label: "About", icon: Info },
  ] as const;
  return (
    <aside className="sidebar">
      <div className="sidebar-heading">YOUR BROWSER</div>
      <button
        className={!panel ? "selected" : ""}
        onClick={() => {
          useTabsStore.getState().setPanel(null);
          void send({ type: "navigate", input: NEW_TAB });
        }}
      >
        <Home size={18} />
        <span>Home</span>
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          className={panel === item.id ? "selected" : ""}
          onClick={() => useTabsStore.getState().setPanel(item.id as Panel)}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      ))}
      <div className="sidebar-divider" />
      <button
        onClick={() => {
          useTabsStore.getState().setPanel(null);
          void send({ type: "new-tab", private: !privateTab });
        }}
      >
        <Lock size={18} />
        <span>{privateTab ? "New normal tab" : "New private tab"}</span>
      </button>
      <div className="sidebar-bottom">
        <Shield size={21} />
        <strong>
          Your internet.
          <br />
          Your control.
        </strong>
        <p>Local data. No account required.</p>
      </div>
    </aside>
  );
}
