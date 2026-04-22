import type { JSX } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@renderer/components/EmptyState'
import { LoadingState } from '@renderer/components/LoadingState'
import { ErrorState } from '@renderer/components/ErrorState'
import { ArrowDownload24Regular } from '@fluentui/react-icons'
import { DownloadsHeader } from './components/DownloadsHeader'
import { DownloadGroup } from './components/DownloadGroup'
import { useDownloadData } from './hooks/useDownloadData'
import { useDownloadActions } from './hooks/useDownloadActions'
import { useDownloadGroups } from './hooks/useDownloadGroups'
import type { FilterOption, SortOption } from './types'
import './DownloadsView.css'

export function DownloadsView(): JSX.Element {
  const navigate = useNavigate()

  // Search/Filter/Sort state (kept in parent for control)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')

  // Use custom hooks for data, actions, and grouping
  const {
    downloads,
    loading,
    error,
    activeCount,
    queuedCount,
    completedCount,
    failedCount,
    reload
  } = useDownloadData()

  const actions = useDownloadActions({
    downloads,
    activeCount,
    onRefresh: reload
  })

  const { groupedDownloads, toggleGroup } = useDownloadGroups({
    downloads,
    searchQuery,
    statusFilter,
    sortOption
  })

  // Navigation handlers
  const handleNavigateToManga = (mangaId: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    navigate(`/browse/${mangaId}`)
  }

  const handleNavigateToReader = (mangaId: string, chapterId: string): void => {
    navigate(`/reader/${mangaId}/${chapterId}`)
  }

  // Render loading state
  if (loading) {
    return <LoadingState message="Loading downloads..." />
  }

  // Render error state
  if (error) {
    return <ErrorState message={error} onRetry={() => reload()} />
  }

  // Render main UI
  return (
    <div className="downloads-view">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">Downloads</h1>

      <DownloadsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        activeCount={activeCount}
        queuedCount={queuedCount}
        completedCount={completedCount}
        failedCount={failedCount}
        onOpenFolder={actions.handleOpenDownloadsFolder}
        onClearCompleted={actions.handleClearCompleted}
        onCancelAllQueued={actions.handleCancelAllQueued}
        onRetryAllFailed={actions.handleRetryAllFailed}
      />

      {/* Downloads List - Grouped by Manga */}
      {groupedDownloads.length === 0 ? (
        <EmptyState
          icon={<ArrowDownload24Regular />}
          message="Nothing downloaded yet. Chapters you download will show up here!"
        />
      ) : (
        <div className="downloads-groups flex flex-col gap-4">
          {groupedDownloads.map((group) => (
            <DownloadGroup
              key={group.mangaId}
              group={group}
              onToggle={toggleGroup}
              onNavigateToManga={handleNavigateToManga}
              onDownloadAction={{
                cancel: actions.handleCancel,
                retry: actions.handleRetry,
                remove: actions.handleRemove
              }}
              onNavigateToReader={handleNavigateToReader}
            />
          ))}
        </div>
      )}
    </div>
  )
}
