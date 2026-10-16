import {
  Home,
  Star,
  History,
  Download,
  Settings,
  Lock,
  Puzzle,
  LayoutGrid,
  Play,
  Clapperboard,
  Building2,
  Cloud,
  Sun,
  Moon,
} from "lucide-react";
import { send, useTabsStore, type Panel } from "@/store/useTabsStore";
import { NEW_TAB } from "../../../shared/browser";
import { PRODUCT_LINKS } from "../../../shared/links";

const PRODUCT_ICONS = {
  "untoz-plus": Play,
  studio: Clapperboard,
  hq: Building2,
  cloud: Cloud,
} as const;

export function Sidebar() {
  const panel = useTabsStore((s) => s.panel);
  const theme = useTabsStore((s) => s.settings.theme);
  const name = useTabsStore((s) => s.settings.profileName);
  const privateTab = useTabsStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId)?.private,
  );
  const dark = theme !== "light";
  const items = [
    { id: "bookmarks", label: "Favorites", icon: Star },
    { id: "history", label: "History", icon: History },
    { id: "downloads", label: "Downloads", icon: Download },
  ] as const;
  const library = [
    { id: "extensions", label: "Extensions", icon: Puzzle },
    { id: "workspaces", label: "Workspaces", icon: LayoutGrid },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;
  return (
    <aside className="sidebar">
      <button
        className={`nav-item ${!panel ? "selected" : ""}`}
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
          className={`nav-item ${panel === item.id ? "selected" : ""}`}
          onClick={() => useTabsStore.getState().setPanel(item.id as Panel)}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      ))}
      <div className="sidebar-divider" />
      {PRODUCT_LINKS.map((link) => {
        const Icon = PRODUCT_ICONS[link.id as keyof typeof PRODUCT_ICONS];
        return (
          <button
            key={link.id}
            className="nav-item"
            onClick={() => {
              useTabsStore.getState().setPanel(null);
              void send({ type: "new-tab", url: link.url });
            }}
          >
            <Icon size={18} />
            <span>{link.title}</span>
          </button>
        );
      })}
      <div className="sidebar-divider" />
      {library.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${panel === item.id ? "selected" : ""}`}
          onClick={() => useTabsStore.getState().setPanel(item.id as Panel)}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      ))}
      <button
        className="nav-item"
        onClick={() => {
          useTabsStore.getState().setPanel(null);
          void send({ type: "new-tab", private: !privateTab });
        }}
      >
        <Lock size={18} />
        <span>{privateTab ? "New normal tab" : "New private tab"}</span>
      </button>
      <div className="sidebar-bottom">
        <div className="theme-toggle" aria-label="Theme">
          <span>{dark ? "Dark theme" : "Light theme"}</span>
          <button
            role="switch"
            aria-checked={dark}
            aria-label="Dark theme"
            className={dark ? "on" : ""}
            onClick={() =>
              void send({
                type: "settings",
                settings: { theme: dark ? "light" : "dark" },
              })
            }
          >
            <Moon size={13} />
            <Sun size={13} />
          </button>
        </div>
        <button
          className={`profile-row ${panel === "profile" ? "selected" : ""}`}
          onClick={() => useTabsStore.getState().setPanel("profile")}
        >
          <span className="profile-avatar" aria-hidden>
            {name.charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{name}</strong>
            <small>Local profile</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
