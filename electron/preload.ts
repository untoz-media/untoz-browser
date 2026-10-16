import { contextBridge, ipcRenderer } from "electron";
import { IPC, type BrowserAPI, type BrowserState } from "../shared/browser";
const api: BrowserAPI = {
  command: (command) => ipcRenderer.invoke(IPC.command, command),
  snapshot: () => ipcRenderer.invoke(IPC.snapshot),
  onState: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: Partial<BrowserState>,
    ) => callback(state);
    ipcRenderer.on(IPC.state, listener);
    return () => ipcRenderer.removeListener(IPC.state, listener);
  },
  onFocusAddress: (callback) => {
    const listener = () => callback();
    ipcRenderer.on(IPC.focusAddress, listener);
    return () => ipcRenderer.removeListener(IPC.focusAddress, listener);
  },
};
contextBridge.exposeInMainWorld("untozBrowser", api);
