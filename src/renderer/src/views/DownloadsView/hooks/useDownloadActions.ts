import { useToast } from '@renderer/components/Toast'
import { rendererLog } from '@renderer/services/logging.service'
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
    const download = downloads.find((d) => d.id === chapterId)

    if (!download) {
      showToast({
        title: 'Error',
        message: 'Download not found',
        variant: 'error',
        duration: 3000
      })
      return
    }

    // Context-aware behavior based on download status
    switch (download.status) {
      case 'queued':
      case 'downloading': {
        // Cancel from queue (soft delete)
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
        break
      }

      case 'failed': {
        // Remove failed download from view (soft delete)
        const response = await globalThis.downloads.deleteChapter({
          chapterId,
          isDeletePermanent: false
        })
        if (response.success) {
          showToast({
            title: 'Removed',
            message: 'Failed download removed from view',
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
        break
      }

      case 'completed': {
        // Show native dialog to let user choose
        const chapterTitle =
          download.chapterTitle || `Chapter ${download.chapterNumber || download.id}`
        const result = await globalThis.api.showDialog({
          type: 'warning',
          message: 'Remove Download?',
          detail: `You are about to remove "${chapterTitle}", which will delete downloaded chapter files.\nYou can also choose to just hide it from the list if you want to keep the files for offline reading.\n\nHow should we proceed?`,
          buttons: [
            'Cancel',
            'Hide from View (Keep Files for Offline Reading)',
            'Delete Forever (Cannot be Undone)'
          ],
          defaultId: 0, // Cancel is default (safest)
          cancelId: 0
        })

        if (result.success && result.data.response === 1) {
          // Hide from view (soft delete)
          const response = await globalThis.downloads.deleteChapter({
            chapterId,
            isDeletePermanent: false
          })
          if (response.success) {
            await onRefresh()
          } else {
            showToast({
              title: 'Error',
              message: response.error?.message || 'Failed to hide download',
              variant: 'error',
              duration: 3000
            })
          }
        } else if (result.success && result.data.response === 2) {
          // User chose to permanently delete, give them a final chance to back out
          const confirmation = await globalThis.api.showConfirmDialog(
            'Are you absolutely certain?',
            'This will be your last chance to back out before the chapter files are permanently deleted. File deletion cannot be undone, but you can always re-download the chapter if you change your mind.\n\nJust a reminder, you are deleting chapter: ' +
              chapterTitle,
            'Yes, Delete Permanently',
            'Nevermind'
          )

          if (!confirmation.success || !confirmation.data) return

          // Delete permanently
          const response = await globalThis.downloads.deleteChapter({
            chapterId,
            isDeletePermanent: true
          })
          if (response.success) {
            showToast({
              title: 'Deleted',
              message: 'Download and files permanently deleted',
              variant: 'success',
              duration: 3000
            })
            await onRefresh()
          } else {
            showToast({
              title: 'Error',
              message: response.error?.message || 'Failed to delete download',
              variant: 'error',
              duration: 3000
            })
          }
        }
        // else: user cancelled (response === 0), do nothing
        break
      }
    }
  }

  const handleClearCompleted = async (): Promise<void> => {
    const response = await globalThis.downloads.clearCompleted()

    if (response.success && response.data !== undefined) {
      await onRefresh()
    } else {
      showToast({
        title: 'Error',
        message: response.error?.message || 'Failed to hide completed downloads',
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
      rendererLog.error('[useDownloadActions] Error opening downloads folder:', error)
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
