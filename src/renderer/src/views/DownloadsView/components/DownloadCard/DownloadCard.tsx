import type { JSX } from 'react'
import { ProgressBar } from '@renderer/components/ProgressBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { Download, formatStorageSize } from '@renderer/types/download.types'

interface DownloadCardProps {
  readonly download: Download
  readonly onCancel: (chapterId: string) => Promise<void>
  readonly onRetry: (chapterId: string) => Promise<void>
  readonly onRemove: (chapterId: string) => Promise<void>
  readonly onNavigateToReader: (mangaId: string, chapterId: string) => void
}

// Helper functions
const getBadgeVariant = (status: Download['status']): 'default' | 'success' | 'error' | 'info' => {
  switch (status) {
    case 'queued':
      return 'default'
    case 'downloading':
      return 'info'
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
  }
}

const getProgressVariant = (status: Download['status']): 'default' | 'success' | 'error' => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  return 'default'
}

export function DownloadCard({
  download,
  onCancel,
  onRetry,
  onRemove,
  onNavigateToReader
}: Readonly<DownloadCardProps>): JSX.Element {
  const { t } = useTranslation(['common', 'downloads'])

  return (
    <div
      className="download-card"
      onClick={() => onNavigateToReader(download.mangaId, download.id)}
    >
      {/* Chapter info */}
      <div className="download-card__header flex justify-between items-start">
        <div className="download-card__info">
          <h4 className="download-card__chapter">
            {download.volume ? `Vol. ${download.volume} ` : ''}
            Ch. {download.chapterNumber}
          </h4>
          {download.chapterTitle && <p className="download-card__title">{download.chapterTitle}</p>}
          <p className="download-card__meta">
            {download.language?.toUpperCase()} · {download.totalPages} {t('common:general.pages')} ·{' '}
            {formatStorageSize(download.storageSize)}
          </p>
        </div>

        <Badge variant={getBadgeVariant(download.status)} size="small">
          {t(`downloads:status.${download.status}`)}
        </Badge>
      </div>

      {/* Progress bar */}
      {download.status === 'queued' && (
        <div className="download-card__queued">{t('downloads:status.queuedMessage')}</div>
      )}

      {download.status === 'downloading' && (
        <div className="download-card__progress">
          <ProgressBar
            value={download.progress}
            variant={getProgressVariant(download.status)}
            size="medium"
            showLabel
          />
          <div className="download-card__progress-info flex justify-between items-center">
            <span>
              {t('downloads:status.progress', {
                current: download.currentPage || 0,
                total: download.totalPages
              })}
            </span>
          </div>
        </div>
      )}

      {download.status === 'completed' && (
        <div className="download-card__completed">
          <ProgressBar value={100} variant="success" size="medium" showLabel />
        </div>
      )}

      {download.status === 'failed' && (
        <div className="download-card__error">
          <ProgressBar value={download.progress} variant="error" size="medium" showLabel />
          {download.errorMessage && (
            <p className="download-card__error-message">{download.errorMessage}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className="download-card__actions flex gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {(download.status === 'downloading' || download.status === 'queued') && (
          <Button variant="danger" size="small" onClick={() => onCancel(download.id)}>
            {t('common:button.cancel')}
          </Button>
        )}

        {download.status === 'failed' && (
          <>
            <Button variant="accent" size="small" onClick={() => onRetry(download.id)}>
              {t('common:button.retry')}
            </Button>
            <Button variant="secondary" size="small" onClick={() => onRemove(download.id)}>
              {t('common:button.remove')}
            </Button>
          </>
        )}

        {download.status === 'completed' && (
          <Button variant="secondary" size="small" onClick={() => onRemove(download.id)}>
            {t('common:button.remove')}
          </Button>
        )}
      </div>
    </div>
  )
}
