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
      className="offline-status-bar"
      data-type={isUserInitiated ? 'user' : 'system'}
      role="alert"
      aria-live="polite"
    >
      <div className="offline-status-bar__content">
        {isUserInitiated ? (
          <CloudOff24Regular className="offline-status-bar__icon" />
        ) : (
          <WifiOff24Regular className="offline-status-bar__icon" />
        )}

        <div className="offline-status-bar__text">
          <span className="offline-status-bar__title">
            {isUserInitiated ? "You're offline" : 'No internet'}
          </span>
          <span className="offline-status-bar__message">
            {isUserInitiated
              ? 'Only showing downloaded stuff.'
              : "Can't connect right now. Downloaded content still works though."}
          </span>
        </div>
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
