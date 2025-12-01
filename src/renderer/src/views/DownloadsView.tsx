import type { JSX } from 'react'
import { useState } from 'react'
import { ProgressBar } from '@renderer/components/ProgressBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { useToast } from '@renderer/components/Toast'
import { ArrowDownload24Regular } from '@fluentui/react-icons'

interface Download {
  id: string
  mangaTitle: string
  chapterNumber: string
  progress: number
  status: 'downloading' | 'paused' | 'completed' | 'error'
  speed?: string
  eta?: string
}

// Mock download data
const mockDownloads: Download[] = [
  {
    id: '1',
    mangaTitle: 'One Piece',
    chapterNumber: 'Chapter 1051',
    progress: 75,
    status: 'downloading',
    speed: '2.5 MB/s',
    eta: '5s'
  },
  {
    id: '2',
    mangaTitle: 'Attack on Titan',
    chapterNumber: 'Chapter 139',
    progress: 100,
    status: 'completed'
  },
  {
    id: '3',
    mangaTitle: 'Hunter × Hunter',
    chapterNumber: 'Chapter 390',
    progress: 45,
    status: 'paused',
    speed: '0 MB/s',
    eta: 'Paused'
  },
  {
    id: '4',
    mangaTitle: 'My Hero Academia',
    chapterNumber: 'Chapter 400',
    progress: 30,
    status: 'downloading',
    speed: '1.8 MB/s',
    eta: '12s'
  },
  {
    id: '5',
    mangaTitle: 'Jujutsu Kaisen',
    chapterNumber: 'Chapter 250',
    progress: 20,
    status: 'error'
  }
]

export function DownloadsView(): JSX.Element {
  const [downloads, setDownloads] = useState<Download[]>(mockDownloads)
  const { show: showToast } = useToast()

  const handlePauseResume = (id: string): void => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: d.status === 'paused' ? 'downloading' : 'paused',
              speed: d.status === 'paused' ? '2.0 MB/s' : '0 MB/s',
              eta: d.status === 'paused' ? '10s' : 'Paused'
            }
          : d
      )
    )
    showToast({
      title: 'Download updated',
      message: `Download ${downloads.find((d) => d.id === id)?.status === 'paused' ? 'resumed' : 'paused'}`,
      variant: 'info',
      duration: 2000
    })
  }

  const handleCancel = (id: string): void => {
    setDownloads((prev) => prev.filter((d) => d.id !== id))
    showToast({
      title: 'Cancelled',
      message: 'Download cancelled',
      variant: 'warning',
      duration: 2000
    })
  }

  const handleRetry = (id: string): void => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: 'downloading', progress: 0, speed: '2.0 MB/s', eta: '15s' }
          : d
      )
    )
    showToast({
      title: 'Retrying',
      message: 'Download retrying...',
      variant: 'info',
      duration: 2000
    })
  }

  const handleClearCompleted = (): void => {
    const completedCount = downloads.filter((d) => d.status === 'completed').length
    setDownloads((prev) => prev.filter((d) => d.status !== 'completed'))
    showToast({
      title: 'Cleared',
      message: `Cleared ${completedCount} completed download${completedCount === 1 ? '' : 's'}`,
      variant: 'success',
      duration: 2000
    })
  }

  const activeDownloads = downloads.filter((d) => d.status === 'downloading').length
  const completedDownloads = downloads.filter((d) => d.status === 'completed').length
  const errorDownloads = downloads.filter((d) => d.status === 'error').length

  const getProgressVariant = (status: Download['status']): 'default' | 'success' | 'error' => {
    if (status === 'completed') return 'success'
    if (status === 'error') return 'error'
    return 'default'
  }

  const getBadgeVariant = (
    status: Download['status']
  ): 'default' | 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'downloading':
        return 'info'
      case 'completed':
        return 'success'
      case 'paused':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Download stats */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: 'var(--win-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--win-border-default)'
        }}
      >
        <div>
          <Badge variant="info" size="medium">
            {activeDownloads} Active
          </Badge>
        </div>
        <div>
          <Badge variant="success" size="medium">
            {completedDownloads} Completed
          </Badge>
        </div>
        {errorDownloads > 0 && (
          <div>
            <Badge variant="error" size="medium">
              {errorDownloads} Failed
            </Badge>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            size="small"
            onClick={handleClearCompleted}
            disabled={completedDownloads === 0}
          >
            Clear Completed
          </Button>
        </div>
      </div>

      {/* Downloads list */}
      {downloads.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--win-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <ArrowDownload24Regular
            style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}
          />
          <p>No downloads. When you start downloading chapters, they will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {downloads.map((download) => (
            <div
              key={download.id}
              style={{
                padding: '16px',
                background: 'var(--win-bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--win-border-default)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{download.mangaTitle}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--win-text-secondary)' }}>
                    {download.chapterNumber}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(download.status)} size="small">
                  {download.status}
                </Badge>
              </div>

              {/* Progress bar */}
              <ProgressBar
                value={download.progress}
                variant={getProgressVariant(download.status)}
                size="medium"
                showLabel
                speed={download.status === 'downloading' ? download.speed : undefined}
                eta={download.status === 'downloading' ? download.eta : undefined}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {download.status === 'downloading' && (
                  <>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handlePauseResume(download.id)}
                    >
                      Pause
                    </Button>
                    <Button variant="danger" size="small" onClick={() => handleCancel(download.id)}>
                      Cancel
                    </Button>
                  </>
                )}
                {download.status === 'paused' && (
                  <>
                    <Button
                      variant="accent"
                      size="small"
                      onClick={() => handlePauseResume(download.id)}
                    >
                      Resume
                    </Button>
                    <Button variant="danger" size="small" onClick={() => handleCancel(download.id)}>
                      Cancel
                    </Button>
                  </>
                )}
                {download.status === 'error' && (
                  <>
                    <Button variant="accent" size="small" onClick={() => handleRetry(download.id)}>
                      Retry
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleCancel(download.id)}
                    >
                      Remove
                    </Button>
                  </>
                )}
                {download.status === 'completed' && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleCancel(download.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
