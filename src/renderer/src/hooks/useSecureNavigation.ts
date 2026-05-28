import { useContext } from 'react'
import { createContext } from 'react'

export interface SecureNavigationContextValue {
  /**
   * Navigate with gatekeeper re-auth checks
   */
  secureNavigate: (route: string) => Promise<void>
}

export const SecureNavigationContext = createContext<SecureNavigationContextValue | null>(null)

/**
 * Hook to access secure navigation function that checks for gatekeeper
 * re-authentication before navigating to protected routes.
 *
 * Must be used within a SecureNavigationProvider.
 *
 * @returns The secure navigate function
 *
 * @example
 * ```tsx
 * const { secureNavigate } = useSecureNavigation()
 *
 * // Navigate with automatic gatekeeper checks:
 * await secureNavigate('/settings')
 * ```
 */
export function useSecureNavigation(): SecureNavigationContextValue {
  const context = useContext(SecureNavigationContext)
  if (!context) {
    throw new Error('useSecureNavigation must be used within SecureNavigationProvider')
  }
  return context
}
