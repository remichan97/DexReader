import type { JSX } from 'react'
import { WifiOff24Regular, CloudOff24Regular } from '@fluentui/react-icons'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { Button } from '@renderer/components/Button'
import './OfflineStatusBar.css'

export function OfflineStatusBar(): JSX.Element | null {
  const status = useConnectivityStore((state) => state.status)
  const setOnline = useConnectivityStore((state) => state.setOnline)
  const checkConnectivity = useConnectivityStore((state) => state.checkConnectivity)

  if (status === 'online') {
    return null // Don't show banner when online
  }

  const isUserInitiated = status === 'offline-user'

  return (
    <div
      className="offline-status-bar flex items-center justify-between"
      data-type={isUserInitiated ? 'user' : 'system'}
      role="alert"
      aria-live="polite"
    >
      <div className="offline-status-bar__content flex items-center gap-3">
        {isUserInitiated ? (
          <CloudOff24Regular className="offline-status-bar__icon" />
        ) : (
          <WifiOff24Regular className="offline-status-bar__icon" />
        )}

        <span className="offline-status-bar__text">
          {isUserInitiated ? (
            <>
              <strong>You&apos;re offline</strong> — Only downloaded content is available
            </>
          ) : (
            <>
              <strong>No internet</strong> — Downloaded content still works
            </>
          )}
        </span>
      </div>

      <div className="offline-status-bar__actions">
        {isUserInitiated ? (
          <Button variant="ghost" size="small" onClick={setOnline}>
            Go Online
          </Button>
        ) : (
          <Button variant="ghost" size="small" onClick={checkConnectivity}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
