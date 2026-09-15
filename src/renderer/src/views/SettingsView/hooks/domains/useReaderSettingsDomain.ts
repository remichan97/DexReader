import { useCallback, useEffect, useState } from 'react'
import { queueSettingsWrite, writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import type { MangaReadingSettings, AppSettings } from '../../../../../../preload/window.types'

export type ImageQualityPreference = 'data' | 'data-saver'
export type CacheTier = 'low' | 'normal' | 'high' | 'custom'

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
  showToast: (options: ToastOptions) => void
  t: TFunction
}

export interface UseReaderSettingsDomainResult {
  globalReaderSettings: MangaReadingSettings
  forceDarkMode: boolean
  imageQuality: ImageQualityPreference
  perMangaOverrides: PerMangaOverride[]
  isLoadingReaderSettings: boolean
  chapterCacheTier: CacheTier
  customCacheSize: number
  sanityMaxCacheMB: number
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
}

/**
 * Owns the "Reader" + "Performance" settings domains — both persist under
 * `settings.reader`, so they're tracked together — plus per-manga reader overrides,
 * which live in the database and are unrelated to this section (deletions there are
 * immediate, direct IPC calls, not routed through settings:update-section).
 *
 * Every field shares the `reader` section, so every handler writes it whole (current
 * values for the others, the new value for the one that changed). customCacheSize is
 * debounced (queueSettingsWrite) since it's a continuous text input; everything else
 * writes immediately (writeSettingsSection).
 */
export function useReaderSettingsDomain(
  params: UseReaderSettingsDomainParams
): UseReaderSettingsDomainResult {
  const { showToast, t } = params

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
      const newGlobalSettings: MangaReadingSettings = {
        ...globalReaderSettings,
        readingMode: selectedMode as MangaReadingSettings['readingMode']
      }
      setGlobalReaderSettings(newGlobalSettings)
      void writeSettingsSection('reader', {
        global: newGlobalSettings,
        forceDarkMode,
        quality: imageQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      })
    },
    [globalReaderSettings, forceDarkMode, imageQuality, chapterCacheTier, customCacheSize]
  )

  const handleDoublePageSettingChange = useCallback(
    (key: 'skipCoverPages' | 'readRightToLeft', value: boolean): void => {
      const newGlobalSettings: MangaReadingSettings = {
        ...globalReaderSettings,
        doublePageMode: {
          skipCoverPages: globalReaderSettings.doublePageMode?.skipCoverPages ?? true,
          readRightToLeft: globalReaderSettings.doublePageMode?.readRightToLeft ?? true,
          [key]: value
        }
      }
      setGlobalReaderSettings(newGlobalSettings)
      void writeSettingsSection('reader', {
        global: newGlobalSettings,
        forceDarkMode,
        quality: imageQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      })
    },
    [globalReaderSettings, forceDarkMode, imageQuality, chapterCacheTier, customCacheSize]
  )

  const handleForceDarkModeChange = useCallback(
    (enabled: boolean): void => {
      setForceDarkMode(enabled)
      void writeSettingsSection('reader', {
        global: globalReaderSettings,
        forceDarkMode: enabled,
        quality: imageQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      })
    },
    [globalReaderSettings, imageQuality, chapterCacheTier, customCacheSize]
  )

  const handleImageQualityChange = useCallback(
    (quality: string): void => {
      const newQuality = quality as ImageQualityPreference
      setImageQuality(newQuality)
      void writeSettingsSection('reader', {
        global: globalReaderSettings,
        forceDarkMode,
        quality: newQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      })
    },
    [globalReaderSettings, forceDarkMode, chapterCacheTier, customCacheSize]
  )

  const handleCacheTierChange = useCallback(
    (tier: CacheTier): void => {
      setChapterCacheTier(tier)
      void writeSettingsSection('reader', {
        global: globalReaderSettings,
        forceDarkMode,
        quality: imageQuality,
        performance: {
          cacheTier: tier,
          customCacheSize: tier === 'custom' ? customCacheSize * 1024 * 1024 : undefined
        }
      })
    },
    [globalReaderSettings, forceDarkMode, imageQuality, customCacheSize]
  )

  // Shows the "this is unusually high" confirmation used to gate a large custom cache
  // size before the debounced autosave commit below persists it.
  const checkHighMemoryWarning = useCallback(
    async (sizeMB: number): Promise<boolean> => {
      const tierInfoResult = await globalThis.settings.getMemoryTierInfo()
      if (!tierInfoResult.success || !tierInfoResult.data) return true

      const suppressWarnings = localStorage.getItem('suppressCacheWarnings') === 'true'
      if (suppressWarnings || sizeMB <= tierInfoResult.data.recommendedMaxMB) {
        return true
      }

      const { recommendedMaxMB, systemRAM_GB } = tierInfoResult.data
      const sanityMaxMB = Math.round(systemRAM_GB * 1024 * 0.3)

      const result = await globalThis.api.showDialog({
        message: t('settings:performance.highMemoryWarning.title'),
        detail: t('settings:performance.highMemoryWarning.message', {
          size: sizeMB,
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

      if (!result.success || !result.data || result.data.response === 1) return false

      if (result.data.checkboxChecked) {
        localStorage.setItem('suppressCacheWarnings', 'true')
      }

      return true
    },
    [t]
  )

  // Autosaved (debounced) rather than buffered - see settingsPendingWrites.ts. The
  // component forwards any parsed integer here (including out-of-range ones, shown as
  // an inline error), so isValid actually gates real invalid input here, unlike accent
  // colour. confirmBeforeWrite only runs once the debounce settles (not on every
  // keystroke), so the memory-warning dialog doesn't pop up mid-typing.
  const handleCustomCacheSizeChange = useCallback(
    (size: number): void => {
      setCustomCacheSize(size)

      queueSettingsWrite(
        'reader.performance.customCacheSize',
        'reader',
        {
          global: globalReaderSettings,
          forceDarkMode,
          quality: imageQuality,
          performance: {
            cacheTier: chapterCacheTier,
            customCacheSize: size * 1024 * 1024
          }
        },
        () => size >= 10 && size <= sanityMaxCacheMB,
        () => checkHighMemoryWarning(size)
      )
    },
    [
      globalReaderSettings,
      forceDarkMode,
      imageQuality,
      chapterCacheTier,
      sanityMaxCacheMB,
      checkHighMemoryWarning
    ]
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

  return {
    globalReaderSettings,
    forceDarkMode,
    imageQuality,
    perMangaOverrides,
    isLoadingReaderSettings,
    chapterCacheTier,
    customCacheSize,
    sanityMaxCacheMB,
    handleReadingModeChange,
    handleDoublePageSettingChange,
    handleForceDarkModeChange,
    handleImageQualityChange,
    handleCacheTierChange,
    handleCustomCacheSizeChange,
    handleResetMangaOverride,
    handleClearAllOverrides,
    loadFromSettings,
    finishLoading
  }
}
