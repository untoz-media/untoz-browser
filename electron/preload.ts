// Preload scripts for Electron
// These scripts have access to Node.js APIs and are exposed to the renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: expose an IPC method for communicating from renderer to main
  // sendMessage: (channel: string, data: unknown) => {
  //   // Validate channel names for security
  //   const validChannels = ['toMain'];
  //   if (validChannels.includes(channel)) {
  //     ipcRenderer.send(channel, data);
  //   }
  // },
  // Receive a message from main process
  // onMessage: (channel: string, func: (...args: any[]) => void) => {
  //   const validChannels = ['fromMain'];
  //   if (validChannels.includes(channel)) {
  //     // Remove listener whenever the component unmounts
  //     const subscription = (_event: any, ...args: any[]) =>
  //       func(...args);
  //     ipcRenderer.on(channel, subscription);
  //     return () => ipcRenderer.removeListener(channel, subscription);
  //   }
  // },
});

// Expose Electron versions and platform info
contextBridge.exposeInMainWorld('electron', {
  invoke: ipcRenderer.invoke.bind(ipcRenderer),
  send: ipcRenderer.send.bind(ipcRenderer),
  on: ipcRenderer.on.bind(ipcRenderer),
  removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  getVersion: () => process.versions.node,
  getPlatform: () => process.platform
});
