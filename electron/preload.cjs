const { contextBridge, ipcRenderer } = require("electron");

/**
 * Renderer (Next.js arayüzü) ile Electron ana süreci arasındaki güvenli köprü.
 */
contextBridge.exposeInMainWorld("electronDesktop", {
  isDesktop: true,
  platform: process.platform,
  getInfo: () => ipcRenderer.invoke("desktop:get-info"),
  readState: () => ipcRenderer.invoke("desktop:read-state"),
  writeState: (stateJson) => ipcRenderer.invoke("desktop:write-state", stateJson),
  saveApiKey: (apiKey) => ipcRenderer.invoke("desktop:save-api-key", apiKey),
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", url),
});
