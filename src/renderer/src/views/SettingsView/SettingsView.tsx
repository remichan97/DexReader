import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToastStore, useAppStore } from '@renderer/stores'
import { useNavigationBlocker } from '@renderer/hooks/useNavigationBlocker'
import { useUnsavedChanges } from '@renderer/hooks/useUnsavedChanges'
import { useTranslation } from '@renderer/hooks/useTranslation'
import i18next from '@renderer/i18n/config'
import type { MangaReadingSettings, AppSettings } from '../../../../preload/index.d'
import { AppearanceSettings } from './components/AppearanceSettings'
import { LanguageSettings } from './components/LanguageSettings'
import { ReaderSettingsSection } from './components/ReaderSettingsSection'
import { PerformanceSettingsSection } from './components/PerformanceSettingsSection'
import { DownloadsSettings } from './components/DownloadsSettings'
import { StorageManagementSettings } from './components/StorageManagementSettings'
import { CacheManagementSettings } from './components/CacheManagementSettings'
import { SecuritySettings } from './components/SecuritySettings'
import { AdvancedSettings } from './components/AdvancedSettings'
import { LoggingSettings } from './components/LoggingSettings'
import { DangerZoneSettings } from '../../components/SettingsView/DangerZoneSettings'
import { GatekeeperSetupModal } from '@renderer/components/GatekeeperSetupModal'
import { GatekeeperChangeModal } from '@renderer/components/GatekeeperChangeModal'
import { GatekeeperResetPrompt } from '@renderer/components/GatekeeperResetPrompt'
import { UnsavedChangesBanner } from './components/UnsavedChangesBanner'
import { SettingsHeader } from './components/SettingsHeader'
import type { SettingsSection } from './components/SettingsHeader'
import { useScrollSpy } from './hooks/useScrollSpy'
import { ContentLanguage } from '../../../../main/settings/enums/content-language.enum'
import './SettingsView.css'

interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  settings: MangaReadingSettings
}

// Section IDs for navigation and scroll spy
const SECTION_IDS = [
  'appearance',
  'language',
  'reader',
  'downloads',
  'performance',
  'storage',
  'security',
  'advanced'
] as const

// Maps each modified-setting key to its section ID for scroll-to navigation
const SETTING_TO_SECTION: Record<string, string> = {
  themeMode: 'appearance',
  accentColor: 'appearance',
  startupPage: 'appearance',
  displayLanguage: 'language',
  syncContentLanguage: 'language',
  contentLanguages: 'language',
  globalReaderSettings: 'reader',
  forceDarkMode: 'reader',
  imageQuality: 'reader',
  downloadConfirmation: 'downloads',
  defaultQuality: 'downloads',
  maxConcurrentDownloads: 'downloads',
  downloadsPath: 'downloads',
  chapterCacheTier: 'performance',
  customCacheSize: 'performance',
  maxDiskCacheSize: 'performance',
  autoCheckForUpdates: 'advanced',
  autoDownloadUpdates: 'advanced',
  logRetentionDays: 'advanced'
}

