import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Hook to block navigation when there are unsaved changes
 * DOES NOT block window close (handled separately via flush-pending-saves IPC)
 * @param shouldBlock - Whether navigation should be blocked
 * @param customMessage - Optional custom confirmation message
 */
export function useNavigationBlocker(shouldBlock: boolean, customMessage?: string): void {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('dialogs')

  // Intercept sidebar clicks and other navigation
  useEffect(() => {
    if (!shouldBlock) return

    const message = customMessage || t('confirmations.unsavedChanges.navigation.title')
    const detail = t('confirmations.unsavedChanges.navigation.message')
    const confirmButton = t('confirmations.unsavedChanges.navigation.confirmButton')
    const cancelButton = t('confirmations.unsavedChanges.navigation.cancelButton')

    let isNavigating = false

    const handleClick = (e: MouseEvent): void => {
      if (isNavigating) return

      const target = e.target as HTMLElement
      const clickable = target.closest('[role="button"], a, button')

      if (clickable) {
        const isSidebarItem = clickable.classList.contains('sidebar__item')
        const href = clickable.getAttribute('href')

        // Check if it's a navigation action
        if (isSidebarItem || (href && href.startsWith('/'))) {
          const targetPath = isSidebarItem ? clickable.getAttribute('data-route') : href

          if (targetPath && targetPath !== location.pathname) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            isNavigating = true
            globalThis.api
              .showConfirmDialog(message, detail, confirmButton, cancelButton)
              .then((confirmed) => {
                if (confirmed.success && confirmed.data) {
                  navigate(targetPath)
                }
              })
              .catch(() => {
                // Dialog cancelled or error
              })
              .finally(() => {
                isNavigating = false
              })
          }
        }
      }
    }

    // Capture phase to intercept before any other handlers
    document.addEventListener('click', handleClick, true)
    return (): void => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [shouldBlock, customMessage, navigate, location.pathname, t])
}
