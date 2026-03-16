import type { JSX } from 'react'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { SearchBar } from '@renderer/components/SearchBar'
import { Select } from '@renderer/components/Select'
import { FolderOpen20Regular } from '@fluentui/react-icons'
import type { FilterOption, SortOption } from '../../types'
import { statusFilterOptions, sortOptions } from '../../types'

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
  return (
    <>
      {/* Search/Filter/Sort Bar */}
      <div className="downloads-controls flex gap-3 items-start">
        <div className="downloads-controls__search">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search downloads..."
          />
        </div>

        <div className="downloads-controls__filter">
          <Select
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value as FilterOption)}
            options={statusFilterOptions}
            placeholder="Filter by status"
          />
        </div>

        <div className="downloads-controls__sort">
          <Select
            value={sortOption}
            onChange={(value) => onSortChange(value as SortOption)}
            options={sortOptions}
            placeholder="Sort by"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="downloads-stats flex justify-between items-center">
        <div className="downloads-stats__badges">
          <Badge variant="info" size="medium">
            {activeCount} Active
          </Badge>
          {queuedCount > 0 && (
            <Badge variant="default" size="medium">
              {queuedCount} Queued
            </Badge>
          )}
          <Badge variant="success" size="medium">
            {completedCount} Completed
          </Badge>
          {failedCount > 0 && (
            <Badge variant="error" size="medium">
              {failedCount} Failed
            </Badge>
          )}
        </div>

        <div className="downloads-stats__actions flex gap-2">
          <Button
            variant="ghost"
            size="small"
            icon={<FolderOpen20Regular />}
            onClick={onOpenFolder}
            title="Open downloads folder"
          >
            Open Folder
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={onClearCompleted}
            disabled={completedCount === 0}
          >
            Clear Completed
          </Button>

          {queuedCount > 0 && (
            <Button
              variant="warning"
              size="small"
              onClick={onCancelAllQueued}
              title="Cancel all queued downloads"
            >
              Cancel All Queued
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
                  ? 'Wait for current downloads to finish'
                  : 'Retry all failed downloads'
              }
            >
              Retry All Failed
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
