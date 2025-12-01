import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Hook to block navigation when there are unsaved changes
 * @param shouldBlock - Whether navigation should be blocked
 * @param message - Confirmation message to show
 */
export function useNavigationBlocker(
  shouldBlock: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?'
): void {
  const navigate = useNavigate()
  const location = useLocation()

  // Prevent window close/refresh
  useEffect(() => {
    if (!shouldBlock) return

    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault()
      e.returnValue = ''
    }

    globalThis.addEventListener('beforeunload', handleBeforeUnload)
    return (): void => {
      globalThis.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [shouldBlock])

  // Intercept sidebar clicks and other navigation
  useEffect(() => {
    if (!shouldBlock) return

    const handleClick = (e: MouseEvent): void => {
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

            globalThis.api
              .showConfirmDialog(message, 'Your changes will be lost.')
              .then((confirmed) => {
                if (confirmed) {
                  navigate(targetPath)
                }
              })
              .catch(() => {
                // Dialog cancelled or error
              })
          }
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return (): void => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [shouldBlock, message, navigate, location.pathname])
}
