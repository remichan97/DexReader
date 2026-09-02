import { useToast } from '@renderer/components/Toast'
import { rendererLog } from '@renderer/services/logging.service'
import type { Download } from '@renderer/types/download.types'
import i18next from 'i18next'

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
        title: i18next.t('downloads:toasts.cancelled.title'),
        message: i18next.t('downloads:toasts.cancelled.message'),
        variant: 'warning',
        duration: 2000
      })
      await onRefresh()
    } else {
      showToast({
        title: i18next.t('downloads:toasts.error.title'),
        message: response.error?.message || i18next.t('downloads:toasts.error.cancelFailed'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRetry = async (chapterId: string): Promise<void> => {
    const response = await globalThis.downloads.retryDownload(chapterId)

    if (response.success) {
      showToast({
        title: i18next.t('downloads:toasts.retrying.title'),
        message: i18next.t('downloads:toasts.retrying.message'),
        variant: 'info',
        duration: 2000
      })
      await onRefresh()
    } else {
      showToast({
        title: i18next.t('downloads:toasts.error.title'),
        message: response.error?.message || i18next.t('downloads:toasts.error.retryFailed'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRemove = async (chapterId: string): Promise<void> => {
    const download = downloads.find((d) => d.id === chapterId)

    if (!download) {
      showToast({
        title: i18next.t('downloads:toasts.error.title'),
        message: i18next.t('downloads:toasts.error.notFound'),
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
            title: i18next.t('downloads:toasts.cancelled.title'),
            message: i18next.t('downloads:toasts.cancelled.message'),
            variant: 'warning',
            duration: 2000
          })
          await onRefresh()
        } else {
          showToast({
            title: i18next.t('downloads:toasts.error.title'),
            message: response.error?.message || i18next.t('downloads:toasts.error.cancelFailed'),
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
            title: i18next.t('downloads:toasts.removed.title'),
            message: i18next.t('downloads:toasts.removed.message'),
            variant: 'success',
            duration: 2000
          })
          await onRefresh()
        } else {
          showToast({
            title: i18next.t('downloads:toasts.error.title'),
            message: response.error?.message || i18next.t('downloads:toasts.error.removeFailed'),
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
          message: i18next.t('dialogs:confirmations.deleteChapterDownload.title'),
          detail: i18next.t('dialogs:confirmations.deleteChapterDownload.message', {
            title: chapterTitle
          }),
          buttons: [
            i18next.t('dialogs:confirmations.deleteChapterDownload.buttons.cancel'),
            i18next.t('dialogs:confirmations.deleteChapterDownload.buttons.hideFromView'),
            i18next.t('dialogs:confirmations.deleteChapterDownload.buttons.deleteForever')
          ],
          defaultId: 0, // Cancel is default (safest)
          cancelId: 0
        })

        if (result.success && result.data?.response === 1) {
          // Hide from view (soft delete)
          const response = await globalThis.downloads.deleteChapter({
            chapterId,
            isDeletePermanent: false
          })
          if (response.success) {
            await onRefresh()
          } else {
            showToast({
              title: i18next.t('downloads:toasts.error.title'),
              message: response.error?.message || i18next.t('downloads:toasts.error.hideFailed'),
              variant: 'error',
              duration: 3000
            })
          }
        } else if (result.success && result.data?.response === 2) {
          // User chose to permanently delete, give them a final chance to back out
          const confirmed = await globalThis.api.showConfirmDialog(
            i18next.t('dialogs:confirmations.deleteChapterDownload.finalConfirmation.title'),
            i18next.t('dialogs:confirmations.deleteChapterDownload.finalConfirmation.message', {
              title: chapterTitle
            }),
            i18next.t(
              'dialogs:confirmations.deleteChapterDownload.finalConfirmation.confirmButton'
            ),
            i18next.t('dialogs:confirmations.deleteChapterDownload.finalConfirmation.cancelButton')
          )

          if (!confirmed.success || !confirmed.data) return

          // Delete permanently
          const response = await globalThis.downloads.deleteChapter({
            chapterId,
            isDeletePermanent: true
          })
          if (response.success) {
            showToast({
              title: i18next.t('downloads:toasts.deleted.title'),
              message: i18next.t('downloads:toasts.deleted.message'),
              variant: 'success',
              duration: 3000
            })
            await onRefresh()
          } else {
            showToast({
              title: i18next.t('downloads:toasts.error.title'),
              message: response.error?.message || i18next.t('downloads:toasts.error.deleteFailed'),
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
        title: i18next.t('downloads:toasts.error.title'),
        message:
          response.error?.message || i18next.t('downloads:toasts.error.clearCompletedFailed'),
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
      title: i18next.t('downloads:toasts.retrying.title'),
      message: i18next.t('downloads:toasts.retryAllQueued', {
        count: successCount,
        s: successCount === 1 ? '' : 's'
      }),
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
        title: i18next.t('downloads:toasts.cancelled.title'),
        message: i18next.t('downloads:toasts.cancelledAll', {
          count: cancelledCount,
          s: cancelledCount === 1 ? '' : 's'
        }),
        variant: 'warning',
        duration: 2000
      })

      await onRefresh()
    } else {
      showToast({
        title: i18next.t('downloads:toasts.error.title'),
        message: i18next.t('downloads:toasts.error.cancelFailed'),
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
          title: i18next.t('downloads:toasts.error.title'),
          message: i18next.t('downloads:toasts.error.openFolderFailed'),
          variant: 'error'
        })
      }
    } catch (error) {
      rendererLog.error('[useDownloadActions] Error opening downloads folder:', error)
      showToast({
        title: i18next.t('downloads:toasts.error.title'),
        message: i18next.t('downloads:toasts.error.openFolderFailed'),
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
