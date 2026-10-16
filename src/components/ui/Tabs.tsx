import { Plus } from "lucide-react";
import { Tab } from "./Tab";
import { IconButton } from "./IconButton";
import { send, useTabsStore } from "@/store/useTabsStore";
export function Tabs() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeTabId);
  return (
    <div className="tab-strip app-no-drag">
      <div className="tab-list" role="tablist" aria-label="Open tabs">
        {tabs.map((tab) => (
          <Tab key={tab.id} tab={tab} active={tab.id === activeId} />
        ))}
      </div>
      <IconButton
        aria-label="New tab (Ctrl+T)"
        onClick={() =>
          void send({
            type: "new-tab",
            private: tabs.find((t) => t.id === activeId)?.private,
          })
        }
      >
        <Plus size={18} />
      </IconButton>
    </div>
  );
}
