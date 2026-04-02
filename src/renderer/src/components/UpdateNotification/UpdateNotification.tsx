/**
 * UpdateNotification Component
 *
 * Smart banner that adapts visibility based on update state:
 *
 * - Checking: Auto-dismisses after 2s (quick feedback)
 * - Available: Semi-persistent, shows Download/Later buttons
 * - Downloading: Shows progress, can be hidden by user
 * - Downloaded: Re-appears with Restart/Later buttons (important)
 * - Not Available: Auto-dismisses after 3s
 * - Error: Semi-persistent with Retry/Dismiss buttons
 *
 * Offline Integration:
 * - Suppresses error banners when offline (OfflineStatusBar handles it)
 * - Update checks naturally fail when offline, resume when back online
 */

import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import {
  Dismiss24Regular,
  ArrowDownload24Regular,
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { Button } from '@renderer/components/Button'
import './UpdateNotification.css'

type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

interface UpdateInfo {
  version?: string
  releaseNotes?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
  errorMessage?: string
}

export function UpdateNotification(): JSX.Element | null {
  const [state, setState] = useState<UpdateState>('idle')
  const [info, setInfo] = useState<UpdateInfo>({})
  const [hidden, setHidden] = useState(false) // User can hide during download

  // Access offline mode state
  const isOnline = useConnectivityStore((state) => state.isOnline)

  useEffect(() => {
    // Register event listeners - collect all cleanup functions
    const cleanupFns = [
      // Event: Checking for updates
      globalThis.appUpdate.onUpdateChecking(() => {
        setState('checking')
        setHidden(false)
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
          setState((current) => (current === 'checking' ? 'idle' : current))
        }, 2000)
      }),

      // Event: Update available
      globalThis.appUpdate.onUpdateAvailable((data) => {
        setState('available')
        setInfo({ version: data.version, releaseNotes: data.releaseNotes })
        setHidden(false) // Always show when update is available
      }),

      // Event: No update available
      globalThis.appUpdate.onUpdateNotAvailable((data) => {
        setState('not-available')
        setInfo({ version: data.version })
        setHidden(false)
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setState((current) => (current === 'not-available' ? 'idle' : current))
        }, 3000)
      }),

      // Event: Download started
      globalThis.appUpdate.onUpdateDownloading(() => {
        setState('downloading')
        setInfo({ percent: 0 })
        // Don't auto-show if user explicitly hid it
        // setHidden(false) - intentionally not resetting
      }),

      // Event: Download progress
      globalThis.appUpdate.onDownloadProgress((progress) => {
        setState('downloading')
        setInfo({
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond: progress.bytesPerSecond
        })
      }),

      // Event: Update downloaded and ready
      globalThis.appUpdate.onUpdateDownloaded((data) => {
        setState('downloaded')
        setInfo({ version: data.version, releaseNotes: data.releaseNotes })
        setHidden(false) // Always show when ready to install
      }),

      // Event: Error occurred
      globalThis.appUpdate.onUpdateError((error) => {
        setState('error')
        setInfo({ errorMessage: error.userMessage })
        setHidden(false) // Always show errors
      })
    ]

    // Cleanup on unmount
    return () => {
      cleanupFns.forEach((cleanup) => cleanup())
    }
  }, [])

  // Don't render if hidden or idle
  if (hidden || state === 'idle') return null

  // Don't show error banner when offline - OfflineStatusBar handles that
  if (state === 'error' && !isOnline) {
    return null
  }

  // Handler functions
  const handleDownload = async (): Promise<void> => {
    await globalThis.appUpdate.downloadUpdate()
  }

  const handleInstall = async (): Promise<void> => {
    await globalThis.appUpdate.installUpdate()
  }

  const handleRetry = async (): Promise<void> => {
    await globalThis.appUpdate.checkForUpdates(true)
  }

  const handleLater = (): void => {
    // For 'available' and 'downloaded' states, set to idle
    setState('idle')
  }

  const handleHide = (): void => {
    // Only for downloading state - hide but keep downloading
    setHidden(true)
  }

  const handleDismiss = (): void => {
    // For error state
    setState('idle')
  }

  // Render based on state
  return (
    <div
      className={`update-notification flex items-center justify-between update-notification--${state}`}
      role="alert"
      aria-live="polite"
    >
      {/* Checking state - simple inline */}
      {state === 'checking' && (
        <div className="update-notification__content flex items-center gap-3">
          <div className="spinner" aria-label="Checking for updates" />
          <span className="update-notification__text">Checking for updates...</span>
        </div>
      )}

      {/* Available state - icon + text + actions */}
      {state === 'available' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <ArrowDownload24Regular className="update-notification__icon" />
            <span className="update-notification__text">
              <strong>Update available</strong> — Version {info.version} is ready to download
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="primary" size="small" onClick={handleDownload}>
              Download
            </Button>
            <Button variant="ghost" size="small" onClick={handleLater}>
              Later
            </Button>
          </div>
        </>
      )}

      {/* Downloading state - spinner + progress + hide button */}
      {state === 'downloading' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <div className="spinner" aria-label="Downloading update" />
            <div className="update-notification__progress">
              <strong>Downloading update...</strong>
              <progress
                className="progress-bar"
                value={info.percent ?? 0}
                max={100}
                aria-label="Download progress"
              >
                {info.percent ?? 0}%
              </progress>
              <span className="progress-text">
                {formatBytes(info.transferred ?? 0)} / {formatBytes(info.total ?? 0)} (
                {formatSpeed(info.bytesPerSecond ?? 0)})
              </span>
            </div>
          </div>
          <div className="update-notification__actions">
            <Button variant="ghost" size="small" onClick={handleHide}>
              Hide
            </Button>
          </div>
        </>
      )}

      {/* Downloaded state - icon + text + actions */}
      {state === 'downloaded' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <ArrowSync24Regular className="update-notification__icon" />
            <span className="update-notification__text">
              <strong>Update ready to install</strong> — Version {info.version} has been downloaded
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="primary" size="small" onClick={handleInstall}>
              Restart Now
            </Button>
            <Button variant="ghost" size="small" onClick={handleLater}>
              Later
            </Button>
          </div>
        </>
      )}

      {/* Not available state - simple inline */}
      {state === 'not-available' && (
        <div className="update-notification__content flex items-center gap-3">
          <CheckmarkCircle24Regular className="update-notification__icon" />
          <span className="update-notification__text">You&apos;re up to date ({info.version})</span>
        </div>
      )}

      {/* Error state - icon + text + actions */}
      {state === 'error' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <ErrorCircle24Regular className="update-notification__icon" />
            <span className="update-notification__text">
              <strong>Update failed</strong> — {info.errorMessage}
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="ghost" size="small" onClick={handleRetry}>
              Retry
            </Button>
            <button
              className="update-notification__dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <Dismiss24Regular />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}
