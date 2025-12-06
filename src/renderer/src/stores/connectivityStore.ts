import { create } from 'zustand'

type ConnectivityStatus = 'online' | 'offline-user' | 'offline-no-internet'

interface ConnectivityState {
  status: ConnectivityStatus
  isOnline: boolean
  lastChecked: Date | null

  // Actions
  setOnline: () => void
  setOfflineMode: () => void // User manually enabled offline mode
  setNoInternet: () => void // System detected no internet
  checkConnectivity: () => Promise<void>
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  status: 'online',
  isOnline: true,
  lastChecked: null,

  setOnline: () => set({ status: 'online', isOnline: true, lastChecked: new Date() }),

  setOfflineMode: () => set({ status: 'offline-user', isOnline: false, lastChecked: new Date() }),

  setNoInternet: () =>
    set({ status: 'offline-no-internet', isOnline: false, lastChecked: new Date() }),

  checkConnectivity: async () => {
    try {
      // Simple connectivity check - ping MangaDex or a reliable endpoint
      const response = await fetch('https://api.mangadex.org/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (response.ok && get().status === 'offline-no-internet') {
        // Internet restored, but respect user's offline mode choice
        if (get().status !== 'offline-user') {
          get().setOnline()
        }
      }
    } catch {
      // Only set to no-internet if user didn't manually enable offline mode
      if (get().status !== 'offline-user') {
        get().setNoInternet()
      }
    }
  }
}))

export type { ConnectivityStatus }
