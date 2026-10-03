import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SecureNavigationContext, useSecureNavigation } from './useSecureNavigation'

it('returns the context value when rendered within a provider', () => {
  const secureNavigate = vi.fn()
  const { result } = renderHook(() => useSecureNavigation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <SecureNavigationContext.Provider value={{ secureNavigate }}>
        {children}
      </SecureNavigationContext.Provider>
    )
  })

  expect(result.current.secureNavigate).toBe(secureNavigate)
})

it('throws when used outside of a SecureNavigationProvider', () => {
  expect(() => renderHook(() => useSecureNavigation())).toThrow(
    /must be used within SecureNavigationProvider/
  )
})
