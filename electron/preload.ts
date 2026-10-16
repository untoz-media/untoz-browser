import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

type NavigationState = {
  tabId: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
};

type FaviconUpdate = {
  tabId: string;
  favicon: string;
};

contextBridge.exposeInMainWorld('untozBrowser', {
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send('browser:set-bounds', bounds),
  ensureTab: (tabId: string) => ipcRenderer.send('browser:ensure-tab', tabId),
  showTab: (tabId: string) => ipcRenderer.send('browser:show-tab', tabId),
  closeTab: (tabId: string) => ipcRenderer.send('browser:close-tab', tabId),
  hide: () => ipcRenderer.send('browser:hide'),
  navigate: (url: string, tabId: string) => ipcRenderer.send('browser:navigate', { url, tabId }),
  back: (tabId: string) => ipcRenderer.send('browser:back', tabId),
  forward: (tabId: string) => ipcRenderer.send('browser:forward', tabId),
  reload: (tabId: string) => ipcRenderer.send('browser:reload', tabId),
  stop: (tabId: string) => ipcRenderer.send('browser:stop', tabId),
  onNavigationState: (callback: (state: NavigationState) => void) => {
    const listener = (_event: IpcRendererEvent, state: NavigationState) => callback(state);
    ipcRenderer.on('browser:navigation-state', listener);
    return () => ipcRenderer.removeListener('browser:navigation-state', listener);
  },
  onFavicon: (callback: (update: FaviconUpdate) => void) => {
    const listener = (_event: IpcRendererEvent, update: FaviconUpdate) => callback(update);
    ipcRenderer.on('browser:favicon-updated', listener);
    return () => ipcRenderer.removeListener('browser:favicon-updated', listener);
  },
  onOpenUrl: (callback: (url: string) => void) => {
    const listener = (_event: IpcRendererEvent, url: string) => callback(url);
    ipcRenderer.on('browser:open-url', listener);
    return () => ipcRenderer.removeListener('browser:open-url', listener);
  },
  onRequestBounds: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('browser:request-bounds', listener);
    return () => ipcRenderer.removeListener('browser:request-bounds', listener);
  },
});
