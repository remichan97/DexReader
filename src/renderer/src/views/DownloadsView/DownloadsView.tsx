import type { JSX } from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '@renderer/components/ProgressBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { SearchBar } from '@renderer/components/SearchBar'
import { Select, type SelectOption } from '@renderer/components/Select'
import { useToast } from '@renderer/components/Toast'
import {
  ArrowDownload24Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  FolderOpen20Regular
} from '@fluentui/react-icons'
import {
  Download,
  MangaDownloadGroup,
  mapChapterDownloadToFrontend,
  groupDownloadsByManga,
  formatStorageSize
} from '@renderer/types/download.types'
import './DownloadsView.css'

type FilterOption = 'all' | 'active' | 'completed' | 'failed'
type SortOption = 'recent' | 'largest' | 'smallest' | 'az' | 'za'

// Select options
const statusFilterOptions: SelectOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
]

const sortOptions: SelectOption[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'largest', label: 'Largest First' },
  { value: 'smallest', label: 'Smallest First' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' }
]

interface ChapterProgressEvent {
  chapterId: string
  currentPage: number
  totalPages: number
  percentage: number
  bytesDownloaded: number
  status: 'queued' | 'downloading' | 'completed' | 'failed'
}

interface QueueProgressEvent {
  totalChapters: number
  completedChapters: number
  failedChapters: number
  activeDownloads: number
  completedPages: number
  totalPages: number
  overallPercentage: number
  estimatedTimeRemaining?: number
}

