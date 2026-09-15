import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToastStore } from '@renderer/stores'
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
import { RestorePointsSettings } from './components/RestorePointsSettings'
import { DangerZoneSettings } from '../../components/SettingsView/DangerZoneSettings'
import { GatekeeperSetupModal } from '@renderer/components/GatekeeperSetupModal'
import { GatekeeperChangeModal } from '@renderer/components/GatekeeperChangeModal'
import { GatekeeperResetPrompt } from '@renderer/components/GatekeeperResetPrompt'
import { SettingsHeader } from './components/SettingsHeader'
import type { SettingsSection } from './components/SettingsHeader'
import { RestartRequiredBanner } from './components/RestartRequiredBanner'
import { useScrollSpy } from './hooks/useScrollSpy'
import { useAppearanceSettingsDomain } from './hooks/domains/useAppearanceSettingsDomain'
import { useLanguageSettingsDomain } from './hooks/domains/useLanguageSettingsDomain'
import type { DisplayLanguage } from './hooks/domains/useLanguageSettingsDomain'
import { useDownloadsSettingsDomain } from './hooks/domains/useDownloadsSettingsDomain'
import { useReaderSettingsDomain } from './hooks/domains/useReaderSettingsDomain'
import { useAdvancedSettingsDomain } from './hooks/domains/useAdvancedSettingsDomain'
import { useRestorePointsSettingsDomain } from './hooks/domains/useRestorePointsSettingsDomain'
import { SECTION_IDS, getSettingLabel, getSettingSection } from './utils/settingsMeta'
import {
  subscribeToSettingsChange,
  markRestartLeaveNudgeShown,
  hasRestartLeaveNudgeBeenShown
} from '@renderer/utils/settingsPendingWrites'
import './SettingsView.css'

interface RestartRequiredSnapshot {
  displayLanguage: DisplayLanguage
  useHardwareAcceleration: boolean
}

export function SettingsView(): JSX.Element {
  // Translation
  const { t } = useTranslation(['settings', 'common'])

  // Search params for section navigation
  const [searchParams, setSearchParams] = useSearchParams()

  // Zustand stores
  const showToast = useToastStore((state) => state.show)

  // Section navigation state
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [isInitialMount, setIsInitialMount] = useState(true)

  // Gatekeeper modal states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // Restart-required banner state - see the block below the domain hooks for how these
  // are derived/used.
  const [bootSnapshot, setBootSnapshot] = useState<RestartRequiredSnapshot | null>(null)
  const [isRestartBannerDismissed, setIsRestartBannerDismissed] = useState(false)

  // One hook per settings domain - each owns its own state and writes directly to
  // disk via settings:update-section as the user changes it (see settingsPendingWrites.ts).
  const appearance = useAppearanceSettingsDomain()
  const language = useLanguageSettingsDomain()
  const downloads = useDownloadsSettingsDomain({ showToast })
  const reader = useReaderSettingsDomain({ showToast, t })
  const advanced = useAdvancedSettingsDomain()
  const restorePoints = useRestorePointsSettingsDomain()

  // Restart-required fields (displayLanguage, useHardwareAcceleration) autosave
  // immediately (Phase 3), so "needs a restart" can't mean "differs from last save" -
  // it means "differs from the value that was actually running when the app launched".
  // bootSnapshot captures that once on mount (below, alongside loadFromSettings).
  const restartRequiredKeys: string[] = []
  if (bootSnapshot) {
    if (language.displayLanguage !== bootSnapshot.displayLanguage) {
      restartRequiredKeys.push('displayLanguage')
    }
    if (advanced.useHardwareAcceleration !== bootSnapshot.useHardwareAcceleration) {
      restartRequiredKeys.push('useHardwareAcceleration')
    }
  }

  // Dismissing the banner only suppresses it until the user changes any setting on the
  // page again (not just the restart-required ones) - settingsPendingWrites.ts notifies
  // on every write, immediate or queued, so this is the one place that needs to know
  // about "any edit happened" rather than threading a callback through all 6 domains.
  useEffect(() => {
    return subscribeToSettingsChange(() => setIsRestartBannerDismissed(false))
  }, [])

  const handleRestartNow = async (): Promise<void> => {
    await globalThis.settings.restart()
  }

  // One-time native-dialog nudge on leaving the Settings page with a restart-required
  // field still stale - a stronger, but still non-blocking, complement to the banner
  // (never fires on quit; navigation itself is never blocked either way). "Shown" is
  // tracked at module scope, not component state, so it survives this component
  // unmounting when the route changes, and only resets when a setting changes again
  // (same trigger as the banner's dismiss reset) - so it truly only nags once.
  const restartRequiredKeysRef = useRef(restartRequiredKeys)
  restartRequiredKeysRef.current = restartRequiredKeys

  useEffect(() => {
    return () => {
      const keysOnLeave = restartRequiredKeysRef.current
      if (keysOnLeave.length === 0 || hasRestartLeaveNudgeBeenShown()) {
        return
      }
      markRestartLeaveNudgeShown()

      void globalThis.api
        .showConfirmDialog(
          t('dialogs:confirmations.restartRequired.title'),
          t('dialogs:confirmations.restartRequired.message'),
          t('dialogs:confirmations.restartRequired.confirmButton'),
          t('dialogs:confirmations.restartRequired.cancelButton')
        )
        .then((result) => {
          if (result.success && result.data) {
            void globalThis.settings.restart()
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          restorePoints.loadFromSettings(settings)

          setBootSnapshot({
            displayLanguage: settings.language?.displayLanguage ?? 'en-GB',
            useHardwareAcceleration: settings.system?.useHardwareAcceleration ?? true
          })
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

  return (
    <div className="settings-view__container">
      {/* Restart-required banner (fixed bottom) - inline nudge, never blocks navigation
          or quit; see the settings-autosave migration plan, Phase 5. */}
      {restartRequiredKeys.length > 0 && !isRestartBannerDismissed && (
        <RestartRequiredBanner
          settingKeys={restartRequiredKeys}
          getSettingLabel={(key) => getSettingLabel(key, t)}
          getSettingSection={getSettingSection}
          onScrollToSection={handleSectionSelect}
          onRestartNow={handleRestartNow}
          onDismiss={() => setIsRestartBannerDismissed(true)}
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

        {/* Restore Point Settings */}
        <section
          id="restorePoints"
          className={`settings-section ${highlightedSection === 'restorePoints' ? 'settings-section--highlighted' : ''}`}
        >
          <h2 className="settings-section__title">{t('settings:tabs.restorePoints')}</h2>
          <RestorePointsSettings
            isEnabled={restorePoints.isEnabled}
            intervalInHours={restorePoints.intervalInHours}
            maxSnapshotsCount={restorePoints.maxSnapshotsCount}
            onEnabledChange={restorePoints.handleEnabledChange}
            onIntervalChange={restorePoints.handleIntervalChange}
            onMaxCountChange={restorePoints.handleMaxCountChange}
          />
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
