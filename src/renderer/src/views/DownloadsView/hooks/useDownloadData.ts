import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@renderer/components/Toast'
import { Download, mapChapterDownloadToFrontend } from '@renderer/types/download.types'
import type { ChapterProgressEvent, QueueProgressEvent } from '../types'

export interface UseDownloadDataReturn {
  downloads: Download[]
  loading: boolean
  error: string | null
  activeCount: number
  queuedCount: number
  completedCount: number
  failedCount: number
  reload: () => Promise<void>
}

export function useDownloadData(): UseDownloadDataReturn {
  const { show: showToast } = useToast()

  // State
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats from queue progress
  const [activeCount, setActiveCount] = useState(0)
  const [queuedCount, setQueuedCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  const isInitialLoad = useRef(true)

  // Load downloads from backend (both DB and in-memory queue)
  const loadDownloads = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      // Fetch both DB downloads and in-memory queue
      const [downloadsResponse, queueResponse] = await Promise.all([
        globalThis.downloads.getAllDownloads(),
        globalThis.downloads.getQueuedItems()
      ])

      if (!downloadsResponse.success) {
        setError(downloadsResponse.error?.message || 'Failed to load downloads')
        return
      }

      const dbDownloads = downloadsResponse.data || []
      const queuedItems = queueResponse.success ? queueResponse.data || [] : []

      // Map DB downloads to frontend format
      const mapped = dbDownloads.map(mapChapterDownloadToFrontend)

      // Map queued items that aren't in DB yet to frontend format
      // These are items that are waiting in queue but haven't started downloading
      const dbChapterIds = new Set(mapped.map((d) => d.id))
      const queueOnly = queuedItems
        .filter((item) => !dbChapterIds.has(item.chapterId))
        .map((item) => ({
          id: item.chapterId,
          mangaId: item.mangaId,
          mangaTitle: 'Loading...', // Will be updated when download starts
          chapterNumber: item.chapterId.substring(0, 8) + '...', // Placeholder
          progress: 0,
          status: 'queued' as const,
          totalPages: 0,
          downloadedAt: item.addedAt.getTime ? item.addedAt.getTime() : Date.now(),
          storageSize: 0,
          language: item.language
        }))

      const allDownloads = [...mapped, ...queueOnly]
      setDownloads(allDownloads)

      // Calculate stats
      const active = allDownloads.filter(
        (d) => d.status === 'downloading' || d.status === 'queued'
      ).length
      const queued = allDownloads.filter((d) => d.status === 'queued').length
      const completed = allDownloads.filter((d) => d.status === 'completed').length
      const failed = allDownloads.filter((d) => d.status === 'failed').length

      setActiveCount(active)
      setQueuedCount(queued)
      setCompletedCount(completed)
      setFailedCount(failed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
      isInitialLoad.current = false
    }
  }, [])

  // Handle chapter progress event
  const handleChapterProgress = (event: ChapterProgressEvent): void => {
    setDownloads((prev) => {
      const updated = prev.map((d) => {
        if (d.id === event.chapterId) {
          return {
            ...d,
            currentPage: event.currentPage,
            totalPages: event.totalPages,
            progress: event.percentage,
            status: event.status
          }
        }
        return d
      })

      // Update queued count when status changes
      const queued = updated.filter((d) => d.status === 'queued').length
      setQueuedCount(queued)

      return updated
    })
  }

  // Handle queue progress event
  const handleQueueProgress = (stats: QueueProgressEvent): void => {
    setActiveCount(stats.activeDownloads)
    setCompletedCount(stats.completedChapters)
    setFailedCount(stats.failedChapters)

    // Calculate queued count from current downloads
    setDownloads((prev) => {
      const queued = prev.filter((d) => d.status === 'queued').length
      setQueuedCount(queued)
      return prev
    })
  }

  // Handle permanent failure event
  const handlePermanentFailure = useCallback(
    async ({ message }: { chapterId: string; message: string }): Promise<void> => {
      showToast({
        title: 'Download Failed',
        message: message || 'Download failed after retries',
        variant: 'error',
        duration: 5000
      })

      // Reload downloads to get updated status
      await loadDownloads()
    },
    [showToast, loadDownloads]
  )

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
  }, [handlePermanentFailure])

  return {
    downloads,
    loading,
    error,
    activeCount,
    queuedCount,
    completedCount,
    failedCount,
    reload: loadDownloads
  }
}