export function SettingsView(): JSX.Element {
  // Translation
  const { t } = useTranslation(['settings', 'common'])

  // Search params for section navigation
  const [searchParams, setSearchParams] = useSearchParams()

  // Zustand stores
  const showToast = useToastStore((state) => state.show)

  // Unsaved changes context for app-wide tracking
  const { setHasUnsavedChanges: setGlobalUnsavedChanges } = useUnsavedChanges()

  // App state (theme)
  const { themeMode, setThemeMode } = useAppStore()

  // Settings tracking for unsaved changes
  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Section navigation state
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [isInitialMount, setIsInitialMount] = useState(true)

  // Track modified settings for visual indicators
  const [modifiedSettings, setModifiedSettings] = useState<Set<string>>(new Set())

  // Gatekeeper modal states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // Build settings sections array for navigation
  const settingsSections: SettingsSection[] = SECTION_IDS.map((id) => ({
    id,
    label: t(`settings:tabs.${id}`, { defaultValue: id }),
    translationKey: `settings:tabs.${id}`
  }))

  // Scroll spy to track current visible section
  const currentSection = useScrollSpy(SECTION_IDS)

  // Local state for UI
  const [downloadsPath, setDownloadsPath] = useState<string>('')
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [isChangingPath, setIsChangingPath] = useState(false)
  const [downloadConfirmation, setDownloadConfirmation] = useState<
    'always' | 'batch-only' | 'never'
  >('batch-only')
  const [defaultQuality, setDefaultQuality] = useState<'data' | 'data-saver'>('data')
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState<number>(3)
  const [maxDiskCacheSize, setMaxDiskCacheSize] = useState<number>(50 * 1024 * 1024)
  const [accentColor, setAccentColor] = useState<string>('#0078d4')
  const [isUsingSystemColor, setIsUsingSystemColor] = useState<boolean>(true)
  const [systemAccentColor, setSystemAccentColor] = useState<string>('#0078d4')
  const [startupPage, setStartupPage] = useState<'library' | 'browse' | 'downloads'>('browse')
  const [displayLanguage, setDisplayLanguage] = useState<'en-GB' | 'en-US' | 'vi-VN'>('en-GB')
  const [syncContentLanguage, setSyncContentLanguage] = useState<boolean>(true)
  const [contentLanguages, setContentLanguages] = useState<string[]>(['en'])

  // Reader settings state
  const [globalReaderSettings, setGlobalReaderSettings] = useState<MangaReadingSettings>({
    readingMode: 'single' as MangaReadingSettings['readingMode']
  })
  const [forceDarkMode, setForceDarkMode] = useState<boolean>(true)
  const [imageQuality, setImageQuality] = useState<'data' | 'data-saver'>('data')
  const [perMangaOverrides, setPerMangaOverrides] = useState<PerMangaOverride[]>([])
  const [isLoadingReaderSettings, setIsLoadingReaderSettings] = useState(true)

  // Performance settings state (chapter cache)
  const [chapterCacheTier, setChapterCacheTier] = useState<'low' | 'normal' | 'high' | 'custom'>(
    'normal'
  )
  const [customCacheSize, setCustomCacheSize] = useState<number>(200)
  const [sanityMaxCacheMB, setSanityMaxCacheMB] = useState<number>(4800) // Will be loaded from backend

  // Update settings state
  const [autoCheckForUpdates, setAutoCheckForUpdates] = useState<boolean>(true)
  const [autoDownloadUpdates, setAutoDownloadUpdates] = useState<boolean>(false)

  // Logging settings state
  const [logRetentionDays, setLogRetentionDays] = useState<number>(7)

  // Load sanity maximum on mount (30% of RAM)
  useEffect(() => {
    async function loadSanityMax(): Promise<void> {
      const result = await globalThis.settings.getMemoryTierInfo()
      if (result.success && result.data) {
        setSanityMaxCacheMB(Math.round(result.data.systemRAM_GB * 1024 * 0.3))
      }
    }
    loadSanityMax()
  }, [])

  // Set document title
  useEffect(() => {
    document.title = `${t('settings:pageTitle')} - DexReader`
  }, [t])

  // Block navigation when there are unsaved changes (uses translations automatically)
  useNavigationBlocker(hasUnsavedChanges)

  // Sync local hasUnsavedChanges with global context for app-wide tracking
  useEffect(() => {
    setGlobalUnsavedChanges(hasUnsavedChanges)
  }, [hasUnsavedChanges, setGlobalUnsavedChanges])

  // Smart dirty checking - compare current state with original settings
  useEffect(() => {
    if (!originalSettings) return

    // Compare appearance settings
    const appearanceChanged =
      themeMode !== originalSettings.appearance.theme ||
      startupPage !== originalSettings.appearance.startupPage ||
      (isUsingSystemColor
        ? originalSettings.appearance.accentColor !== undefined
        : originalSettings.appearance.accentColor !== accentColor)

    // Compare language settings
    const languageChanged =
      displayLanguage !== (originalSettings.language?.displayLanguage ?? 'en-GB') ||
      syncContentLanguage !== (originalSettings.language?.syncContentLanguage ?? true) ||
      JSON.stringify(contentLanguages) !==
        JSON.stringify(originalSettings.language?.contentLanguage || ['en'])

    // Compare downloads settings
    const downloadsChanged =
      downloadConfirmation !== originalSettings.downloads.shouldConfirmDownload ||
      defaultQuality !== originalSettings.downloads.defaultQuality ||
      maxConcurrentDownloads !== originalSettings.downloads.maxConcurrentDownloads ||
      maxDiskCacheSize !== originalSettings.downloads.maxDiskCacheSize ||
      downloadsPath !== (originalSettings.downloads.downloadPath || '')

    // Compare reader settings
    const readerChanged =
      forceDarkMode !== originalSettings.reader.forceDarkMode ||
      imageQuality !== originalSettings.reader.quality ||
      JSON.stringify(globalReaderSettings) !== JSON.stringify(originalSettings.reader.global) ||
      chapterCacheTier !== originalSettings.reader.performance.cacheTier ||
      (chapterCacheTier === 'custom' &&
        customCacheSize * 1024 * 1024 !==
          (originalSettings.reader.performance.customCacheSize ?? 200 * 1024 * 1024))

    // Compare update settings
    const updateChanged =
      autoCheckForUpdates !== originalSettings.update.autoCheck ||
      autoDownloadUpdates !== originalSettings.update.autoDownload

    // Compare logging settings
    const logsChanged = logRetentionDays !== (originalSettings.logs?.retentionInDays ?? 7)

    setHasUnsavedChanges(
      appearanceChanged ||
        languageChanged ||
        downloadsChanged ||
        readerChanged ||
        updateChanged ||
        logsChanged
    )
  }, [
    originalSettings,
    themeMode,
    startupPage,
    accentColor,
    isUsingSystemColor,
    displayLanguage,
    syncContentLanguage,
    contentLanguages,
    downloadConfirmation,
    defaultQuality,
    maxConcurrentDownloads,
    maxDiskCacheSize,
    downloadsPath,
    globalReaderSettings,
    forceDarkMode,
    imageQuality,
    chapterCacheTier,
    customCacheSize,
    autoCheckForUpdates,
    autoDownloadUpdates,
    logRetentionDays
  ])

  // Search params support for deep linking to sections
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && SECTION_IDS.includes(section as (typeof SECTION_IDS)[number])) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        // Scroll to section without highlighting on initial mount
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
    // Mark as no longer initial mount after first render
    setIsInitialMount(false)
  }, [])

  // Update search params when current section changes (from scrolling)
  useEffect(() => {
    if (currentSection && !isInitialMount) {
      const currentSection_param = searchParams.get('section')
      // Only update if section param is different to avoid unnecessary history updates
      if (currentSection_param !== currentSection) {
        setSearchParams({ section: currentSection }, { replace: true })
      }
    }
  }, [currentSection, isInitialMount, searchParams, setSearchParams])

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const pathsResult = await globalThis.fileSystem.getAllowedPaths()
        if (!pathsResult.success || !pathsResult.data) {
          throw new Error('Failed to get allowed paths')
        }
        const paths = pathsResult.data
        setDownloadsPath(paths.downloads)

        // Get system accent color first
        const systemAccentResult = await globalThis.api.getSystemAccentColor()
        if (!systemAccentResult.success || !systemAccentResult.data) {
          throw new Error('Failed to get system accent color')
        }
        const systemAccent = systemAccentResult.data as string
        setSystemAccentColor(systemAccent)

        // Load settings via IPC
        try {
          const settingsResult = await globalThis.settings.load()
          if (!settingsResult.success || !settingsResult.data) {
            throw new Error('Failed to load settings')
          }
          const settings = settingsResult.data

          // Load theme from settings
          if (settings.appearance.theme) {
            setThemeMode(settings.appearance.theme)
          }

          // Load startup page from settings
          if (settings.appearance.startupPage) {
            setStartupPage(settings.appearance.startupPage)
          }

          if (settings.appearance.accentColor) {
            // User has custom color - use it
            setAccentColor(settings.appearance.accentColor)
            setIsUsingSystemColor(false)
            applyAccentColor(settings.appearance.accentColor)
          } else {
            // No custom color - use system color
            setAccentColor(systemAccent)
            setIsUsingSystemColor(true)
            applyAccentColor(systemAccent)
          }

          // Load downloads settings
          if (settings.downloads) {
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
          }

          // Load reader settings
          if (settings.reader) {
            if (settings.reader.global) {
              setGlobalReaderSettings(settings.reader.global)
            }

            if (settings.reader.forceDarkMode !== undefined) {
              setForceDarkMode(settings.reader.forceDarkMode)
            }

            if (settings.reader.quality !== undefined) {
              setImageQuality(settings.reader.quality)
            }

            // Load performance settings (chapter cache)
            if (settings.reader.performance) {
              setChapterCacheTier(settings.reader.performance.cacheTier)
              // Convert from bytes to MB, use default 200MB if undefined
              const loadedCustomCacheSize =
                settings.reader.performance.customCacheSize === undefined
                  ? 200
                  : settings.reader.performance.customCacheSize / (1024 * 1024)
              setCustomCacheSize(loadedCustomCacheSize)
            }
          }

          // Load update settings
          if (settings.update) {
            setAutoCheckForUpdates(settings.update.autoCheck ?? true)
            setAutoDownloadUpdates(settings.update.autoDownload ?? false)
          }

          // Load logging settings
          if (settings.logs) {
            setLogRetentionDays(settings.logs.retentionInDays ?? 7)
          }

          // Load language settings
          if (settings.language?.displayLanguage) {
            setDisplayLanguage(settings.language.displayLanguage)
            // Apply the language immediately
            await i18next.changeLanguage(settings.language.displayLanguage)
          }
          if (settings.language?.syncContentLanguage !== undefined) {
            setSyncContentLanguage(settings.language.syncContentLanguage)
          }
          if (settings.language?.contentLanguage) {
            setContentLanguages(settings.language.contentLanguage)
          }

          // Load per-manga overrides from database
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

          // Store original settings for dirty tracking
          // IMPORTANT: Include the actual downloadsPath to avoid false dirty state
          const settingsWithPath = {
            ...settings,
            downloads: {
              ...settings.downloads,
              downloadPath: paths.downloads
            }
          }
          setOriginalSettings(settingsWithPath)
        } catch {
          // Settings file doesn't exist - use system color
          setAccentColor(systemAccent)
          setIsUsingSystemColor(true)
          applyAccentColor(systemAccent)
        }
      } catch {
        // Fallback to default if everything fails
        setAccentColor('#0078d4')
        applyAccentColor('#0078d4')
      } finally {
        setIsLoadingPath(false)
        setIsLoadingReaderSettings(false)
      }
    }
    loadSettings()
  }, [showToast, setThemeMode])

  // Listen for system accent color changes
  useEffect(() => {
    const handleAccentColorChange = (newColor: string): void => {
      setSystemAccentColor(newColor)
      // If user is currently using system color, update the active color too
      if (isUsingSystemColor) {
        setAccentColor(newColor)
        applyAccentColor(newColor)
      }
    }

    globalThis.api.onAccentColorChanged(handleAccentColorChange)
  }, [isUsingSystemColor])

  // Apply accent color to CSS variables
  const applyAccentColor = (color: string): void => {
    const root = document.documentElement
    root.style.setProperty('--win-accent', color)

    // Calculate hover and active states (slightly darker/lighter)
    const rgb = Number.parseInt(color.slice(1), 16)
    const r = (rgb >> 16) & 255
    const g = (rgb >> 8) & 255
    const b = rgb & 255

    // Darker for hover (-10%)
    const hoverR = Math.max(0, Math.floor(r * 0.9))
    const hoverG = Math.max(0, Math.floor(g * 0.9))
    const hoverB = Math.max(0, Math.floor(b * 0.9))
    const hoverColor = `#${((hoverR << 16) | (hoverG << 8) | hoverB).toString(16).padStart(6, '0')}`

    // Even darker for active (-20%)
    const activeR = Math.max(0, Math.floor(r * 0.8))
    const activeG = Math.max(0, Math.floor(g * 0.8))
    const activeB = Math.max(0, Math.floor(b * 0.8))
    const activeColor = `#${((activeR << 16) | (activeG << 8) | activeB).toString(16).padStart(6, '0')}`

    root.style.setProperty('--win-accent-hover', hoverColor)
    root.style.setProperty('--win-accent-active', activeColor)
  }

  // Helper to mark a setting as modified
  const markSettingModified = (settingKey: string): void => {
    setModifiedSettings((prev) => new Set(prev).add(settingKey))
  }

  // Restore system accent color
  const handleUseSystemColor = (): void => {
    setAccentColor(systemAccentColor)
    setIsUsingSystemColor(true)
    applyAccentColor(systemAccentColor)
    markSettingModified('accentColor')
  }

  // Handle accent color change
  const handleAccentColorChange = (color: string): void => {
    setAccentColor(color)
    setIsUsingSystemColor(false)
    applyAccentColor(color)
    markSettingModified('accentColor')
  }

  // Handle theme mode change
  const handleThemeModeChange = (mode: string): void => {
    setThemeMode(mode as 'system' | 'light' | 'dark')
    markSettingModified('themeMode')
  }

  // Handle display language change
  const handleDisplayLanguageChange = (language: string): void => {
    setDisplayLanguage(language as 'en-GB' | 'en-US' | 'vi-VN')
    markSettingModified('displayLanguage')
  }

  // Handle sync content language change
  const handleSyncContentLanguageChange = (checked: boolean): void => {
    setSyncContentLanguage(checked)
    markSettingModified('syncContentLanguage')
  }

  // Handle content languages change
  const handleContentLanguagesChange = (languages: string[]): void => {
    setContentLanguages(languages)
    markSettingModified('contentLanguages')
  }

  // Handle download confirmation change
  const handleDownloadConfirmationChange = (confirmation: string): void => {
    setDownloadConfirmation(confirmation as 'always' | 'batch-only' | 'never')
    markSettingModified('downloadConfirmation')
  }

  // Handle default quality change
  const handleDefaultQualityChange = (quality: string): void => {
    setDefaultQuality(quality as 'data' | 'data-saver')
    markSettingModified('defaultQuality')
  }

  // Handle max concurrent downloads change
  const handleMaxConcurrentDownloadsChange = (count: string | string[]): void => {
    const selectedCount = Array.isArray(count) ? count[0] : count
    const numericCount = Number.parseInt(selectedCount, 10)
    setMaxConcurrentDownloads(numericCount)
    markSettingModified('maxConcurrentDownloads')
  }

  // Handle cover cache limit change
  const handleCoverCacheLimitChange = (limitMB: number): void => {
    setMaxDiskCacheSize(limitMB === 0 ? 0 : limitMB * 1024 * 1024)
    markSettingModified('maxDiskCacheSize')
  }

  // Handle downloads folder selection
  const handleSelectDownloadsFolder = async (): Promise<void> => {
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
  }

  // Handle global reading mode change
  const handleReadingModeChange = (mode: string | string[]): void => {
    // Select component returns string or string[], we only support single selection
    const selectedMode = Array.isArray(mode) ? mode[0] : mode

    const updatedSettings: MangaReadingSettings = {
      ...globalReaderSettings,
      readingMode: selectedMode as MangaReadingSettings['readingMode']
    }
    setGlobalReaderSettings(updatedSettings)
    markSettingModified('globalReaderSettings')
  }

  // Handle double page mode checkbox changes
  const handleDoublePageSettingChange = (
    key: 'skipCoverPages' | 'readRightToLeft',
    value: boolean
  ): void => {
    const updatedSettings: MangaReadingSettings = {
      ...globalReaderSettings,
      doublePageMode: {
        skipCoverPages: globalReaderSettings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: globalReaderSettings.doublePageMode?.readRightToLeft ?? true,
        [key]: value
      }
    }
    setGlobalReaderSettings(updatedSettings)
    markSettingModified('globalReaderSettings')
  }

  // Handle force dark mode toggle
  const handleForceDarkModeChange = (enabled: boolean): void => {
    setForceDarkMode(enabled)
    markSettingModified('forceDarkMode')
  }

  // Handle image quality change
  const handleImageQualityChange = (quality: string): void => {
    setImageQuality(quality as 'data' | 'data-saver')
    markSettingModified('imageQuality')
  }

  // Handle startup page change (appearance section)
  const handleStartupPageChange = (page: 'library' | 'browse' | 'downloads'): void => {
    setStartupPage(page)
    markSettingModified('startupPage')
  }

  // Handle cache tier change (performance section)
  const handleCacheTierChange = (tier: 'low' | 'normal' | 'high' | 'custom'): void => {
    setChapterCacheTier(tier)
    markSettingModified('chapterCacheTier')
  }

  // Handle custom cache size change (performance section)
  const handleCustomCacheSizeChange = (size: number): void => {
    setCustomCacheSize(size)
    markSettingModified('customCacheSize')
  }

  // Handle auto check for updates change (advanced section)
  const handleAutoCheckChange = (enabled: boolean): void => {
    setAutoCheckForUpdates(enabled)
    markSettingModified('autoCheckForUpdates')
  }

  // Handle auto download updates change (advanced section)
  const handleAutoDownloadChange = (enabled: boolean): void => {
    setAutoDownloadUpdates(enabled)
    markSettingModified('autoDownloadUpdates')
  }

  // Handle log retention days change (advanced section)
  const handleLogRetentionDaysChange = (days: number): void => {
    setLogRetentionDays(days)
    markSettingModified('logRetentionDays')
  }

  // Gatekeeper modal handlers
  const handleGatekeeperSuccess = (): void => {
    // Refresh the SecuritySettings component status
    const refreshFn = (globalThis as Record<string, unknown>).__refreshGatekeeperStatus as
      | (() => void)
      | undefined
    if (typeof refreshFn === 'function') {
      refreshFn()
    }
  }

  // Reset individual manga override
  const handleResetMangaOverride = async (mangaId: string): Promise<void> => {
    try {
      const result = await globalThis.reader.resetMangaReaderSettings(mangaId)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to reset settings')
      }

      setPerMangaOverrides((prev) => prev.filter((o) => o.mangaId !== mangaId))
      // Success - no toast needed
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to reset override',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Clear all manga overrides
  const handleClearAllOverrides = async (): Promise<void> => {
    try {
      // Clear all overrides in a single database operation
      const result = await globalThis.reader.clearAllOverrides()

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear all overrides')
      }

      setPerMangaOverrides([])
      // Success - no toast needed
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to clear overrides',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Save all settings changes using validated batch save
  const handleSaveSettings = async (): Promise<void> => {
    if (!originalSettings) return

    try {
      // Track if language changed for restart prompt
      const languageChanged =
        displayLanguage !== (originalSettings.language?.displayLanguage ?? 'en-GB')

      // Client-side validation: Custom cache range check
      if (chapterCacheTier === 'custom') {
        // Get sanity maximum (30% of RAM)
        const tierInfoResult = await globalThis.settings.getMemoryTierInfo()
        if (tierInfoResult.success && tierInfoResult.data) {
          const sanityMaxMB = Math.round(tierInfoResult.data.systemRAM_GB * 1024 * 0.3)

          if (customCacheSize < 10 || customCacheSize > sanityMaxMB) {
            // Already showing error in UI, just return
            return
          }

          // Check if user has suppressed warnings for values above recommended
          const suppressWarnings = localStorage.getItem('suppressCacheWarnings') === 'true'

          if (!suppressWarnings && customCacheSize > tierInfoResult.data.recommendedMaxMB) {
            const { recommendedMaxMB, systemRAM_GB } = tierInfoResult.data

            // Show warning if exceeds recommendation but within sanity limit
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
            if (!result.success || result.data.response === 1) return

            // User checked "don't warn again" - store preference
            if (result.data.checkboxChecked) {
              localStorage.setItem('suppressCacheWarnings', 'true')
            }
          }
        }
      }

      // Build appearance settings object
      const appearanceSettings = {
        theme: themeMode,
        accentColor: isUsingSystemColor ? undefined : accentColor,
        startupPage: startupPage
      }

      // Build downloads settings object
      const downloadsSettings = {
        downloadPath: downloadsPath || undefined,
        shouldConfirmDownload: downloadConfirmation,
        defaultQuality: defaultQuality,
        maxConcurrentDownloads: maxConcurrentDownloads,
        maxDiskCacheSize: maxDiskCacheSize
      }

      // Build reader settings object WITH performance settings
      const readerSettings = {
        global: globalReaderSettings,
        forceDarkMode: forceDarkMode,
        quality: imageQuality,
        performance: {
          cacheTier: chapterCacheTier,
          customCacheSize: chapterCacheTier === 'custom' ? customCacheSize * 1024 * 1024 : undefined // Convert MB to bytes
        }
      }

      // Build update settings object
      const updateSettings = {
        autoCheck: autoCheckForUpdates,
        autoDownload: autoDownloadUpdates
      }

      // Build logging settings object
      const logsSettings = {
        retentionInDays: logRetentionDays
      }

      // Build language settings object
      const languageSettings = {
        displayLanguage: displayLanguage,
        syncContentLanguage: syncContentLanguage,
        ...(contentLanguages.length > 0 && {
          contentLanguage: contentLanguages as ContentLanguage[]
        })
      }

      // Build complete settings object and save in one operation (single disk write)
      const completeSettings = {
        version: originalSettings.version,
        appearance: appearanceSettings,
        downloads: downloadsSettings,
        reader: readerSettings,
        update: updateSettings,
        logs: logsSettings,
        search: originalSettings.search || {},
        language: languageSettings
      }

      const saveResult = await globalThis.settings.saveAll(completeSettings)
      if (!saveResult.success) {
        throw new Error(saveResult.error?.message || 'Failed to save settings')
      }

      // Update original settings to current state (load fresh to get properly typed values)
      const freshSettings = await globalThis.settings.load()
      if (freshSettings.success && freshSettings.data) {
        setOriginalSettings(freshSettings.data)
      }
      setHasUnsavedChanges(false)
      setModifiedSettings(new Set()) // Clear modified indicators

      // If language changed, prompt for restart
      if (languageChanged) {
        // Get language display name for the dialog
        const languageNames = {
          'en-GB': 'English (UK)',
          'en-US': 'English (US)',
          'vi-VN': 'Tiếng Việt'
        }
        const languageName = languageNames[displayLanguage]

        const result = await globalThis.api.showConfirmDialog(
          t('dialogs:changeLanguage.title'),
          t('dialogs:changeLanguage.message', { language: languageName }),
          t('dialogs:changeLanguage.buttons.restart', { defaultValue: 'Yes, Restart Now' }),
          t('dialogs:changeLanguage.buttons.later', { defaultValue: 'Maybe Later' })
        )

        // If user clicked "Restart Now" (button index 1)
        if (result.success && result.data) {
          await globalThis.settings.restart()
        }
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Validation failed'
      })
    }
  }

  // Handle section navigation with smooth scroll
  const handleSectionSelect = (sectionId: string): void => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Trigger highlight animation
      setHighlightedSection(sectionId)

      // Remove highlight after animation completes
      setTimeout(() => {
        setHighlightedSection(null)
      }, 1500)

      // Update search params
      setSearchParams({ section: sectionId }, { replace: true })
    }
  }

  // Helper function to get human-readable label for setting key
  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      themeMode: t('settings:appearance.themeLabel', { defaultValue: 'Theme' }),
      accentColor: t('settings:appearance.accentLabel', { defaultValue: 'Accent Colour' }),
      startupPage: t('settings:appearance.startupPageLabel', { defaultValue: 'Startup Page' }),
      displayLanguage: t('settings:appearance.languageLabel', { defaultValue: 'Display Language' }),
      syncContentLanguage: t('settings:appearance.syncContentLanguage', {
        defaultValue: 'Sync content language with display language'
      }),
      contentLanguages: t('settings:language.contentLanguageLabel', {
        defaultValue: 'Content Languages'
      }),
      downloadConfirmation: t('settings:downloads.confirmationLabel', {
        defaultValue: 'Download Confirmation'
      }),
      defaultQuality: t('settings:downloads.qualityLabel', { defaultValue: 'Default Quality' }),
      maxConcurrentDownloads: t('settings:downloads.concurrentLabel', {
        defaultValue: 'Concurrent Downloads'
      }),
      maxDiskCacheSize: t('settings:cacheManagement.coverCacheLimitLabel', {
        defaultValue: 'Cover Cache Limit'
      }),
      downloadsPath: t('settings:downloads.locationLabel', { defaultValue: 'Download Location' }),
      globalReaderSettings: t('settings:reader.settingsLabel', { defaultValue: 'Reader Settings' }),
      forceDarkMode: t('settings:reader.forceDarkModeLabel', {
        defaultValue: 'Force Dark Mode on Manga Pages'
      }),
      imageQuality: t('settings:reader.imageQualityLabel', { defaultValue: 'Image Quality' }),
      chapterCacheTier: t('settings:performance.sectionTitle', {
        defaultValue: 'Chapter Cache Size'
      }),
      customCacheSize: t('settings:performance.customCacheLabel', {
        defaultValue: 'Custom Cache Size'
      }),
      autoCheckForUpdates: t('settings:advanced.autoCheckLabel', {
        defaultValue: 'Automatically check for updates'
      }),
      autoDownloadUpdates: t('settings:advanced.autoDownloadLabel', {
        defaultValue: 'Automatically download updates'
      }),
      logRetentionDays: t('settings:logging.retentionLabel', {
        defaultValue: 'Log Retention Period'
      })
    }
    return labels[key] || key
  }

  const getSettingSection = (key: string): string => SETTING_TO_SECTION[key] ?? 'appearance'

  // Reset all settings to their saved values
  const handleResetSettings = (): void => {
    if (!originalSettings) return

    // Restore appearance settings
    setThemeMode(originalSettings.appearance.theme)
    setStartupPage(originalSettings.appearance.startupPage)
    if (originalSettings.appearance.accentColor) {
      setAccentColor(originalSettings.appearance.accentColor)
      setIsUsingSystemColor(false)
      applyAccentColor(originalSettings.appearance.accentColor)
    } else {
      setAccentColor(systemAccentColor)
      setIsUsingSystemColor(true)
      applyAccentColor(systemAccentColor)
    }

    // Restore language settings
    if (originalSettings.language?.displayLanguage) {
      setDisplayLanguage(originalSettings.language.displayLanguage)
    }

    // Restore downloads settings
    setDownloadConfirmation(originalSettings.downloads.shouldConfirmDownload)
    setDefaultQuality(originalSettings.downloads.defaultQuality)
    setMaxConcurrentDownloads(originalSettings.downloads.maxConcurrentDownloads)
    setMaxDiskCacheSize(originalSettings.downloads.maxDiskCacheSize)

    // Restore reader settings
    setGlobalReaderSettings(originalSettings.reader.global)
    setForceDarkMode(originalSettings.reader.forceDarkMode)
    setImageQuality(originalSettings.reader.quality)

    // Restore performance settings
    setChapterCacheTier(originalSettings.reader.performance.cacheTier)
    if (originalSettings.reader.performance.customCacheSize === undefined) {
      setCustomCacheSize(200) // Fallback to Normal default
    } else {
      // Convert from bytes to MB
      setCustomCacheSize(originalSettings.reader.performance.customCacheSize / (1024 * 1024))
    }

    // Restore update settings
    setAutoCheckForUpdates(originalSettings.update.autoCheck ?? true)
    setAutoDownloadUpdates(originalSettings.update.autoDownload ?? false)

    // Restore logging settings
    setLogRetentionDays(originalSettings.logs?.retentionInDays ?? 7)

    setHasUnsavedChanges(false)
    setModifiedSettings(new Set()) // Clear modified indicators
  }

  // Check if custom cache size is invalid (only block if < 10 MB)
  // Check if custom cache size is invalid (blocks saving)
  const isInvalidCustomCache =
    chapterCacheTier === 'custom' && (customCacheSize < 10 || customCacheSize > sanityMaxCacheMB)

  return (
    <div className="settings-view__container">
      {/* Unsaved changes banner (fixed bottom) */}
      {hasUnsavedChanges && (
        <UnsavedChangesBanner
          onSave={handleSaveSettings}
          onReset={handleResetSettings}
          disabled={isInvalidCustomCache}
          modifiedSettings={modifiedSettings}
          getSettingLabel={getSettingLabel}
          getSettingSection={getSettingSection}
          onScrollToSection={handleSectionSelect}
        />
      )}

      {/* Sticky header with section navigation */}
      <SettingsHeader
        currentSection={currentSection}
        sections={settingsSections}
        onSectionSelect={handleSectionSelect}
      />

      {/* Screen reader heading */}
      <h1 className="sr-only">{t('settings:pageTitle')}</h1>

      <div className="settings-content">
        {/* Appearance Settings */}
        <section
          id="appearance"
          className={`settings-section ${highlightedSection === 'appearance' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.appearance')}</h2>
          <AppearanceSettings
            themeMode={themeMode}
            onThemeModeChange={handleThemeModeChange}
            accentColor={accentColor}
            onAccentColorChange={handleAccentColorChange}
            isUsingSystemColor={isUsingSystemColor}
            systemAccentColor={systemAccentColor}
            onUseSystemColor={handleUseSystemColor}
            startupPage={startupPage}
            onStartupPageChange={handleStartupPageChange}
            modifiedSettings={modifiedSettings}
          />
        </section>

        {/* Language Settings */}
        <section
          id="language"
          className={`settings-section ${highlightedSection === 'language' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">
            {t('settings:tabs.language', { defaultValue: 'Language' })}
          </h2>
          <LanguageSettings
            displayLanguage={displayLanguage}
            onDisplayLanguageChange={handleDisplayLanguageChange}
            syncContentLanguage={syncContentLanguage}
            onSyncContentLanguageChange={handleSyncContentLanguageChange}
            contentLanguages={contentLanguages}
            onContentLanguagesChange={handleContentLanguagesChange}
            modifiedSettings={modifiedSettings}
          />
        </section>

        {/* Reader Settings */}
        <section
          id="reader"
          className={`settings-section ${highlightedSection === 'reader' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.reader')}</h2>
          <ReaderSettingsSection
            isLoading={isLoadingReaderSettings}
            forceDarkMode={forceDarkMode}
            onForceDarkModeChange={handleForceDarkModeChange}
            imageQuality={imageQuality}
            onImageQualityChange={handleImageQualityChange}
            globalReaderSettings={globalReaderSettings}
            onReadingModeChange={handleReadingModeChange}
            onDoublePageSettingChange={handleDoublePageSettingChange}
            perMangaOverrides={perMangaOverrides}
            onResetMangaOverride={handleResetMangaOverride}
            onClearAllOverrides={handleClearAllOverrides}
            modifiedSettings={modifiedSettings}
          />
        </section>

        {/* Downloads Settings */}
        <section
          id="downloads"
          className={`settings-section ${highlightedSection === 'downloads' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.downloads')}</h2>
          <DownloadsSettings
            downloadsPath={downloadsPath}
            isLoadingPath={isLoadingPath}
            isChangingPath={isChangingPath}
            downloadConfirmation={downloadConfirmation}
            defaultQuality={defaultQuality}
            maxConcurrentDownloads={maxConcurrentDownloads}
            onSelectDownloadsFolder={handleSelectDownloadsFolder}
            onDownloadConfirmationChange={handleDownloadConfirmationChange}
            onDefaultQualityChange={handleDefaultQualityChange}
            onMaxConcurrentDownloadsChange={handleMaxConcurrentDownloadsChange}
            modifiedSettings={modifiedSettings}
          />
        </section>

        {/* Performance Settings */}
        <section
          id="performance"
          className={`settings-section ${highlightedSection === 'performance' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">
            {t('settings:tabs.performance', { defaultValue: 'Performance' })}
          </h2>
          <PerformanceSettingsSection
            cacheTier={chapterCacheTier}
            customCacheSize={customCacheSize}
            onCacheTierChange={handleCacheTierChange}
            onCustomCacheSizeChange={handleCustomCacheSizeChange}
            modifiedSettings={modifiedSettings}
          />
          <div className="settings-view__section-divider">
            <h3 className="settings-view__section-heading">
              {t('settings:cacheManagement.sectionTitle')}
            </h3>
            <p className="settings-view__section-description">
              {t('settings:cacheManagement.sectionDescription')}
            </p>

            <CacheManagementSettings
              coverCacheLimit={maxDiskCacheSize === 0 ? 0 : maxDiskCacheSize / (1024 * 1024)}
              onCoverCacheLimitChange={handleCoverCacheLimitChange}
              modifiedSettings={modifiedSettings}
            />
          </div>
        </section>

        {/* Storage Management Settings */}
        <section
          id="storage"
          className={`settings-section ${highlightedSection === 'storage' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.storage')}</h2>
          <StorageManagementSettings />
        </section>

        {/* Security Settings */}
        <section
          id="security"
          className={`settings-section ${highlightedSection === 'security' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">
            {t('settings:tabs.security', { defaultValue: 'Security' })}
          </h2>
          <SecuritySettings
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
            onOpenChangeModal={() => setIsChangeModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        </section>

        {/* Advanced Settings */}
        <section
          id="advanced"
          className={`settings-section ${highlightedSection === 'advanced' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.advanced')}</h2>
          <AdvancedSettings
            autoCheckForUpdates={autoCheckForUpdates}
            autoDownloadUpdates={autoDownloadUpdates}
            onAutoCheckChange={handleAutoCheckChange}
            onAutoDownloadChange={handleAutoDownloadChange}
            modifiedSettings={modifiedSettings}
          />
          <LoggingSettings
            retentionDays={logRetentionDays}
            onRetentionDaysChange={handleLogRetentionDaysChange}
            modifiedSettings={modifiedSettings}
          />
          <DangerZoneSettings />
        </section>
      </div>

      {/* Gatekeeper Modals */}
      <GatekeeperSetupModal
        open={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSuccess={handleGatekeeperSuccess}
      />
      <GatekeeperChangeModal
        open={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        onSuccess={handleGatekeeperSuccess}
      />
      <GatekeeperResetPrompt
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={handleGatekeeperSuccess}
      />
    </div>
  )
}
