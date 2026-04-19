import { useEffect } from 'react'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'

/**
 * Hook to listen for offline toggle commands from the main process menu
 */
export function useConnectivityListener(): void {
  const toggleOfflineMode = useConnectivityStore((state) => state.toggleOfflineMode)

  useEffect(() => {
    const cleanup = globalThis.api.onConnectivityToggle(() => {
      toggleOfflineMode()
    })

    return () => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [toggleOfflineMode])
}
