import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  type BrowserState,
  type Command,
} from "../../shared/browser";
export type Panel =
  | "bookmarks"
  | "history"
  | "downloads"
  | "settings"
  | "privacy"
  | "about"
  | "profile"
  | "extensions"
  | "workspaces"
  | null;
interface State extends BrowserState {
  ready: boolean;
  panel: Panel;
  error?: string;
  setPanel: (panel: Panel) => void;
}
export const useTabsStore = create<State>((set) => ({
  tabs: [],
  activeTabId: "",
  bookmarks: [],
  history: [],
  quickLinks: [],
  workspaces: [],
  downloads: [],
  settings: DEFAULT_SETTINGS,
  ready: false,
  panel: null,
  setPanel: (panel) => set({ panel }),
}));
export async function send(command: Command) {
  try {
    if (!window.untozBrowser)
      throw new Error("Open Untoz in the desktop app to browse.");
    await window.untozBrowser.command(command);
    if (command.type !== "viewport")
      useTabsStore.setState({ error: undefined });
  } catch (error) {
    useTabsStore.setState({
      error:
        error instanceof Error
          ? error.message.replace(
              /^Error invoking remote method '[^']+': Error: /,
              "",
            )
          : "The action could not be completed.",
    });
  }
}
export function connectBrowser() {
  const api = window.untozBrowser;
  if (!api) {
    useTabsStore.setState({
      ready: true,
      error: "Desktop browser features require Electron. Use npm run dev.",
    });
    return () => {};
  }
  let live = true;
  let initialized = false;
  const pending: Partial<BrowserState>[] = [];
  const unsubscribe = api.onState((state) => {
    if (!live) return;
    if (!initialized) pending.push(state);
    else useTabsStore.setState(state);
  });
  void api
    .snapshot()
    .then((state) => {
      if (live) {
        useTabsStore.setState({
          ...Object.assign(state, ...pending),
          ready: true,
        });
        initialized = true;
      }
    })
    .catch((error) =>
      useTabsStore.setState({ error: String(error), ready: true }),
    );
  return () => {
    live = false;
    unsubscribe();
  };
}
