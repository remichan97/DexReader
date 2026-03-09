import { create } from 'zustand'

type ConnectivityStatus = 'online' | 'offline-user' | 'offline-no-internet'

interface ConnectivityState {
  status: ConnectivityStatus
  isOnline: boolean
  lastChecked: Date | null
  pollTimer: ReturnType<typeof setInterval> | null

  // Actions
  setOnline: () => void
  setOfflineMode: () => void // User manually enabled offline mode
  setNoInternet: () => void // System detected no internet
  checkConnectivity: () => Promise<void>
  toggleOfflineMode: () => void
  startPolling: () => void
  stopPolling: () => void
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  status: 'online',
  isOnline: true,
  lastChecked: null,
  pollTimer: null,

  setOnline: () => {
    set({ status: 'online', isOnline: true, lastChecked: new Date() })
    globalThis.api.updateMenuState({ isOffline: false })
  },

  setOfflineMode: () => {
    set({ status: 'offline-user', isOnline: false, lastChecked: new Date() })
    globalThis.api.updateMenuState({ isOffline: true })
  },

  setNoInternet: () => {
    set({ status: 'offline-no-internet', isOnline: false, lastChecked: new Date() })
    globalThis.api.updateMenuState({ isOffline: true })
  },

  toggleOfflineMode: () => {
    const current = get().status

    // Toggle between online and offline states
    if (current === 'online') {
      console.log('[ConnectivityStore] User manually went offline')
      get().setOfflineMode()
      get().stopPolling() // Stop checking when manually offline
    } else {
      // Any offline state (user or no-internet) -> user wants to go online
      console.log('[ConnectivityStore] User manually went online')
      get().setOnline()
      get().startPolling() // Resume checking when back online
      // Immediately check connectivity to verify internet is available
      void get().checkConnectivity()
    }

    // Update menu state
    const newIsOffline = get().status !== 'online'
    globalThis.api.updateMenuState({
      isOffline: newIsOffline
    })
  },

  // Periodic connectivity polling (every 30 seconds when online)
  startPolling: () => {
    // Clear existing timer
    const existingTimer = get().pollTimer
    if (existingTimer) {
      clearInterval(existingTimer)
    }

    const timer = setInterval(() => {
      const status = get().status
      // Only poll when online or when internet was lost (not user-initiated offline)
      if (status === 'online' || status === 'offline-no-internet') {
        void get().checkConnectivity()
      }
    }, 30000) // Check every 30 seconds

    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const existingTimer = get().pollTimer
    if (existingTimer) {
      clearInterval(existingTimer)
      set({ pollTimer: null })
    }
  },

  checkConnectivity: async () => {
    try {
      // Use backend IPC to check MangaDex API (avoids CSP/CORS issues in renderer)
      const response = await globalThis.mangadex.isServiceAlive()

      if (response.success && response.data === true) {
        // Internet is working - ensure we're online (unless user chose offline)
        if (get().status !== 'offline-user') {
          if (get().status === 'offline-no-internet') {
            console.log('[ConnectivityStore] Internet restored - going back online')
          }
          get().setOnline()
        }
      } else {
        // MangaDex responded but with error - still have internet
        console.warn('[ConnectivityStore] MangaDex ping failed:', response)
      }
    } catch (error) {
      // Network error - no internet
      console.error('[ConnectivityStore] Connectivity check failed:', error)

      // Only set to no-internet if user didn't manually choose offline
      if (get().status !== 'offline-user') {
        console.log('[ConnectivityStore] No internet detected - showing offline banner')
        get().setNoInternet()
        // OfflineStatusBar will appear automatically with "No internet" message
      }
    }
  }
}))

export type { ConnectivityStatus }
