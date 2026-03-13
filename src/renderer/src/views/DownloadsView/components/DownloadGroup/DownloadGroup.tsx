import type { JSX } from 'react'
import { Badge } from '@renderer/components/Badge'
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons'
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
  return (
    <div className="download-group">
      {/* Group Header */}
      <div className="download-group__header" onClick={() => onToggle(group.mangaId)}>
        <div className="download-group__header-left">
          {group.isExpanded ? (
            <ChevronDown20Regular className="download-group__chevron" />
          ) : (
            <ChevronRight20Regular className="download-group__chevron" />
          )}

          <a
            href="#"
            className="download-group__title-link"
            onClick={(e) => onNavigateToManga(group.mangaId, e)}
          >
            <h3 className="download-group__title">{group.mangaTitle}</h3>
          </a>
        </div>

        <div className="download-group__header-right">
          <span className="download-group__stats">
            {group.totalChapters} chapter
            {group.totalChapters === 1 ? '' : 's'} · {formatStorageSize(group.totalStorageSize)}
          </span>

          {group.activeChapters > 0 && (
            <Badge variant="info" size="small">
              {group.activeChapters} active
            </Badge>
          )}
          {group.failedChapters > 0 && (
            <Badge variant="error" size="small">
              {group.failedChapters} failed
            </Badge>
          )}
        </div>
      </div>

      {/* Group Chapters */}
      {group.isExpanded && (
        <div className="download-group__chapters">
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