export function DownloadsView(): JSX.Element {
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  // State
  const [downloads, setDownloads] = useState<Download[]>([])
  const [groupedDownloads, setGroupedDownloads] = useState<MangaDownloadGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search/Filter/Sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')

  // Stats from queue progress
  const [activeCount, setActiveCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  const isInitialLoad = useRef(true)

  // Load downloads from backend
  const loadDownloads = async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await window.downloads.getAllDownloads()

      if (response.success && response.data) {
        const mapped = response.data.map(mapChapterDownloadToFrontend)
        setDownloads(mapped)

        // Calculate stats
        const active = mapped.filter(
          (d) => d.status === 'downloading' || d.status === 'queued'
        ).length
        const completed = mapped.filter((d) => d.status === 'completed').length
        const failed = mapped.filter((d) => d.status === 'failed').length

        setActiveCount(active)
        setCompletedCount(completed)
        setFailedCount(failed)
      } else {
        setError(response.error?.message || 'Failed to load downloads')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
      isInitialLoad.current = false
    }
  }

  // Handle chapter progress event
  const handleChapterProgress = (event: ChapterProgressEvent): void => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.id === event.chapterId) {
          return {
            ...d,
            currentPage: event.currentPage,
            progress: event.percentage,
            status: event.status
          }
        }
        return d
      })
    )
  }

  // Handle queue progress event
  const handleQueueProgress = (stats: QueueProgressEvent): void => {
    setActiveCount(stats.activeDownloads)
    setCompletedCount(stats.completedChapters)
    setFailedCount(stats.failedChapters)
  }

  // Handle permanent failure event
  const handlePermanentFailure = async ({
    message
  }: {
    chapterId: string
    message: string
  }): Promise<void> => {
    showToast({
      title: 'Download Failed',
      message: message || 'Download failed after retries',
      variant: 'error',
      duration: 5000
    })

    // Reload downloads to get updated status
    await loadDownloads()
  }

  // Auto-collapse group when all chapters completed
  const handleAutoCollapse = (mangaId: string): void => {
    const group = groupedDownloads.find((g) => g.mangaId === mangaId)
    if (group && group.activeChapters === 0 && group.failedChapters === 0) {
      setGroupedDownloads((prev) =>
        prev.map((g) => (g.mangaId === mangaId ? { ...g, isExpanded: false } : g))
      )
    }
  }

  // Action handlers
  const handleCancel = async (chapterId: string): Promise<void> => {
    const response = await globalThis.downloads.removeFromQueue(chapterId)

    if (response.success) {
      showToast({
        title: 'Cancelled',
        message: 'Download cancelled',
        variant: 'warning',
        duration: 2000
      })
      await loadDownloads()
    } else {
      showToast({
        title: 'Error',
        message: response.error?.message || 'Failed to cancel download',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRetry = async (chapterId: string): Promise<void> => {
    const response = await globalThis.downloads.retryDownload(chapterId)

    if (response.success) {
      showToast({
        title: 'Retrying',
        message: 'Download queued for retry',
        variant: 'info',
        duration: 2000
      })
      await loadDownloads()
    } else {
      showToast({
        title: 'Error',
        message: response.error?.message || 'Failed to retry download',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRemove = async (chapterId: string): Promise<void> => {
    const response = await globalThis.downloads.deleteChapter(chapterId)

    if (response.success) {
      setDownloads((prev) => prev.filter((d) => d.id !== chapterId))
      showToast({
        title: 'Removed',
        message: 'Download removed',
        variant: 'success',
        duration: 2000
      })
    } else {
      showToast({
        title: 'Error',
        message: response.error?.message || 'Failed to remove download',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleClearCompleted = async (): Promise<void> => {
    const completedDownloads = downloads.filter((d) => d.status === 'completed')

    if (completedDownloads.length === 0) return

    const results = await Promise.allSettled(
      completedDownloads.map((d) => globalThis.downloads.deleteChapter(d.id))
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length

    showToast({
      title: 'Cleared',
      message: `Cleared ${successCount} completed download${successCount === 1 ? '' : 's'}`,
      variant: 'success',
      duration: 2000
    })

    await loadDownloads()
  }

  const handleRetryAllFailed = async (): Promise<void> => {
    const failedDownloads = downloads.filter((d) => d.status === 'failed')

    if (failedDownloads.length === 0 || activeCount > 0) return

    const results = await Promise.allSettled(
      failedDownloads.map((d) => globalThis.downloads.retryDownload(d.id))
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length

    showToast({
      title: 'Retrying',
      message: `Queued ${successCount} failed download${successCount === 1 ? '' : 's'} for retry`,
      variant: 'info',
      duration: 2000
    })

    await loadDownloads()
  }

  const handleToggleGroup = (mangaId: string): void => {
    setGroupedDownloads((prev) =>
      prev.map((group) =>
        group.mangaId === mangaId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    )
  }

  const handleNavigateToManga = (mangaId: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    navigate(`/manga/${mangaId}`)
  }

  const handleNavigateToReader = (mangaId: string, chapterId: string): void => {
    navigate(`/reader/${mangaId}/${chapterId}`)
  }

  const handleOpenDownloadsFolder = async (): Promise<void> => {
    try {
      const response = await globalThis.fileSystem.openDownloadsFolder()
      if (!response.success) {
        showToast({
          title: 'Error',
          message: 'Failed to open downloads folder',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error opening downloads folder:', error)
      showToast({
        title: 'Error',
        message: 'Failed to open downloads folder',
        variant: 'error'
      })
    }
  }

  // Filter and sort downloads
  const filteredDownloads = useMemo(() => {
    let filtered = downloads

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((d) => d.status === 'downloading' || d.status === 'queued')
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((d) => d.status === 'completed')
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter((d) => d.status === 'failed')
    }

    // Apply search
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.mangaTitle.toLowerCase().includes(searchLower) ||
          d.chapterNumber.toLowerCase().includes(searchLower) ||
          d.chapterTitle?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [downloads, statusFilter, searchQuery])

  // Group and sort
  const sortedGroups = useMemo(() => {
    const groups = groupDownloadsByManga(filteredDownloads)

    // Apply sort
    return [...groups].sort((a, b) => {
      switch (sortOption) {
        case 'recent': {
          const aRecent = Math.max(...a.downloads.map((d) => d.downloadedAt))
          const bRecent = Math.max(...b.downloads.map((d) => d.downloadedAt))
          return bRecent - aRecent
        }
        case 'largest':
          return b.totalStorageSize - a.totalStorageSize
        case 'smallest':
          return a.totalStorageSize - b.totalStorageSize
        case 'az':
          return a.mangaTitle.localeCompare(b.mangaTitle)
        case 'za':
          return b.mangaTitle.localeCompare(a.mangaTitle)
        default:
          return 0
      }
    })
  }, [filteredDownloads, sortOption])

  // Update grouped downloads state
  useEffect(() => {
    setGroupedDownloads((prevGroups) => {
      // Preserve expansion state
      const expansionState = new Map(prevGroups.map((g) => [g.mangaId, g.isExpanded]))

      return sortedGroups.map((group) => ({
        ...group,
        isExpanded: expansionState.get(group.mangaId) ?? true
      }))
    })
  }, [sortedGroups])

  // Load downloads on mount + auto-refresh
  useEffect(() => {
    loadDownloads(true) // Show loading on initial load

    // Auto-refresh every 5 seconds without showing loading state
    const interval = setInterval(() => {
      loadDownloads(false) // Don't show loading on auto-refresh
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Event listeners
  useEffect(() => {
    const unsubChapterProgress = globalThis.electron.ipcRenderer.on(
      'download:chapter-progress',
      (_event: unknown, data: ChapterProgressEvent) => {
        handleChapterProgress(data)
      }
    )

    const unsubQueueProgress = globalThis.electron.ipcRenderer.on(
      'download:queue-progress',
      (_event: unknown, stats: QueueProgressEvent) => {
        handleQueueProgress(stats)
      }
    )

    const unsubFailure = globalThis.electron.ipcRenderer.on(
      'download:permanent-failure',
      (_event: unknown, data: { chapterId: string; message: string }) => {
        handlePermanentFailure(data)
      }
    )

    return () => {
      unsubChapterProgress()
      unsubQueueProgress()
      unsubFailure()
    }
  }, [])

  // Auto-collapse groups when appropriate
  useEffect(() => {
    groupedDownloads.forEach((group) => {
      if (group.activeChapters === 0 && group.failedChapters === 0) {
        handleAutoCollapse(group.mangaId)
      }
    })
  }, [groupedDownloads])

  // Helper functions for UI
  const getBadgeVariant = (
    status: Download['status']
  ): 'default' | 'success' | 'error' | 'info' => {
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

  // Render loading state
  if (loading) {
    return (
      <div className="downloads-view__loading">
        <div className="downloads-view__spinner" />
        <p>Loading downloads...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="downloads-view__error">
        <p className="downloads-view__error-message">{error}</p>
        <Button onClick={() => loadDownloads(true)} variant="accent">
          Retry
        </Button>
      </div>
    )
  }

  // Render main UI
  return (
    <div className="downloads-view">
      {/* Search/Filter/Sort Bar */}
      <div className="downloads-controls">
        <div className="downloads-controls__search">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search downloads..."
          />
        </div>

        <div className="downloads-controls__filter">
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as FilterOption)}
            options={statusFilterOptions}
            placeholder="Filter by status"
          />
        </div>

        <div className="downloads-controls__sort">
          <Select
            value={sortOption}
            onChange={(value) => setSortOption(value as SortOption)}
            options={sortOptions}
            placeholder="Sort by"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="downloads-stats">
        <div className="downloads-stats__badges">
          <Badge variant="info" size="medium">
            {activeCount} Active
          </Badge>
          <Badge variant="success" size="medium">
            {completedCount} Completed
          </Badge>
          {failedCount > 0 && (
            <Badge variant="error" size="medium">
              {failedCount} Failed
            </Badge>
          )}
        </div>

        <div className="downloads-stats__actions">
          <Button
            variant="ghost"
            size="small"
            icon={<FolderOpen20Regular />}
            onClick={handleOpenDownloadsFolder}
            title="Open downloads folder"
          >
            Open Folder
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={handleClearCompleted}
            disabled={completedCount === 0}
          >
            Clear Completed
          </Button>

          {failedCount > 0 && (
            <Button
              variant="accent"
              size="small"
              onClick={handleRetryAllFailed}
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

      {/* Downloads List - Grouped by Manga */}
      {groupedDownloads.length === 0 ? (
        <div className="downloads-view__empty">
          <ArrowDownload24Regular className="downloads-view__empty-icon" />
          <p>No downloads. When you start downloading chapters, they will appear here.</p>
        </div>
      ) : (
        <div className="downloads-groups">
          {groupedDownloads.map((group) => (
            <div key={group.mangaId} className="download-group">
              {/* Group Header */}
              <div
                className="download-group__header"
                onClick={() => handleToggleGroup(group.mangaId)}
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
                    onClick={(e) => handleNavigateToManga(group.mangaId, e)}
                  >
                    <h3 className="download-group__title">{group.mangaTitle}</h3>
                  </a>
                </div>

                <div className="download-group__header-right">
                  <span className="download-group__stats">
                    {group.totalChapters} chapter
                    {group.totalChapters === 1 ? '' : 's'} ·{' '}
                    {formatStorageSize(group.totalStorageSize)}
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
                    <div
                      key={download.id}
                      className="download-card"
                      onClick={() => handleNavigateToReader(download.mangaId, download.id)}
                    >
                      {/* Chapter info */}
                      <div className="download-card__header">
                        <div className="download-card__info">
                          <h4 className="download-card__chapter">
                            {download.volume ? `Vol. ${download.volume} ` : ''}
                            Ch. {download.chapterNumber}
                          </h4>
                          {download.chapterTitle && (
                            <p className="download-card__title">{download.chapterTitle}</p>
                          )}
                          <p className="download-card__meta">
                            {download.language?.toUpperCase()} · {download.totalPages} pages ·{' '}
                            {formatStorageSize(download.storageSize)}
                          </p>
                        </div>

                        <Badge variant={getBadgeVariant(download.status)} size="small">
                          {download.status}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      {download.status === 'queued' && (
                        <div className="download-card__queued">Queued for download</div>
                      )}

                      {download.status === 'downloading' && (
                        <div className="download-card__progress">
                          <ProgressBar
                            value={download.progress}
                            variant={getProgressVariant(download.status)}
                            size="medium"
                            showLabel
                          />
                          <div className="download-card__progress-info">
                            <span>
                              Page {download.currentPage || 0} / {download.totalPages}
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
                          <ProgressBar
                            value={download.progress}
                            variant="error"
                            size="medium"
                            showLabel
                          />
                          {download.errorMessage && (
                            <p className="download-card__error-message">{download.errorMessage}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="download-card__actions" onClick={(e) => e.stopPropagation()}>
                        {(download.status === 'downloading' || download.status === 'queued') && (
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleCancel(download.id)}
                          >
                            Cancel
                          </Button>
                        )}

                        {download.status === 'failed' && (
                          <>
                            <Button
                              variant="accent"
                              size="small"
                              onClick={() => handleRetry(download.id)}
                            >
                              Retry
                            </Button>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleRemove(download.id)}
                            >
                              Remove
                            </Button>
                          </>
                        )}

                        {download.status === 'completed' && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleRemove(download.id)}
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
          ))}
        </div>
      )}
    </div>
  )
}
