import { useState, useEffect } from 'react'
import { useToast } from '@renderer/components/Toast'
import type { DownloadStatus } from '@renderer/components/DownloadStatusBadge'

// Extract types from global window interface
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface DownloadSettings {
  path: string
  defaultQuality: 'data' | 'data-saver'
  confirmation: 'always' | 'batch-only' | 'never'
}

interface UseChapterDownloadsParams {
  chapters: ChapterEntity[]
  mangaId: string
  selectedLanguage: string
}

interface UseChapterDownloadsResult {
  downloadSettings: DownloadSettings | null
  downloadStatusMap: Map<string, DownloadStatus>
  showDownloadDialog: boolean
  showDownloadAllDialog: boolean
  selectedChapter: ChapterEntity | null
  setShowDownloadDialog: (show: boolean) => void
  setShowDownloadAllDialog: (show: boolean) => void
  setSelectedChapter: (chapter: ChapterEntity | null) => void
  handleDownloadClick: (chapter: ChapterEntity) => Promise<void>
  handleDownloadAllClick: (displayChapters: ChapterEntity[]) => Promise<void>
  handleDownloadConfirm: (quality: 'data' | 'data-saver') => Promise<void>
  handleDownloadAll: (
    displayChapters: ChapterEntity[],
    quality?: 'data' | 'data-saver'
  ) => Promise<void>
}

/**
 * Custom hook for managing chapter download logic and state
 */
