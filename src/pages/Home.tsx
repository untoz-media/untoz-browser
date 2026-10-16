import { useState } from "react";
import { ArrowRight, Plus, X, Lock } from "lucide-react";
import { send, useTabsStore } from "@/store/useTabsStore";
import { SEARCH_ENGINES } from "../../shared/search";
export function Home() {
  const links = useTabsStore((s) => s.quickLinks);
  const engine = useTabsStore((s) => s.settings.searchEngine);
  const privateTab = useTabsStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId)?.private,
  );
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  return (
    <section className="home-page">
      <div className="home-inner">
        <div className="eyebrow">
          {privateTab ? (
            <>
              <Lock size={14} /> PRIVATE BROWSING
            </>
          ) : (
            "A LITTLE SPACE. A WORLD OF POSSIBILITIES."
          )}
        </div>
        <h1>
          Untoz <span>Browser</span>
        </h1>
        <p className="home-subtitle">Your universe, in a new window.</p>
        <form
          className="home-search"
          onSubmit={(e) => {
            e.preventDefault();
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
            <ArrowRight size={22} />
          </button>
        </form>
        <p className="search-caption">
          Search with {SEARCH_ENGINES[engine].label}
        </p>
        <div className="quick-links">
          {links.map((link) => (
            <div className="quick-link" key={link.id}>
              <button
                onClick={() => void send({ type: "navigate", input: link.url })}
              >
                <span className="link-initial">
                  {link.title.charAt(0).toUpperCase()}
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
          ))}
          <button className="add-link" onClick={() => setAdding(!adding)}>
            <Plus size={20} />
            Add shortcut
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
        <p className="home-note">
          {privateTab
            ? "History and site data stay out of your saved profile. Downloads and bookmarks you explicitly save remain on this device."
            : "A quiet start. No feeds, no ads, no background requests."}
        </p>
      </div>
    </section>
  );
}
