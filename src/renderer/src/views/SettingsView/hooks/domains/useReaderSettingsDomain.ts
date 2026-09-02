import { useCallback, useEffect, useState } from 'react'
import type { MangaReadingSettings, AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

export type ImageQualityPreference = 'data' | 'data-saver'
export type CacheTier = 'low' | 'normal' | 'high' | 'custom'

export interface ReaderPayload {
  reader: {
    global: MangaReadingSettings
    forceDarkMode: boolean
    quality: ImageQualityPreference
    performance: {
      cacheTier: CacheTier
      customCacheSize?: number
    }
  }
}

export interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  settings: MangaReadingSettings
}

type TFunction = (key: string, options?: Record<string, unknown>) => string

interface ToastOptions {
  variant: 'error' | 'success' | 'info'
  title: string
  message: string
}

interface UseReaderSettingsDomainParams {
  markSettingModified: (key: string) => void
  showToast: (options: ToastOptions) => void
  t: TFunction
}

export interface UseReaderSettingsDomainResult extends SettingsDomain<ReaderPayload> {
  globalReaderSettings: MangaReadingSettings
  forceDarkMode: boolean
  imageQuality: ImageQualityPreference
  perMangaOverrides: PerMangaOverride[]
  isLoadingReaderSettings: boolean
  chapterCacheTier: CacheTier
  customCacheSize: number
  sanityMaxCacheMB: number
  isInvalidCustomCache: boolean
  handleReadingModeChange: (mode: string | string[]) => void
  handleDoublePageSettingChange: (key: 'skipCoverPages' | 'readRightToLeft', value: boolean) => void
  handleForceDarkModeChange: (enabled: boolean) => void
  handleImageQualityChange: (quality: string) => void
  handleCacheTierChange: (tier: CacheTier) => void
  handleCustomCacheSizeChange: (size: number) => void
  handleResetMangaOverride: (mangaId: string) => Promise<void>
  handleClearAllOverrides: () => Promise<void>
  loadFromSettings: (settings: AppSettings) => void
  finishLoading: () => void
  validateBeforeSave: () => Promise<boolean>
}

/**
 * Owns the "Reader" + "Performance" settings domains — both persist under
 * `settings.reader`, so they're tracked together — plus per-manga reader
 * overrides, which live in the database and aren't part of the dirty/save/reset
 * cycle at all (deletions there are immediate, not staged).
 */
