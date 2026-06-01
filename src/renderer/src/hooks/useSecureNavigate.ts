import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import { rendererLog } from '@renderer/services/logging.service'

/**
 * Custom navigation hook that checks for Gatekeeper re-authentication requirements
 * before navigating to protected routes (e.g., Settings).
 *
 * This hook wraps react-router's useNavigate() and adds automatic re-auth checks
 * for routes that require Gatekeeper authentication.
 *
 * @param onReauthRequired - Callback when re-authentication is needed. Should show
 *                           the GatekeeperReauthModal and handle success/cancel.
 *
 * @returns A navigate function that handles gatekeeper checks automatically
 *
 * @example
 * ```tsx
 * const navigate = useSecureNavigate((pendingRoute) => {
 *   setPendingNavigation(pendingRoute)
 *   setShowReauthModal(true)
 * })
 *
 * // Later in your component:
 * navigate('/settings') // Automatically checks gatekeeper before navigating
 * ```
 */
export function useSecureNavigate(
  onReauthRequired?: (route: string) => void
): (route: string) => Promise<void> {
  const navigate = useNavigate()

  return useCallback(
    async (route: string): Promise<void> => {
      // Check if navigating to Settings and re-auth is required
      if (route === '/settings' && onReauthRequired) {
        try {
          const [isEnabledResult, requireSettingsResult] = await Promise.all([
            globalThis.gatekeeper.isEnabled(),
            globalThis.gatekeeper.getRequireForSettings()
          ])

          if (
            isEnabledResult.success &&
            isEnabledResult.data &&
            requireSettingsResult.success &&
            requireSettingsResult.data
          ) {
            // Re-auth is required - trigger callback
            onReauthRequired(route)
            return
          }
        } catch (err) {
          rendererLog.error('[useSecureNavigate] Failed to check gatekeeper requirements:', err)
          // On error, allow navigation (fail-open for better UX)
        }
      }

      // No re-auth needed, proceed with navigation
      navigate(route)
    },
    [navigate, onReauthRequired]
  )
}
