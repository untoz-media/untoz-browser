interface NavigationState {
  tabId: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

interface FaviconUpdate {
  tabId: string;
  favicon: string;
}

interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare global {
  interface Window {
    untozBrowser?: {
      setBounds: (bounds: ViewBounds) => void;
      ensureTab: (tabId: string) => void;
      showTab: (tabId: string) => void;
      closeTab: (tabId: string) => void;
      hide: () => void;
      navigate: (url: string, tabId: string) => void;
      back: (tabId: string) => void;
      forward: (tabId: string) => void;
      reload: (tabId: string) => void;
      stop: (tabId: string) => void;
      onNavigationState: (callback: (state: NavigationState) => void) => () => void;
      onFavicon: (callback: (update: FaviconUpdate) => void) => () => void;
      onOpenUrl: (callback: (url: string) => void) => () => void;
      onRequestBounds: (callback: () => void) => () => void;
    };
  }
}

export {};
