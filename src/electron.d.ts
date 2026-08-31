interface NavigationState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

declare global {
  interface Window {
    untozBrowser?: {
      setBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
      navigate: (url: string) => void;
      back: () => void;
      forward: () => void;
      reload: () => void;
      stop: () => void;
      onNavigationState: (callback: (state: NavigationState) => void) => () => void;
      onFavicon: (callback: (favicon: string) => void) => () => void;
    };
  }
}

export {};
