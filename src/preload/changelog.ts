import { contextBridge, ipcRenderer } from 'electron'

// Dedicated mini preload for the changelog window that only surface what it need
const changelogSet = {
  getChangelog: () => ipcRenderer.invoke('changelog:get'),
  getCspNonce: () => ipcRenderer.invoke('security:get-csp-nonce'),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getSystemAccentColour: () => ipcRenderer.invoke('theme:get-system-accent-color'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('changelog', changelogSet)
  } catch (error) {
    console.error(error)
  }
} else {
  globalThis.changelog = changelogSet
}
