import type { JSX } from 'react'
import { DownloadStatusBadge } from '@renderer/components/DownloadStatusBadge'
import type { DownloadStatus } from '@renderer/components/DownloadStatusBadge'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { ChapterContract } from '../../../../../../preload/window.types'

type ChapterEntity = ChapterContract

interface ChapterListItemProps {
  readonly chapter: ChapterEntity
  readonly onClick: () => void
  readonly isRead?: boolean
  readonly isInProgress?: boolean
  readonly pageProgress?: { currentPage: number; totalPages: number }
  readonly downloadStatus?: DownloadStatus
  readonly onDownloadClick?: () => void
  readonly isOnline?: boolean
}

/**
 * Individual chapter item component
 */
export function ChapterListItem({
  chapter,
  onClick,
  isRead,
  isInProgress,
  pageProgress,
  downloadStatus = 'not-downloaded',
  onDownloadClick,
  isOnline = true
}: ChapterListItemProps): JSX.Element {
  const { t } = useTranslation(['mangaDetail', 'common'])

  const chapterNum = chapter.chapter || '0'
  const title =
    chapter.title || t('mangaDetail:chapters.item.untitled', { defaultValue: 'Untitled' })
  const publishDate = new Date(chapter.publishAt).toLocaleDateString()

  // Get scanlation group name
  const groupName =
    Object.values(chapter.scanlationGroup)[0] ||
    t('mangaDetail:chapters.item.unknownGroup', { defaultValue: 'Unknown Group' })

  // Determine status classes
  let statusClass = ''
  if (isInProgress) {
    statusClass = 'chapter-item--in-progress'
  } else if (isRead) {
    statusClass = 'chapter-item--read'
  }

  return (
    <div
      className={`chapter-item ${statusClass}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('mangaDetail:chapters.item.readChapter', {
        defaultValue: 'Read Chapter {{number}}: {{title}}',
        number: chapterNum,
        title
      })}
    >
      <div className="chapter-item__content flex justify-between items-center gap-3">
        <div className="chapter-item__main flex gap-2 items-start">
          <span className="chapter-item__number">
            {t('mangaDetail:chapters.item.chapterPrefix', { defaultValue: 'Ch.' })} {chapterNum}
          </span>
          <div className="chapter-item__info flex flex-col gap-1">
            {title && <span className="chapter-item__title">{title}</span>}
            <span className="chapter-item__group">{groupName}</span>
          </div>
        </div>

        <div className="chapter-item__meta flex gap-3 items-center">
          {pageProgress && (
            <span className="chapter-item__progress">
              {t('mangaDetail:chapters.item.pagePrefix', { defaultValue: 'p.' })}{' '}
              {pageProgress.currentPage + 1}/{pageProgress.totalPages}
            </span>
          )}
          <DownloadStatusBadge
            status={downloadStatus}
            isOnline={isOnline}
            onClick={(e) => {
              e.stopPropagation()
              onDownloadClick?.()
            }}
          />
          <span className="chapter-item__date">{publishDate}</span>
        </div>
      </div>
    </div>
  )
}