export function useReaderSettingsDomain(
  params: UseReaderSettingsDomainParams
): UseReaderSettingsDomainResult {
  const { markSettingModified, showToast, t } = params

  const [globalReaderSettings, setGlobalReaderSettings] = useState<MangaReadingSettings>({
    readingMode: 'single' as MangaReadingSettings['readingMode']
  })
  const [forceDarkMode, setForceDarkMode] = useState<boolean>(true)
  const [imageQuality, setImageQuality] = useState<ImageQualityPreference>('data')
  const [perMangaOverrides, setPerMangaOverrides] = useState<PerMangaOverride[]>([])
  const [isLoadingReaderSettings, setIsLoadingReaderSettings] = useState(true)

  const [chapterCacheTier, setChapterCacheTier] = useState<CacheTier>('normal')
  const [customCacheSize, setCustomCacheSize] = useState<number>(200)
  const [sanityMaxCacheMB, setSanityMaxCacheMB] = useState<number>(4800)

  // Load sanity maximum on mount (30% of RAM) — independent of the main settings load
  useEffect(() => {
    async function loadSanityMax(): Promise<void> {
      const result = await globalThis.settings.getMemoryTierInfo()
      if (result.success && result.data) {
        setSanityMaxCacheMB(Math.round(result.data.systemRAM_GB * 1024 * 0.3))
      }
    }
    loadSanityMax()
  }, [])

  // Load per-manga overrides on mount — a DB read independent of the settings file
  useEffect(() => {
    async function loadOverrides(): Promise<void> {
      const overridesResult = await globalThis.reader.getAllMangaOverrides()
      if (overridesResult.success && overridesResult.data) {
        const overrides: PerMangaOverride[] = overridesResult.data.map((override) => ({
          mangaId: override.mangaId,
          mangaTitle: override.title,
          coverUrl: override.coverUrl,
          settings: override.readerSettings
        }))
        setPerMangaOverrides(overrides)
      }
    }
    loadOverrides()
  }, [])

  const handleReadingModeChange = useCallback(
    (mode: string | string[]): void => {
      const selectedMode = Array.isArray(mode) ? mode[0] : mode
      setGlobalReaderSettings((prev) => ({
        ...prev,
        readingMode: selectedMode as MangaReadingSettings['readingMode']
      }))
      markSettingModified('globalReaderSettings')
    },
    [markSettingModified]
  )

  const handleDoublePageSettingChange = useCallback(
    (key: 'skipCoverPages' | 'readRightToLeft', value: boolean): void => {
      setGlobalReaderSettings((prev) => ({
        ...prev,
        doublePageMode: {
          skipCoverPages: prev.doublePageMode?.skipCoverPages ?? true,
          readRightToLeft: prev.doublePageMode?.readRightToLeft ?? true,
          [key]: value
        }
      }))
      markSettingModified('globalReaderSettings')
    },
    [markSettingModified]
  )

  const handleForceDarkModeChange = useCallback(
    (enabled: boolean): void => {
      setForceDarkMode(enabled)
      markSettingModified('forceDarkMode')
    },
    [markSettingModified]
  )

  const handleImageQualityChange = useCallback(
    (quality: string): void => {
      setImageQuality(quality as ImageQualityPreference)
      markSettingModified('imageQuality')
    },
    [markSettingModified]
  )

  const handleCacheTierChange = useCallback(
    (tier: CacheTier): void => {
      setChapterCacheTier(tier)
      markSettingModified('chapterCacheTier')
    },
    [markSettingModified]
  )

  const handleCustomCacheSizeChange = useCallback(
    (size: number): void => {
      setCustomCacheSize(size)
      markSettingModified('customCacheSize')
    },
    [markSettingModified]
  )

  const handleResetMangaOverride = useCallback(
    async (mangaId: string): Promise<void> => {
      try {
        const result = await globalThis.reader.resetMangaReaderSettings(mangaId)
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to reset settings')
        }
        setPerMangaOverrides((prev) => prev.filter((o) => o.mangaId !== mangaId))
      } catch (error) {
        showToast({
          variant: 'error',
          title: 'Failed to reset override',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    },
    [showToast]
  )

  const handleClearAllOverrides = useCallback(async (): Promise<void> => {
    try {
      const result = await globalThis.reader.clearAllOverrides()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to clear all overrides')
      }
      setPerMangaOverrides([])
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to clear overrides',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [showToast])

  const loadFromSettings = useCallback((settings: AppSettings): void => {
    if (settings.reader.global) {
      setGlobalReaderSettings(settings.reader.global)
    }
    if (settings.reader.forceDarkMode !== undefined) {
      setForceDarkMode(settings.reader.forceDarkMode)
    }
    if (settings.reader.quality !== undefined) {
      setImageQuality(settings.reader.quality)
    }
    if (settings.reader.performance) {
      setChapterCacheTier(settings.reader.performance.cacheTier)
      const loadedCustomCacheSize =
        settings.reader.performance.customCacheSize === undefined
          ? 200
          : settings.reader.performance.customCacheSize / (1024 * 1024)
      setCustomCacheSize(loadedCustomCacheSize)
    }
  }, [])

  const finishLoading = useCallback((): void => {
    setIsLoadingReaderSettings(false)
  }, [])

  const isInvalidCustomCache =
    chapterCacheTier === 'custom' && (customCacheSize < 10 || customCacheSize > sanityMaxCacheMB)

  const validateBeforeSave = useCallback(async (): Promise<boolean> => {
    if (chapterCacheTier !== 'custom') return true

    const tierInfoResult = await globalThis.settings.getMemoryTierInfo()
    if (!tierInfoResult.success || !tierInfoResult.data) return true

    const sanityMaxMB = Math.round(tierInfoResult.data.systemRAM_GB * 1024 * 0.3)
    if (customCacheSize < 10 || customCacheSize > sanityMaxMB) {
      // Already showing error in UI, just block save
      return false
    }

    const suppressWarnings = localStorage.getItem('suppressCacheWarnings') === 'true'
    if (!suppressWarnings && customCacheSize > tierInfoResult.data.recommendedMaxMB) {
      const { recommendedMaxMB, systemRAM_GB } = tierInfoResult.data

      const result = await globalThis.api.showDialog({
        message: t('settings:performance.highMemoryWarning.title'),
        detail: t('settings:performance.highMemoryWarning.message', {
          size: customCacheSize,
          ram: systemRAM_GB,
          recommended: recommendedMaxMB,
          max: sanityMaxMB
        }),
        buttons: [
          t('settings:performance.highMemoryWarning.proceedButton'),
          t('settings:performance.highMemoryWarning.cancelButton')
        ],
        type: 'warning',
        defaultId: 1,
        cancelId: 1,
        noLink: true,
        checkboxLabel: t('settings:performance.highMemoryWarning.suppressCheckbox'),
        checkboxChecked: false
      })

      // User cancelled
      if (!result.success || !result.data || result.data.response === 1) return false

      if (result.data.checkboxChecked) {
        localStorage.setItem('suppressCacheWarnings', 'true')
      }
    }

    return true
  }, [chapterCacheTier, customCacheSize, t])

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      forceDarkMode !== original.reader.forceDarkMode ||
      imageQuality !== original.reader.quality ||
      JSON.stringify(globalReaderSettings) !== JSON.stringify(original.reader.global) ||
      chapterCacheTier !== original.reader.performance.cacheTier ||
      (chapterCacheTier === 'custom' &&
        customCacheSize * 1024 * 1024 !==
          (original.reader.performance.customCacheSize ?? 200 * 1024 * 1024)),
    [forceDarkMode, imageQuality, globalReaderSettings, chapterCacheTier, customCacheSize]
  )

  const buildPayload = useCallback(
    (): ReaderPayload => ({
      reader: {
        global: globalReaderSettings,
        forceDarkMode,
        quality: imageQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      }
    }),
    [globalReaderSettings, forceDarkMode, imageQuality, chapterCacheTier, customCacheSize]
  )

  const reset = useCallback((original: AppSettings): void => {
    setGlobalReaderSettings(original.reader.global)
    setForceDarkMode(original.reader.forceDarkMode)
    setImageQuality(original.reader.quality)
    setChapterCacheTier(original.reader.performance.cacheTier)
    if (original.reader.performance.customCacheSize === undefined) {
      setCustomCacheSize(200) // Fallback to Normal default
    } else {
      setCustomCacheSize(original.reader.performance.customCacheSize / (1024 * 1024))
    }
  }, [])

  return {
    globalReaderSettings,
    forceDarkMode,
    imageQuality,
    perMangaOverrides,
    isLoadingReaderSettings,
    chapterCacheTier,
    customCacheSize,
    sanityMaxCacheMB,
    isInvalidCustomCache,
    handleReadingModeChange,
    handleDoublePageSettingChange,
    handleForceDarkModeChange,
    handleImageQualityChange,
    handleCacheTierChange,
    handleCustomCacheSizeChange,
    handleResetMangaOverride,
    handleClearAllOverrides,
    loadFromSettings,
    finishLoading,
    validateBeforeSave,
    isDirty,
    buildPayload,
    reset
  }
}
