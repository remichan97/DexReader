import { useMemo, type ReactNode } from 'react'
import { SecureNavigationContext } from '@renderer/hooks/useSecureNavigation'

export interface SecureNavigationProviderProps {
  readonly children: ReactNode
  readonly onNavigate: (route: string) => Promise<void>
}

/**
 * Provider that makes secure navigation (with gatekeeper checks) available
 * to all child components via useSecureNavigation() hook.
 */
export function SecureNavigationProvider({
  children,
  onNavigate
}: SecureNavigationProviderProps): React.JSX.Element {
  const value = useMemo(() => ({ secureNavigate: onNavigate }), [onNavigate])

  return (
    <SecureNavigationContext.Provider value={value}>{children}</SecureNavigationContext.Provider>
  )
}
