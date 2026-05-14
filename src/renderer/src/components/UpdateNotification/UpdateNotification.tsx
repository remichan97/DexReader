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
import { useTranslation } from '@renderer/hooks/useTranslation'
import { Button } from '@renderer/components/Button'
import { rendererLog } from '@renderer/services/logging.service'
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
  const { t } = useTranslation('common')

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
    try {
      // Set completion flag in localStorage (survives update)
      localStorage.setItem('dexreader:updateJustCompleted', 'true')
      localStorage.setItem('dexreader:newVersion', info.version || 'unknown')

      rendererLog.info('[UpdateNotification] Set update completion flags in localStorage')

      // Trigger app quit & install
      await globalThis.appUpdate.installUpdate()
      // App will quit here - next startup will be new version
    } catch (error) {
      rendererLog.error('[UpdateNotification] Failed to install update:', error)
    }
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
          <div className="spinner" aria-label={t('updateNotification.checking.ariaLabel')} />
          <span className="update-notification__text">
            {t('updateNotification.checking.message')}
          </span>
        </div>
      )}

      {/* Available state - icon + text + actions */}
      {state === 'available' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <ArrowDownload24Regular className="update-notification__icon" />
            <span className="update-notification__text">
              <strong>{t('updateNotification.available.title')}</strong> —{' '}
              {t('updateNotification.available.description', { version: info.version })}
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="primary" size="small" onClick={handleDownload}>
              {t('updateNotification.available.downloadButton')}
            </Button>
            <Button variant="ghost" size="small" onClick={handleLater}>
              {t('updateNotification.available.laterButton')}
            </Button>
          </div>
        </>
      )}

      {/* Downloading state - spinner + progress + hide button */}
      {state === 'downloading' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <div className="spinner" aria-label={t('updateNotification.downloading.ariaLabel')} />
            <div className="update-notification__progress">
              <strong>{t('updateNotification.downloading.title')}</strong>
              <progress
                className="update-notification__progress-bar"
                value={info.percent ?? 0}
                max={100}
                aria-label={t('updateNotification.downloading.progressAriaLabel')}
              >
                {info.percent ?? 0}%
              </progress>
              <span className="progress-text">
                {t('updateNotification.downloading.progressDetails', {
                  transferred: formatBytes(info.transferred ?? 0, t),
                  total: formatBytes(info.total ?? 0, t),
                  speed: formatSpeed(info.bytesPerSecond ?? 0, t)
                })}
              </span>
            </div>
          </div>
          <div className="update-notification__actions">
            <Button variant="ghost" size="small" onClick={handleHide}>
              {t('updateNotification.downloading.hideButton')}
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
              <strong>{t('updateNotification.downloaded.title')}</strong> —{' '}
              {t('updateNotification.downloaded.description', { version: info.version })}
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="primary" size="small" onClick={handleInstall}>
              {t('updateNotification.downloaded.restartButton')}
            </Button>
            <Button variant="ghost" size="small" onClick={handleLater}>
              {t('updateNotification.downloaded.laterButton')}
            </Button>
          </div>
        </>
      )}

      {/* Not available state - simple inline */}
      {state === 'not-available' && (
        <div className="update-notification__content flex items-center gap-3">
          <CheckmarkCircle24Regular className="update-notification__icon" />
          <span className="update-notification__text">
            {t('updateNotification.notAvailable.message', { version: info.version })}
          </span>
        </div>
      )}

      {/* Error state - icon + text + actions */}
      {state === 'error' && (
        <>
          <div className="update-notification__content flex items-center gap-3">
            <ErrorCircle24Regular className="update-notification__icon" />
            <span className="update-notification__text">
              <strong>{t('updateNotification.error.title')}</strong> — {info.errorMessage}
            </span>
          </div>
          <div className="update-notification__actions">
            <Button variant="ghost" size="small" onClick={handleRetry}>
              {t('updateNotification.error.retryButton')}
            </Button>
            <button
              className="update-notification__dismiss"
              onClick={handleDismiss}
              aria-label={t('updateNotification.error.dismissAriaLabel')}
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
function formatBytes(bytes: number, t: (key: string) => string): string {
  if (bytes === 0) return `0 ${t('updateNotification.units.bytes')}`
  const k = 1024
  const sizes = [
    t('updateNotification.units.bytes'),
    t('updateNotification.units.kilobytes'),
    t('updateNotification.units.megabytes'),
    t('updateNotification.units.gigabytes')
  ]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatSpeed(bytesPerSecond: number, t: (key: string) => string): string {
  return `${formatBytes(bytesPerSecond, t)}${t('updateNotification.units.perSecond')}`
}