export function useChapterDownloads({
  chapters,
  mangaId,
  selectedLanguage
}: UseChapterDownloadsParams): UseChapterDownloadsResult {
  const { show: showToast } = useToast()

  // Download dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showDownloadAllDialog, setShowDownloadAllDialog] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<ChapterEntity | null>(null)

  // Settings state
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings | null>(null)

  // Download status cache
  const [downloadStatusMap, setDownloadStatusMap] = useState<Map<string, DownloadStatus>>(new Map())

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      const [pathResult, qualityResult, confirmationResult] = await Promise.all([
        globalThis.settings.getSettingByPath('downloads', 'downloadPath'),
        globalThis.settings.getSettingByPath('downloads', 'defaultQuality'),
        globalThis.settings.getSettingByPath('downloads', 'shouldConfirmDownload')
      ])

      if (pathResult.success && qualityResult.success && confirmationResult.success) {
        setDownloadSettings({
          path: String(pathResult.data),
          defaultQuality: qualityResult.data as 'data' | 'data-saver',
          confirmation: confirmationResult.data as 'always' | 'batch-only' | 'never'
        })
      }
    }

    void loadSettings()
  }, [])

  // Load download statuses for visible chapters
  useEffect(() => {
    async function loadDownloadStatuses(): Promise<void> {
      const statusMap = new Map<string, DownloadStatus>()

      // Check each chapter's download status
      await Promise.all(
        chapters.map(async (chapter) => {
          const result = await globalThis.downloads.getDownload(chapter.id)
          if (result.success && result.data) {
            // Map backend status to frontend status
            const backendStatus = result.data.status
            let frontendStatus: DownloadStatus = 'not-downloaded'
            switch (backendStatus) {
              case 'completed':
                frontendStatus = 'downloaded'
                break
              case 'queued':
                frontendStatus = 'queued'
                break
              case 'downloading':
                frontendStatus = 'downloading'
                break
              case 'failed':
                frontendStatus = 'failed'
                break
            }
            statusMap.set(chapter.id, frontendStatus)
          } else {
            statusMap.set(chapter.id, 'not-downloaded')
          }
        })
      )

      setDownloadStatusMap(statusMap)
    }

    if (chapters.length > 0) {
      void loadDownloadStatuses()
    }
  }, [chapters])

  // Listen to download progress events
  useEffect(() => {
    const unsubscribe = globalThis.api.onDownloadProgress((event) => {
      // Map backend status to frontend status
      let frontendStatus: DownloadStatus = 'not-downloaded'
      switch (event.status) {
        case 'completed':
          frontendStatus = 'downloaded'
          break
        case 'queued':
          frontendStatus = 'queued'
          break
        case 'downloading':
          frontendStatus = 'downloading'
          break
        case 'failed':
          frontendStatus = 'failed'
          break
      }

      // Update the status map for this chapter
      setDownloadStatusMap((prev) => new Map(prev).set(event.chapterId, frontendStatus))
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Helper function to perform download
  const performDownload = async (
    chapter: ChapterEntity,
    quality: 'data' | 'data-saver'
  ): Promise<void> => {
    const result = await globalThis.downloads.addToQueue({
      chapterId: chapter.id,
      mangaId: mangaId,
      language: selectedLanguage,
      quality: quality,
      addedAt: new Date()
    })

    if (result.success) {
      setDownloadStatusMap((prev) => new Map(prev).set(chapter.id, 'queued'))
    } else {
      console.error('Failed to add chapter to queue:', result.error)
      showToast({
        title: 'Download Failed',
        message: 'Failed to add chapter to download queue',
        variant: 'error',
        duration: 5000
      })
    }
  }

  // Handle download button click
  const handleDownloadClick = async (chapter: ChapterEntity): Promise<void> => {
    if (!downloadSettings) return

    setSelectedChapter(chapter)

    // Check confirmation setting
    if (downloadSettings.confirmation === 'never') {
      // Download immediately with default quality
      await performDownload(chapter, downloadSettings.defaultQuality)
    } else if (downloadSettings.confirmation === 'batch-only') {
      // For single chapter, download directly
      await performDownload(chapter, downloadSettings.defaultQuality)
    } else {
      // 'always': show dialog
      setShowDownloadDialog(true)
    }
  }

  // Handle download confirmation from dialog
  const handleDownloadConfirm = async (quality: 'data' | 'data-saver'): Promise<void> => {
    if (!selectedChapter) return

    await performDownload(selectedChapter, quality)
    setShowDownloadDialog(false)
    setSelectedChapter(null)
  }

  // Handle Download All Chapters
  const handleDownloadAll = async (
    displayChapters: ChapterEntity[],
    quality?: 'data' | 'data-saver'
  ): Promise<void> => {
    if (!downloadSettings || displayChapters.length === 0) return

    const selectedQuality = quality || downloadSettings.defaultQuality

    // Queue all visible chapters for download
    const results = await Promise.all(
      displayChapters.map((chapter) =>
        globalThis.downloads.addToQueue({
          chapterId: chapter.id,
          mangaId: mangaId,
          language: selectedLanguage,
          quality: selectedQuality,
          addedAt: new Date()
        })
      )
    )

    const successCount = results.filter((r) => r.success).length
    const failCount = displayChapters.length - successCount

    if (successCount > 0) {
      showToast({
        title: 'Download Started',
        message: `Queued ${successCount} chapter${successCount === 1 ? '' : 's'} for download`,
        variant: 'success',
        duration: 3000
      })

      // Update status map for queued chapters
      const newStatusMap = new Map(downloadStatusMap)
      displayChapters.forEach((chapter) => {
        newStatusMap.set(chapter.id, 'queued')
      })
      setDownloadStatusMap(newStatusMap)
    }

    if (failCount > 0) {
      showToast({
        title: 'Partial Failure',
        message: `Failed to queue ${failCount} chapter${failCount === 1 ? '' : 's'}`,
        variant: 'error',
        duration: 5000
      })
    }

    setShowDownloadAllDialog(false)
  }

  // Handle Download All button click
  const handleDownloadAllClick = async (displayChapters: ChapterEntity[]): Promise<void> => {
    if (!downloadSettings || displayChapters.length === 0) return

    // Check confirmation setting
    if (downloadSettings.confirmation === 'never') {
      // Download immediately with default quality
      await handleDownloadAll(displayChapters)
    } else if (
      downloadSettings.confirmation === 'batch-only' ||
      downloadSettings.confirmation === 'always'
    ) {
      // Show dialog for batch download
      setShowDownloadAllDialog(true)
    }
  }

  return {
    downloadSettings,
    downloadStatusMap,
    showDownloadDialog,
    showDownloadAllDialog,
    selectedChapter,
    setShowDownloadDialog,
    setShowDownloadAllDialog,
    setSelectedChapter,
    handleDownloadClick,
    handleDownloadAllClick,
    handleDownloadConfirm,
    handleDownloadAll
  }
}
