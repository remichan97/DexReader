import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSecureNavigate } from './useSecureNavigate'
import { rendererLog } from '@renderer/services/logging.service'

export interface UseGatekeeperGuardResult {
  isLocked: boolean
  isCheckingLock: boolean
  unlock: () => void
  showReauthModal: boolean
  handleNavigate: (route: string) => Promise<void>
  handleReauthSuccess: () => void
  handleReauthCancel: () => void
}

/**
 * Owns the Gatekeeper lock-screen and re-authentication flow: checks lock
 * status on startup, guards navigation to protected routes (via the existing
 * `useSecureNavigate`), and wires the menu's navigation channel through the
 * same guard so menu-triggered navigation can't bypass re-auth.
 */
export function useGatekeeperGuard(): UseGatekeeperGuardResult {
  const navigate = useNavigate()

  const [isLocked, setIsLocked] = useState(false)
  const [isCheckingLock, setIsCheckingLock] = useState(true)
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const handleNavigate = useSecureNavigate(
    useCallback((route: string) => {
      setPendingNavigation(route)
      setShowReauthModal(true)
    }, [])
  )

  // Override the menu's navigation listener with the guarded handler
  useEffect(() => {
    globalThis.api.onNavigate(handleNavigate)
  }, [handleNavigate])

  // Check if Gatekeeper is enabled on mount
  useEffect(() => {
    async function checkGatekeeper(): Promise<void> {
      try {
        const result = await globalThis.gatekeeper.isEnabled()
        if (result.success && result.data) {
          setIsLocked(true)
        }
      } catch (err) {
        rendererLog.error('[useGatekeeperGuard] Failed to check Gatekeeper status:', err)
      } finally {
        setIsCheckingLock(false)
      }
    }
    void checkGatekeeper()
  }, [])

  const handleReauthSuccess = (): void => {
    // Re-authentication successful - proceed with pending navigation
    if (pendingNavigation) {
      rendererLog.info('[useGatekeeperGuard] Re-authentication successful, navigating to Settings')
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
    setShowReauthModal(false)
  }

  const handleReauthCancel = (): void => {
    // Re-authentication cancelled - return to previous screen
    rendererLog.info('[useGatekeeperGuard] Re-authentication cancelled, staying on current page')
    setPendingNavigation(null)
    setShowReauthModal(false)
    // Navigation automatically stays on current page (no action needed)
  }

  const unlock = (): void => setIsLocked(false)

  return {
    isLocked,
    isCheckingLock,
    unlock,
    showReauthModal,
    handleNavigate,
    handleReauthSuccess,
    handleReauthCancel
  }
}
