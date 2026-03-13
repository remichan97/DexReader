import { useToast } from '@renderer/components/Toast'
import type { Download } from '@renderer/types/download.types'

export interface UseDownloadActionsParams {
  downloads: Download[]
  activeCount: number
  onRefresh: () => Promise<void>
}

export interface UseDownloadActionsReturn {
  handleCancel: (chapterId: string) => Promise<void>
  handleRetry: (chapterId: string) => Promise<void>
  handleRemove: (chapterId: string) => Promise<void>
  handleClearCompleted: () => Promise<void>
  handleRetryAllFailed: () => Promise<void>
  handleCancelAllQueued: () => Promise<void>
  handleOpenDownloadsFolder: () => Promise<void>
}

export function useDownloadActions({
  downloads,
  activeCount,
  onRefresh
}: UseDownloadActionsParams): UseDownloadActionsReturn {
  const { show: showToast } = useToast()

  const handleCancel = async (chapterId: string): Promise<void> => {
    const response = await globalThis.downloads.removeFromQueue(chapterId)

    if (response.success) {
      showToast({
        title: 'Cancelled',
        message: 'Download cancelled',
        variant: 'warning',
        duration: 2000
      })
      await onRefresh()
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
      await onRefresh()
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
      showToast({
        title: 'Removed',
        message: 'Download removed',
        variant: 'success',
        duration: 2000
      })
      await onRefresh()
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
    const response = await globalThis.downloads.clearCompleted()

    if (response.success && response.data !== undefined) {
      const clearedCount = response.data

      showToast({
        title: 'Cleared',
        message: `Cleared ${clearedCount} completed download${clearedCount === 1 ? '' : 's'} from view`,
        variant: 'success',
        duration: 2000
      })

      await onRefresh()
    } else {
      showToast({
        title: 'Error',
        message: response.error?.message || 'Failed to clear completed downloads',
        variant: 'error',
        duration: 3000
      })
    }
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

    await onRefresh()
  }

  const handleCancelAllQueued = async (): Promise<void> => {
    const queuedDownloads = downloads.filter((d) => d.status === 'queued')

    if (queuedDownloads.length === 0) return

    const response = await globalThis.downloads.cancelAllQueued()

    if (response.success && response.data !== undefined) {
      const cancelledCount = response.data

      showToast({
        title: 'Cancelled',
        message: `Cancelled ${cancelledCount} queued download${cancelledCount === 1 ? '' : 's'}`,
        variant: 'warning',
        duration: 2000
      })

      await onRefresh()
    } else {
      showToast({
        title: 'Error',
        message: 'Failed to cancel queued downloads',
        variant: 'error',
        duration: 3000
      })
    }
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

  return {
    handleCancel,
    handleRetry,
    handleRemove,
    handleClearCompleted,
    handleRetryAllFailed,
    handleCancelAllQueued,
    handleOpenDownloadsFolder
  }
}
