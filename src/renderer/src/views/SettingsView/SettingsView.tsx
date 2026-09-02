import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToastStore } from '@renderer/stores'
import { useNavigationBlocker } from '@renderer/hooks/useNavigationBlocker'
import { useUnsavedChanges } from '@renderer/hooks/useUnsavedChanges'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
import { useAppearanceSettingsDomain } from './hooks/domains/useAppearanceSettingsDomain'
import { useLanguageSettingsDomain } from './hooks/domains/useLanguageSettingsDomain'
import { useDownloadsSettingsDomain } from './hooks/domains/useDownloadsSettingsDomain'
import { useReaderSettingsDomain } from './hooks/domains/useReaderSettingsDomain'
import { useAdvancedSettingsDomain } from './hooks/domains/useAdvancedSettingsDomain'
import { SECTION_IDS, getSettingLabel, getSettingSection } from './utils/settingsMeta'
import type { AppSettings } from '../../../../preload/window.types'
import './SettingsView.css'

export function SettingsView(): JSX.Element {
  // Translation
  const { t } = useTranslation(['settings', 'common'])

  // Search params for section navigation
  const [searchParams, setSearchParams] = useSearchParams()

  // Zustand stores
  const showToast = useToastStore((state) => state.show)

  // Unsaved changes context for app-wide tracking
  const { setHasUnsavedChanges: setGlobalUnsavedChanges } = useUnsavedChanges()

  // Settings tracking for unsaved changes
  const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Section navigation state
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [isInitialMount, setIsInitialMount] = useState(true)

  // Track modified settings for UnsavedChangesBanner
  const [modifiedSettings, setModifiedSettings] = useState<Set<string>>(new Set())

  // Gatekeeper modal states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // Helper to mark a setting as modified
  const markSettingModified = (settingKey: string): void => {
    setModifiedSettings((prev) => new Set(prev).add(settingKey))
  }

  // One hook per settings domain - each owns its own state plus
  // isDirty/buildPayload/reset, so the effects below drive all of them
  // through a single registry instead of enumerating each domain by hand.
  const appearance = useAppearanceSettingsDomain({ markSettingModified })
  const language = useLanguageSettingsDomain({ markSettingModified, t })
  const downloads = useDownloadsSettingsDomain({ markSettingModified, showToast })
  const reader = useReaderSettingsDomain({ markSettingModified, showToast, t })
  const advanced = useAdvancedSettingsDomain({ markSettingModified })

  const domains = [appearance, language, downloads, reader, advanced]

  // Build settings sections array for navigation
  const settingsSections: SettingsSection[] = SECTION_IDS.map((id) => ({
    id,
    label: t(`settings:tabs.${id}`, { defaultValue: id }),
    translationKey: `settings:tabs.${id}`
  }))

  // Scroll spy to track current visible section
  const currentSection = useScrollSpy(SECTION_IDS)

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

  // Smart dirty checking - ask every domain whether it changed instead of
  // hand-comparing each field here
  useEffect(() => {
    if (!originalSettings) return
    setHasUnsavedChanges(domains.some((domain) => domain.isDirty(originalSettings)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalSettings, appearance, language, downloads, reader, advanced])

  // Search params support for deep linking to sections
  // Note: Intentionally using empty dependency array - this should only run once on mount
  // for deep linking. Adding searchParams creates a feedback loop with the scroll spy effect.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        downloads.setDownloadsPath(paths.downloads)

        // Get system accent color first
        const systemAccentResult = await globalThis.api.getSystemAccentColor()
        if (!systemAccentResult.success || !systemAccentResult.data) {
          throw new Error('Failed to get system accent color')
        }
        const systemAccent = systemAccentResult.data as string

        // Load settings via IPC
        try {
          const settingsResult = await globalThis.settings.load()
          if (!settingsResult.success || !settingsResult.data) {
            throw new Error('Failed to load settings')
          }
          const settings = settingsResult.data

          appearance.loadFromSettings(settings, systemAccent)
          downloads.loadFromSettings(settings)
          reader.loadFromSettings(settings)
          await language.loadFromSettings(settings)
          advanced.loadFromSettings(settings)

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
          appearance.applyFallbackAccent(systemAccent)
        }
      } catch {
        // Fallback to default if everything fails
        appearance.applyFallbackAccent('#0078d4')
      } finally {
        downloads.finishLoading()
        reader.finishLoading()
      }
    }
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Save all settings changes using validated batch save
  const handleSaveSettings = async (): Promise<void> => {
    if (!originalSettings) return

    try {
      if (!(await reader.validateBeforeSave())) return

      // Build complete settings object and save in one operation (single disk write)
      const completeSettings = {
        version: originalSettings.version,
        search: originalSettings.search || {},
        ...appearance.buildPayload(),
        ...language.buildPayload(),
        ...downloads.buildPayload(),
        ...reader.buildPayload(),
        ...advanced.buildPayload()
      }

      // Each settings-domain hook (appearance, language, downloads, reader, advanced) declares
      // its own locally-scoped, value-compatible type for its enum-like fields (e.g. ThemeMode,
      // DownloadConfirmation, ImageQualityPreference) rather than importing the canonical
      // @shared/enums/settings/* enums directly. Unifying every domain hook onto the shared
      // enums is a larger, separate cleanup; this cast is the one deliberate boundary crossing
      // where the assembled payload meets the strictly-typed IPC contract.
      const saveResult = await globalThis.settings.saveAll(completeSettings as AppSettings)
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

      // If the display language changed, prompt for restart
      await language.maybePromptRestart(originalSettings)
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

  // Reset all settings to their saved values
  const handleResetSettings = (): void => {
    if (!originalSettings) return

    domains.forEach((domain) => domain.reset(originalSettings))

    setHasUnsavedChanges(false)
    setModifiedSettings(new Set()) // Clear modified indicators
  }

  return (
    <div className="settings-view__container">
      {/* Unsaved changes banner (fixed bottom) */}
      {hasUnsavedChanges && (
        <UnsavedChangesBanner
          onSave={handleSaveSettings}
          onReset={handleResetSettings}
          disabled={reader.isInvalidCustomCache}
          modifiedSettings={modifiedSettings}
          getSettingLabel={(key) => getSettingLabel(key, t)}
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
            themeMode={appearance.themeMode}
            onThemeModeChange={appearance.handleThemeModeChange}
            accentColor={appearance.accentColor}
            onAccentColorChange={appearance.handleAccentColorChange}
            isUsingSystemColor={appearance.isUsingSystemColor}
            systemAccentColor={appearance.systemAccentColor}
            onUseSystemColor={appearance.handleUseSystemColor}
            startupPage={appearance.startupPage}
            onStartupPageChange={appearance.handleStartupPageChange}
            sidebarSize={appearance.sidebarSize}
            onSidebarSizeChange={appearance.handleSidebarSizeChange}
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
            displayLanguage={language.displayLanguage}
            onDisplayLanguageChange={language.handleDisplayLanguageChange}
            syncContentLanguage={language.syncContentLanguage}
            onSyncContentLanguageChange={language.handleSyncContentLanguageChange}
            contentLanguages={language.contentLanguages}
            onContentLanguagesChange={language.handleContentLanguagesChange}
          />
        </section>

        {/* Reader Settings */}
        <section
          id="reader"
          className={`settings-section ${highlightedSection === 'reader' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.reader')}</h2>
          <ReaderSettingsSection
            isLoading={reader.isLoadingReaderSettings}
            forceDarkMode={reader.forceDarkMode}
            onForceDarkModeChange={reader.handleForceDarkModeChange}
            imageQuality={reader.imageQuality}
            onImageQualityChange={reader.handleImageQualityChange}
            globalReaderSettings={reader.globalReaderSettings}
            onReadingModeChange={reader.handleReadingModeChange}
            onDoublePageSettingChange={reader.handleDoublePageSettingChange}
            perMangaOverrides={reader.perMangaOverrides}
            onResetMangaOverride={reader.handleResetMangaOverride}
            onClearAllOverrides={reader.handleClearAllOverrides}
          />
        </section>

        {/* Downloads Settings */}
        <section
          id="downloads"
          className={`settings-section ${highlightedSection === 'downloads' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.downloads')}</h2>
          <DownloadsSettings
            downloadsPath={downloads.downloadsPath}
            isLoadingPath={downloads.isLoadingPath}
            isChangingPath={downloads.isChangingPath}
            downloadConfirmation={downloads.downloadConfirmation}
            defaultQuality={downloads.defaultQuality}
            maxConcurrentDownloads={downloads.maxConcurrentDownloads}
            onSelectDownloadsFolder={downloads.handleSelectDownloadsFolder}
            onDownloadConfirmationChange={downloads.handleDownloadConfirmationChange}
            onDefaultQualityChange={downloads.handleDefaultQualityChange}
            onMaxConcurrentDownloadsChange={downloads.handleMaxConcurrentDownloadsChange}
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
            cacheTier={reader.chapterCacheTier}
            customCacheSize={reader.customCacheSize}
            onCacheTierChange={reader.handleCacheTierChange}
            onCustomCacheSizeChange={reader.handleCustomCacheSizeChange}
          />
          <div className="settings-view__section-divider">
            <h3 className="settings-view__section-heading">
              {t('settings:cacheManagement.sectionTitle')}
            </h3>
            <p className="settings-view__section-description">
              {t('settings:cacheManagement.sectionDescription')}
            </p>

            <CacheManagementSettings
              coverCacheLimit={
                downloads.maxDiskCacheSize === 0 ? 0 : downloads.maxDiskCacheSize / (1024 * 1024)
              }
              onCoverCacheLimitChange={downloads.handleCoverCacheLimitChange}
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
            autoCheckForUpdates={advanced.autoCheckForUpdates}
            autoDownloadUpdates={advanced.autoDownloadUpdates}
            useHardwareAcceleration={advanced.useHardwareAcceleration}
            onAutoCheckChange={advanced.handleAutoCheckChange}
            onAutoDownloadChange={advanced.handleAutoDownloadChange}
            onHardwareAccelerationChange={advanced.handleHardwareAccelerationChange}
          />
          <LoggingSettings
            retentionDays={advanced.logRetentionDays}
            onRetentionDaysChange={advanced.handleLogRetentionDaysChange}
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
