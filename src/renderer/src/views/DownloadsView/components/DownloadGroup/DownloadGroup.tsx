import type { JSX } from 'react'
import { Badge } from '@renderer/components/Badge'
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { Download, formatStorageSize } from '@renderer/types/download.types'
import { DownloadCard } from '../DownloadCard'

interface DownloadGroupProps {
  group: {
    mangaId: string
    mangaTitle: string
    totalChapters: number
    activeChapters: number
    failedChapters: number
    totalStorageSize: number
    downloads: Download[]
    isExpanded: boolean
  }
  onToggle: (mangaId: string) => void
  onNavigateToManga: (mangaId: string, e: React.MouseEvent) => void
  onDownloadAction: {
    cancel: (chapterId: string) => Promise<void>
    retry: (chapterId: string) => Promise<void>
    remove: (chapterId: string) => Promise<void>
  }
  onNavigateToReader: (mangaId: string, chapterId: string) => void
}

export function DownloadGroup({
  group,
  onToggle,
  onNavigateToManga,
  onDownloadAction,
  onNavigateToReader
}: Readonly<DownloadGroupProps>): JSX.Element {
  const { t } = useTranslation(['downloads', 'common'])

  return (
    <div className="download-group">
      {/* Group Header */}
      <div
        className="download-group__header flex justify-between items-center"
        onClick={() => onToggle(group.mangaId)}
      >
        <div className="download-group__header-left">
          {group.isExpanded ? (
            <ChevronDown20Regular className="download-group__chevron" />
          ) : (
            <ChevronRight20Regular className="download-group__chevron" />
          )}

          <a
            href="#"
            className="download-group__title-link"
            onClick={(e) => {
              e.preventDefault()
              onNavigateToManga(group.mangaId, e)
            }}
          >
            <h3 className="download-group__title">{group.mangaTitle}</h3>
          </a>
        </div>

        <div className="download-group__header-right flex items-center gap-3">
          <span className="download-group__stats">
            {t('downloads:downloadGroup.chapterCount', {
              count: group.totalChapters,
              s: group.totalChapters === 1 ? '' : 's'
            })}{' '}
            · {formatStorageSize(group.totalStorageSize)}
          </span>

          {group.activeChapters > 0 && (
            <Badge variant="info" size="small">
              {t('downloads:downloadGroup.activeBadge', { count: group.activeChapters })}
            </Badge>
          )}
          {group.failedChapters > 0 && (
            <Badge variant="error" size="small">
              {t('downloads:downloadGroup.failedBadge', { count: group.failedChapters })}
            </Badge>
          )}
        </div>
      </div>

      {/* Group Chapters */}
      {group.isExpanded && (
        <div className="download-group__chapters flex flex-col">
          {group.downloads.map((download) => (
            <DownloadCard
              key={download.id}
              download={download}
              onCancel={onDownloadAction.cancel}
              onRetry={onDownloadAction.retry}
              onRemove={onDownloadAction.remove}
              onNavigateToReader={onNavigateToReader}
            />
          ))}
        </div>
      )}
    </div>
  )
}
