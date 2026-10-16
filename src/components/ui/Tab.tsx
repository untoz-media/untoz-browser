import { Globe, Lock, X } from "lucide-react";
import type { Tab as TabData } from "../../../shared/browser";
import { send, useTabsStore } from "@/store/useTabsStore";
export function Tab({ tab, active }: { tab: TabData; active: boolean }) {
  return (
    <div className={`browser-tab ${active ? "active" : ""}`} title={tab.url}>
      <button
        role="tab"
        aria-selected={active}
        onClick={() => {
          useTabsStore.getState().setPanel(null);
          void send({ type: "activate-tab", id: tab.id });
        }}
      >
        {tab.private ? (
          <Lock size={14} />
        ) : tab.favicon ? (
          <img src={tab.favicon} width={16} height={16} alt="" />
        ) : (
          <Globe size={14} />
        )}
        <span>{tab.isLoading ? "Loading…" : tab.title}</span>
      </button>
      <button
        className="tab-close"
        aria-label={`Close ${tab.title}`}
        onClick={() => void send({ type: "close-tab", id: tab.id })}
      >
        <X size={13} />
      </button>
    </div>
  );
}
