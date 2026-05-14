import type { JSX } from 'react'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { SearchBar } from '@renderer/components/SearchBar'
import { Select } from '@renderer/components/Select'
import { FolderOpen20Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { FilterOption, SortOption } from '../../types'

interface DownloadsHeaderProps {
  // Search/Filter/Sort
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: FilterOption
  onStatusFilterChange: (filter: FilterOption) => void
  sortOption: SortOption
  onSortChange: (option: SortOption) => void

  // Stats
  activeCount: number
  queuedCount: number
  completedCount: number
  failedCount: number

  // Actions
  onOpenFolder: () => void
  onClearCompleted: () => void
  onCancelAllQueued: () => void
  onRetryAllFailed: () => void
}

export function DownloadsHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortChange,
  activeCount,
  queuedCount,
  completedCount,
  failedCount,
  onOpenFolder,
  onClearCompleted,
  onCancelAllQueued,
  onRetryAllFailed
}: Readonly<DownloadsHeaderProps>): JSX.Element {
  const { t } = useTranslation(['downloads', 'common'])

  const statusFilterOptions = [
    { value: 'all', label: t('downloads:filterOptions.allStatus') },
    { value: 'active', label: t('downloads:filterOptions.active') },
    { value: 'completed', label: t('downloads:filterOptions.completed') },
    { value: 'failed', label: t('downloads:filterOptions.failed') }
  ]

  const sortOptions = [
    { value: 'recent', label: t('downloads:sortOptions.recent') },
    { value: 'largest', label: t('downloads:sortOptions.largestFirst') },
    { value: 'smallest', label: t('downloads:sortOptions.smallestFirst') },
    { value: 'az', label: t('downloads:sortOptions.az') },
    { value: 'za', label: t('downloads:sortOptions.za') }
  ]

  return (
    <>
      {/* Search/Filter/Sort Bar */}
      <div className="downloads-controls flex gap-3 items-start">
        <div className="downloads-controls__search">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={t('downloads:searchPlaceholder')}
          />
        </div>

        <div className="downloads-controls__filter">
          <Select
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value as FilterOption)}
            options={statusFilterOptions}
            placeholder={t('downloads:filterByStatus')}
          />
        </div>

        <div className="downloads-controls__sort">
          <Select
            value={sortOption}
            onChange={(value) => onSortChange(value as SortOption)}
            options={sortOptions}
            placeholder={t('downloads:sortBy')}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="downloads-stats flex justify-between items-center">
        <div className="downloads-stats__badges flex items-center gap-2 flex-wrap">
          <Badge variant="info" size="medium">
            {t('downloads:stats.active', { count: activeCount })}
          </Badge>
          {queuedCount > 0 && (
            <Badge variant="default" size="medium">
              {t('downloads:stats.queued', { count: queuedCount })}
            </Badge>
          )}
          <Badge variant="success" size="medium">
            {t('downloads:stats.completed', { count: completedCount })}
          </Badge>
          {failedCount > 0 && (
            <Badge variant="error" size="medium">
              {t('downloads:stats.failed', { count: failedCount })}
            </Badge>
          )}
        </div>

        <div className="downloads-stats__actions flex gap-2">
          <Button
            variant="ghost"
            size="small"
            icon={<FolderOpen20Regular />}
            onClick={onOpenFolder}
            title={t('downloads:actions.openFolder')}
          >
            {t('downloads:actions.openFolder')}
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={onClearCompleted}
            disabled={completedCount === 0}
            title={t('downloads:actions.hideCompletedTooltip')}
          >
            {t('downloads:actions.hideCompleted')}
          </Button>

          {queuedCount > 0 && (
            <Button
              variant="warning"
              size="small"
              onClick={onCancelAllQueued}
              title={t('downloads:actions.cancelAllQueuedTooltip')}
            >
              {t('downloads:actions.cancelAllQueued')}
            </Button>
          )}

          {failedCount > 0 && (
            <Button
              variant="accent"
              size="small"
              onClick={onRetryAllFailed}
              disabled={activeCount > 0}
              title={
                activeCount > 0
                  ? t('downloads:actions.retryAllFailedDisabled')
                  : t('downloads:actions.retryAllFailedTooltip')
              }
            >
              {t('downloads:actions.retryAllFailed')}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
