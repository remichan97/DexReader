import { useEffect, useState } from 'react'

export type DownloadDefaultQuality = 'data' | 'data-saver'
export type DownloadConfirmationSetting = 'always' | 'batch-only' | 'never'

export interface DownloadSettingsInfo {
  path: string
  defaultQuality: DownloadDefaultQuality
  confirmation: DownloadConfirmationSetting
}

export interface DownloadStatsInfo {
  chapterCount: number
  totalBytes: number
}

export interface UseMangaDownloadInfoResult {
  downloadSettings: DownloadSettingsInfo | null
  downloadStats: DownloadStatsInfo | null
  refreshDownloadStats: () => Promise<void>
}

/**
 * Loads the download-relevant settings (path, default quality, confirmation
 * mode) and this manga's current download stats, exposing a refresh function
 * for actions elsewhere (favouriting, deleting downloads) that change them.
 */
export function useMangaDownloadInfo(mangaId: string): UseMangaDownloadInfoResult {
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettingsInfo | null>(null)
  const [downloadStats, setDownloadStats] = useState<DownloadStatsInfo | null>(null)

  const refreshDownloadStats = async (): Promise<void> => {
    const statsResponse = await globalThis.downloads.getDownloadStats(mangaId)
    if (statsResponse.success && statsResponse.data) {
      setDownloadStats(statsResponse.data)
    } else {
      setDownloadStats(null)
    }
  }

  // Load download settings and stats
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
          defaultQuality: qualityResult.data as DownloadDefaultQuality,
          confirmation: confirmationResult.data as DownloadConfirmationSetting
        })
      }
    }

    async function loadDownloadStats(): Promise<void> {
      const statsResponse = await globalThis.downloads.getDownloadStats(mangaId)
      if (statsResponse.success && statsResponse.data) {
        setDownloadStats(statsResponse.data)
      }
    }

    void loadSettings()
    void loadDownloadStats()
  }, [mangaId])

  return { downloadSettings, downloadStats, refreshDownloadStats }
}
