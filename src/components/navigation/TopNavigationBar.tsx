import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Shield,
  Star,
  Home,
  Search,
} from "lucide-react";
import { send, useTabsStore } from "@/store/useTabsStore";
import { NEW_TAB } from "../../../shared/browser";
import { IconButton } from "@/components/ui/IconButton";
export function TopNavigationBar() {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const starred = useTabsStore((s) =>
    s.bookmarks.some((b) => b.url === tab?.url),
  );
  const protection =
    useTabsStore(
      (s) =>
        s.settings.trackerProtection ||
        s.settings.adBlocking ||
        s.settings.removeTrackingParameters,
    ) && tab?.protectionEnabled;
  const [draft, setDraft] = useState<{ tabId: string; value: string } | null>(
    null,
  );
  const editing = !!draft && draft.tabId === tab?.id;
  const input = useRef<HTMLInputElement>(null);
  useEffect(
    () =>
      window.untozBrowser?.onFocusAddress(() => {
        input.current?.focus();
        input.current?.select();
      }),
    [],
  );
  const address = tab?.url === NEW_TAB ? "" : tab?.url || "";
  return (
    <nav className="navigation" aria-label="Browser navigation">
      <IconButton
        aria-label="Back (Alt+Left)"
        disabled={!tab?.canGoBack}
        onClick={() => void send({ type: "back" })}
      >
        <ArrowLeft size={18} />
      </IconButton>
      <IconButton
        aria-label="Forward (Alt+Right)"
        disabled={!tab?.canGoForward}
        onClick={() => void send({ type: "forward" })}
      >
        <ArrowRight size={18} />
      </IconButton>
      <IconButton
        aria-label={tab?.isLoading ? "Stop loading" : "Reload (Ctrl+R)"}
        onClick={() => void send({ type: tab?.isLoading ? "stop" : "reload" })}
      >
        {tab?.isLoading ? <X size={18} /> : <RotateCw size={18} />}
      </IconButton>
      <IconButton
        aria-label="Home"
        onClick={() => {
          useTabsStore.getState().setPanel(null);
          void send({ type: "navigate", input: NEW_TAB });
        }}
      >
        <Home size={18} />
      </IconButton>
      <form
        className="address-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send({
            type: "navigate",
            input: editing ? draft.value : address,
          });
          setDraft(null);
          input.current?.blur();
          useTabsStore.getState().setPanel(null);
        }}
      >
        <Search size={17} />
        <input
          ref={input}
          aria-label="Search or enter address"
          placeholder="Search or enter address"
          autoComplete="off"
          spellCheck={false}
          value={editing ? draft.value : address}
          onChange={(e) => {
            setDraft({ tabId: tab?.id || "", value: e.target.value });
          }}
          onFocus={(e) => {
            setDraft({ tabId: tab?.id || "", value: address });
            e.target.select();
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(null);
              input.current?.blur();
            }
          }}
        />
        {tab?.private && <span className="private-badge">Private</span>}
        <IconButton
          aria-label={starred ? "Remove bookmark" : "Bookmark this page"}
          disabled={!address}
          onClick={() => void send({ type: "bookmark" })}
        >
          <Star size={17} fill={starred ? "currentColor" : "none"} />
        </IconButton>
      </form>
      <button
        className={`shield-button ${protection ? "protected" : ""}`}
        aria-label="Site privacy"
        onClick={() => useTabsStore.getState().setPanel("privacy")}
      >
        <Shield size={18} />
        <span>{(tab?.blockedTrackers || 0) + (tab?.blockedAds || 0)}</span>
      </button>
    </nav>
  );
}
