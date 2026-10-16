import { useState } from "react";
import {
  Plus,
  X,
  Lock,
  Play,
  Clapperboard,
  Building2,
  Cloud,
  Search,
} from "lucide-react";
import { send, useTabsStore } from "@/store/useTabsStore";
import { SEARCH_ENGINES } from "../../shared/search";
import { PRODUCT_LINKS } from "../../shared/links";
import wave from "../assets/wave.svg";

const TILE_ICONS: Record<string, typeof Play> = {
  "untoz-plus": Play,
  studio: Clapperboard,
  hq: Building2,
  cloud: Cloud,
};

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const links = useTabsStore((s) => s.quickLinks);
  const engine = useTabsStore((s) => s.settings.searchEngine);
  const name = useTabsStore((s) => s.settings.profileName);
  const privateTab = useTabsStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId)?.private,
  );
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  return (
    <section className="home-page">
      <img className="home-wave" src={wave} alt="" />
      <div className="home-inner">
        {privateTab && (
          <div className="eyebrow">
            <Lock size={14} /> PRIVATE BROWSING
          </div>
        )}
        <h1>
          {greeting()}, {name}.
        </h1>
        <p className="home-subtitle">Your universe, in a new window.</p>
        <form
          className="home-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) return;
            void send({ type: "navigate", input: query });
          }}
        >
          <input
            aria-label="Search the web"
            placeholder="Search the web or enter an address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button aria-label="Search">
            <Search size={18} />
          </button>
        </form>
        <p className="search-caption">
          Search with {SEARCH_ENGINES[engine].label}. Shortcuts open public
          pages on this device.
        </p>
        <div className="quick-links">
          {links.map((link) => {
            const Icon = TILE_ICONS[link.id];
            return (
              <div className="quick-link" key={link.id}>
                <button
                  onClick={() =>
                    void send({ type: "navigate", input: link.url })
                  }
                >
                  <span className="link-initial">
                    {Icon ? <Icon size={16} /> : link.title.charAt(0)}
                  </span>
                  {link.title}
                </button>
                <button
                  className="remove-link"
                  aria-label={`Remove ${link.title}`}
                  onClick={() =>
                    void send({ type: "remove-quick-link", id: link.id })
                  }
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          <button className="add-link" onClick={() => setAdding(!adding)}>
            <Plus size={18} />
            Add
          </button>
        </div>
        {adding && (
          <form
            className="shortcut-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void send({
                type: "add-quick-link",
                title: String(data.get("title")),
                url: String(data.get("url")),
              }).then(() => {
                if (!useTabsStore.getState().error) setAdding(false);
              });
            }}
          >
            <input
              name="title"
              aria-label="Shortcut title"
              placeholder="Name"
              required
              maxLength={100}
            />
            <input
              name="url"
              aria-label="Shortcut URL"
              placeholder="https://example.com"
              type="url"
              required
            />
            <button className="action">Save</button>
          </form>
        )}
        {links.length < PRODUCT_LINKS.length && (
          <div className="restore-links">
            {PRODUCT_LINKS.filter(
              (link) => !links.some((item) => item.url === link.url),
            ).map((link) => (
              <button
                key={link.id}
                className="action"
                onClick={() =>
                  void send({
                    type: "add-quick-link",
                    title: link.title,
                    url: link.url,
                  })
                }
              >
                Add {link.title}
              </button>
            ))}
          </div>
        )}
        <p className="home-note">
          {privateTab
            ? "History and site data stay out of your saved profile. Downloads and bookmarks you explicitly save remain on this device."
            : "A quiet start. No feeds, no ads, no background requests."}
        </p>
      </div>
    </section>
  );
}
