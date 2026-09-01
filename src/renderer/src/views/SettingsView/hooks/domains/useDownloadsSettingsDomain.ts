import { useCallback, useState } from 'react'
import type { AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

export type DownloadConfirmation = 'always' | 'batch-only' | 'never'
export type DownloadQuality = 'data' | 'data-saver'

export interface DownloadsPayload {
  downloads: {
    downloadPath?: string
    shouldConfirmDownload: DownloadConfirmation
    defaultQuality: DownloadQuality
    maxConcurrentDownloads: number
    maxDiskCacheSize: number
  }
}

interface ToastOptions {
  variant: 'error' | 'success' | 'info'
  title: string
  message: string
}

interface UseDownloadsSettingsDomainParams {
  markSettingModified: (key: string) => void
  showToast: (options: ToastOptions) => void
}

export interface UseDownloadsSettingsDomainResult extends SettingsDomain<DownloadsPayload> {
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
  handleMaxConcurrentDownloadsChange: (count: string | string[]) => void
  handleCoverCacheLimitChange: (limitMB: number) => void
  loadFromSettings: (settings: AppSettings) => void
  finishLoading: () => void
}

/**
 * Owns the "Downloads" settings domain. `downloadsPath` intentionally tracks the
 * actual filesystem downloads folder (from `fileSystem.getAllowedPaths()`), not
 * `settings.downloads.downloadPath`, which may be unset when the default is in use.
 */
export function useDownloadsSettingsDomain(
  params: UseDownloadsSettingsDomainParams
): UseDownloadsSettingsDomainResult {
  const { markSettingModified, showToast } = params

  const [downloadsPath, setDownloadsPath] = useState<string>('')
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [isChangingPath, setIsChangingPath] = useState(false)
  const [downloadConfirmation, setDownloadConfirmation] =
    useState<DownloadConfirmation>('batch-only')
  const [defaultQuality, setDefaultQuality] = useState<DownloadQuality>('data')
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState<number>(3)
  const [maxDiskCacheSize, setMaxDiskCacheSize] = useState<number>(50 * 1024 * 1024)

  const handleDownloadConfirmationChange = useCallback(
    (confirmation: string): void => {
      setDownloadConfirmation(confirmation as DownloadConfirmation)
      markSettingModified('downloadConfirmation')
    },
    [markSettingModified]
  )

  const handleDefaultQualityChange = useCallback(
    (quality: string): void => {
      setDefaultQuality(quality as DownloadQuality)
      markSettingModified('defaultQuality')
    },
    [markSettingModified]
  )

  const handleMaxConcurrentDownloadsChange = useCallback(
    (count: string | string[]): void => {
      const selectedCount = Array.isArray(count) ? count[0] : count
      const numericCount = Number.parseInt(selectedCount, 10)
      setMaxConcurrentDownloads(numericCount)
      markSettingModified('maxConcurrentDownloads')
    },
    [markSettingModified]
  )

  const handleCoverCacheLimitChange = useCallback(
    (limitMB: number): void => {
      setMaxDiskCacheSize(limitMB === 0 ? 0 : limitMB * 1024 * 1024)
      markSettingModified('maxDiskCacheSize')
    },
    [markSettingModified]
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
        markSettingModified('downloadsPath')
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
  }, [markSettingModified, showToast])

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

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      downloadConfirmation !== original.downloads.shouldConfirmDownload ||
      defaultQuality !== original.downloads.defaultQuality ||
      maxConcurrentDownloads !== original.downloads.maxConcurrentDownloads ||
      maxDiskCacheSize !== original.downloads.maxDiskCacheSize ||
      downloadsPath !== (original.downloads.downloadPath || ''),
    [downloadConfirmation, defaultQuality, maxConcurrentDownloads, maxDiskCacheSize, downloadsPath]
  )

  const buildPayload = useCallback(
    (): DownloadsPayload => ({
      downloads: {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: downloadConfirmation,
        defaultQuality,
        maxConcurrentDownloads,
        maxDiskCacheSize
      }
    }),
    [downloadsPath, downloadConfirmation, defaultQuality, maxConcurrentDownloads, maxDiskCacheSize]
  )

  const reset = useCallback((original: AppSettings): void => {
    setDownloadConfirmation(original.downloads.shouldConfirmDownload)
    setDefaultQuality(original.downloads.defaultQuality)
    setMaxConcurrentDownloads(original.downloads.maxConcurrentDownloads)
    setMaxDiskCacheSize(original.downloads.maxDiskCacheSize)
    setDownloadsPath(original.downloads.downloadPath || '')
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
    finishLoading,
    isDirty,
    buildPayload,
    reset
  }
}
