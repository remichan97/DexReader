import { useEffect } from 'react'
import { useProgressStore } from '@renderer/stores/progressStore'

/**
 * Hook to listen for incognito toggle commands from the main process menu
 */
export function useIncognitoListener(): void {
  const toggleIncognito = useProgressStore((state) => state.toggleIncognito)

  useEffect(() => {
    // Listen for incognito toggle from menu (File → Go Incognito)
    const cleanup = globalThis.progress.onIncognitoToggle(() => {
      toggleIncognito()
    })

    // Cleanup: remove listener on unmount or when toggleIncognito changes
    return () => {
      // Check if cleanup is a function (new preload code) before calling
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [toggleIncognito])
}
