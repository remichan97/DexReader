import { useEffect } from 'react'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'

/**
 * Hook to listen for offline toggle commands from the main process menu
 */
export function useConnectivityListener(): void {
  const toggleOfflineMode = useConnectivityStore((state) => state.toggleOfflineMode)

  useEffect(() => {
    console.log('[useConnectivityListener] Setting up listener')
    const cleanup = globalThis.api.onConnectivityToggle(() => {
      console.log('[useConnectivityListener] Offline toggle event received')
      toggleOfflineMode()
    })

    return () => {
      console.log('[useConnectivityListener] Cleaning up listener')
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [toggleOfflineMode])
}
