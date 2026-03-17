import type { JSX } from 'react'
import {
  ArrowDownload20Regular,
  ArrowClockwise20Regular,
  Checkmark20Regular,
  Warning20Regular,
  MoreHorizontal20Regular
} from '@fluentui/react-icons'
import './DownloadStatusBadge.css'

export type DownloadStatus = 'not-downloaded' | 'queued' | 'downloading' | 'downloaded' | 'failed'

interface DownloadStatusBadgeProps {
  readonly status: DownloadStatus
  readonly progress?: {
    current: number
    total: number
  }
  readonly onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  readonly disabled?: boolean
}

/**
 * DownloadStatusBadge - Status indicator and action button for chapter downloads
 *
 * Shows download status and allows users to initiate or retry downloads
 * Displays in chapter list rows in MangaDetailView
 */
export function DownloadStatusBadge({
  status,
  progress,
  onClick,
  disabled = false
}: DownloadStatusBadgeProps): JSX.Element {
  const getIcon = (): JSX.Element => {
    switch (status) {
      case 'not-downloaded':
        return <ArrowDownload20Regular />
      case 'downloading':
        return <ArrowClockwise20Regular className="download-badge__icon--spinning" />
      case 'queued':
        return <MoreHorizontal20Regular />
      case 'downloaded':
        return <Checkmark20Regular />
      case 'failed':
        return <Warning20Regular />
    }
  }

  const getLabel = (): string => {
    switch (status) {
      case 'not-downloaded':
        return 'Download chapter'
      case 'downloading':
        return progress
          ? `Downloading... ${progress.current} of ${progress.total} pages`
          : 'Downloading...'
      case 'queued':
        return 'Download queued'
      case 'downloaded':
        return 'Chapter downloaded'
      case 'failed':
        return 'Download failed. Click to retry'
    }
  }

  const getContent = (): JSX.Element | string => {
    if (status === 'downloading' && progress) {
      return (
        <>
          {getIcon()}
          <span className="download-badge__text">{`${progress.current}/${progress.total}`}</span>
        </>
      )
    }
    return getIcon()
  }

  const isClickable = status === 'not-downloaded' || status === 'failed'
  const isInteractive = isClickable && !disabled

  return (
    <button
      type="button"
      className={`download-badge download-badge--${status} inline-flex items-center justify-center gap-1`}
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      title={getLabel()}
      aria-label={getLabel()}
      aria-disabled={!isInteractive}
    >
      {getContent()}
    </button>
  )
}
