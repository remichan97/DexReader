import { useCallback, useState } from 'react'
import { writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import type { AppSettings } from '../../../../../../preload/window.types'
import { DownloadConfirmation } from '@shared/enums/settings/download-confirmation.enum'
import { ImageQuality } from '@shared/enums/mangadex'

export { DownloadConfirmation }
export type DownloadQuality = ImageQuality

interface ToastOptions {
  variant: 'error' | 'success' | 'info'
  title: string
  message: string
}

interface UseDownloadsSettingsDomainParams {
  showToast: (options: ToastOptions) => void
}

export interface UseDownloadsSettingsDomainResult {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  downloadConfirmation: DownloadConfirmation
  defaultQuality: DownloadQuality
  maxConcurrentDownloads: number
  maxDiskCacheSize: number
  setDownloadsPath: (path: string) => void
  handleSelectDownloadsFolder: () => Promise<void>
  handleDownloadConfirmationChange: (confirmation: string) => void
  handleDefaultQualityChange: (quality: string) => void
  handleMaxConcurrentDownloadsChange: (count: number) => void
  handleCoverCacheLimitChange: (limitMB: number) => void
  loadFromSettings: (settings: AppSettings) => void
  finishLoading: () => void
}

/**
 * Owns the "Downloads" settings domain. `downloadsPath` intentionally tracks the
 * actual filesystem downloads folder (from `fileSystem.getAllowedPaths()`), not
 * `settings.downloads.downloadPath`, which may be unset when the default is in use.
 *
 * All five fields share the `downloads` section, so every handler writes it whole
 * (current values for the other four, the new value for the one that changed). The
 * main process re-validates downloadPath (system-directory blocklist, existence) on
 * every write through settings:update-section, not just on the old whole-object save -
 * see settingsManager.updateSection().
 */
export function useDownloadsSettingsDomain(
  params: UseDownloadsSettingsDomainParams
): UseDownloadsSettingsDomainResult {
  const { showToast } = params

  const [downloadsPath, setDownloadsPath] = useState<string>('')
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [isChangingPath, setIsChangingPath] = useState(false)
  const [downloadConfirmation, setDownloadConfirmation] = useState<DownloadConfirmation>(
    DownloadConfirmation.BatchDownload
  )
  const [defaultQuality, setDefaultQuality] = useState<DownloadQuality>(ImageQuality.High)
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState<number>(3)
  const [maxDiskCacheSize, setMaxDiskCacheSize] = useState<number>(50 * 1024 * 1024)

  const handleDownloadConfirmationChange = useCallback(
    (confirmation: string): void => {
      const newConfirmation = confirmation as DownloadConfirmation
      setDownloadConfirmation(newConfirmation)
      void writeSettingsSection('downloads', {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: newConfirmation,
        defaultQuality,
        maxConcurrentDownloads,
        maxDiskCacheSize
      })
    },
    [downloadsPath, defaultQuality, maxConcurrentDownloads, maxDiskCacheSize]
  )

  const handleDefaultQualityChange = useCallback(
    (quality: string): void => {
      const newQuality = quality as DownloadQuality
      setDefaultQuality(newQuality)
      void writeSettingsSection('downloads', {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: downloadConfirmation,
        defaultQuality: newQuality,
        maxConcurrentDownloads,
        maxDiskCacheSize
      })
    },
    [downloadsPath, downloadConfirmation, maxConcurrentDownloads, maxDiskCacheSize]
  )

  const handleMaxConcurrentDownloadsChange = useCallback(
    (count: number): void => {
      setMaxConcurrentDownloads(count)
      void writeSettingsSection('downloads', {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: downloadConfirmation,
        defaultQuality,
        maxConcurrentDownloads: count,
        maxDiskCacheSize
      })
    },
    [downloadsPath, downloadConfirmation, defaultQuality, maxDiskCacheSize]
  )

  const handleCoverCacheLimitChange = useCallback(
    (limitMB: number): void => {
      const newSize = limitMB === 0 ? 0 : limitMB * 1024 * 1024
      setMaxDiskCacheSize(newSize)
      void writeSettingsSection('downloads', {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: downloadConfirmation,
        defaultQuality,
        maxConcurrentDownloads,
        maxDiskCacheSize: newSize
      })
    },
    [downloadsPath, downloadConfirmation, defaultQuality, maxConcurrentDownloads]
  )

  const handleSelectDownloadsFolder = useCallback(async (): Promise<void> => {
    setIsChangingPath(true)
    try {
      const response = await globalThis.fileSystem.selectDownloadsFolder()
      if (!response.success || !response.data) {
        throw new Error('Failed to select downloads folder')
      }
      const result = response.data

      if (!result.cancelled && result.filePath) {
        setDownloadsPath(result.filePath)
        await writeSettingsSection('downloads', {
          downloadPath: result.filePath,
          shouldConfirmDownload: downloadConfirmation,
          defaultQuality,
          maxConcurrentDownloads,
          maxDiskCacheSize
        })
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: "Couldn't change downloads folder",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsChangingPath(false)
    }
  }, [downloadConfirmation, defaultQuality, maxConcurrentDownloads, maxDiskCacheSize, showToast])

  const loadFromSettings = useCallback((settings: AppSettings): void => {
    if (settings.downloads.shouldConfirmDownload !== undefined) {
      setDownloadConfirmation(settings.downloads.shouldConfirmDownload)
    }
    if (settings.downloads.defaultQuality !== undefined) {
      setDefaultQuality(settings.downloads.defaultQuality)
    }
    if (settings.downloads.maxConcurrentDownloads !== undefined) {
      setMaxConcurrentDownloads(settings.downloads.maxConcurrentDownloads)
    }
    if (settings.downloads.maxDiskCacheSize !== undefined) {
      setMaxDiskCacheSize(settings.downloads.maxDiskCacheSize)
    }
  }, [])

  const finishLoading = useCallback((): void => {
    setIsLoadingPath(false)
  }, [])

  return {
    downloadsPath,
    isLoadingPath,
    isChangingPath,
    downloadConfirmation,
    defaultQuality,
    maxConcurrentDownloads,
    maxDiskCacheSize,
    setDownloadsPath,
    handleSelectDownloadsFolder,
    handleDownloadConfirmationChange,
    handleDefaultQualityChange,
    handleMaxConcurrentDownloadsChange,
    handleCoverCacheLimitChange,
    loadFromSettings,
    finishLoading
  }
}
