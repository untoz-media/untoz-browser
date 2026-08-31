import { contextBridge, ipcRenderer } from 'electron';

type NavigationState = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
};

contextBridge.exposeInMainWorld('untozBrowser', {
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send('browser:set-bounds', bounds),
  navigate: (url: string) => ipcRenderer.send('browser:navigate', url),
  back: () => ipcRenderer.send('browser:back'),
  forward: () => ipcRenderer.send('browser:forward'),
  reload: () => ipcRenderer.send('browser:reload'),
  stop: () => ipcRenderer.send('browser:stop'),
  onNavigationState: (callback: (state: NavigationState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: NavigationState) => callback(state);
    ipcRenderer.on('browser:navigation-state', listener);
    return () => ipcRenderer.removeListener('browser:navigation-state', listener);
  },
  onFavicon: (callback: (favicon: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, favicon: string) => callback(favicon);
    ipcRenderer.on('browser:favicon-updated', listener);
    return () => ipcRenderer.removeListener('browser:favicon-updated', listener);
  },
});
