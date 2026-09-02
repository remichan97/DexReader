// Section IDs for navigation and scroll spy
export const SECTION_IDS = [
  'appearance',
  'language',
  'reader',
  'downloads',
  'performance',
  'storage',
  'security',
  'advanced'
] as const

type TFunction = (key: string, options?: Record<string, unknown>) => string

// Single source of truth for every modified-setting key shown in the UnsavedChangesBanner:
// which section to scroll to, and the human-readable label to display. Previously this was
// two separately hand-maintained maps (one per concern) keyed by the same setting names,
// which could silently drift apart - the settings-domain registry in SettingsView.tsx
// (isDirty/buildPayload/reset per domain) doesn't carry per-key metadata like this, so it
// isn't a fit to derive from directly.
const SETTING_METADATA: Record<string, { section: string; label: (t: TFunction) => string }> = {
  themeMode: {
    section: 'appearance',
    label: (t) => t('settings:appearance.themeLabel', { defaultValue: 'Theme' })
  },
  accentColor: {
    section: 'appearance',
    label: (t) => t('settings:appearance.accentLabel', { defaultValue: 'Accent Colour' })
  },
  startupPage: {
    section: 'appearance',
    label: (t) => t('settings:appearance.startupPageLabel', { defaultValue: 'Startup Page' })
  },
  sidebarSize: {
    section: 'appearance',
    label: (t) => t('settings:appearance.sidebarSizeLabel', { defaultValue: 'Sidebar Display' })
  },
  displayLanguage: {
    section: 'language',
    label: (t) => t('settings:appearance.languageLabel', { defaultValue: 'Display Language' })
  },
  syncContentLanguage: {
    section: 'language',
    label: (t) =>
      t('settings:appearance.syncContentLanguage', {
        defaultValue: 'Sync content language with display language'
      })
  },
  contentLanguages: {
    section: 'language',
    label: (t) => t('settings:language.contentLanguageLabel', { defaultValue: 'Content Languages' })
  },
  globalReaderSettings: {
    section: 'reader',
    label: (t) => t('settings:reader.displaySection', { defaultValue: 'Reader Settings' })
  },
  forceDarkMode: {
    section: 'reader',
    label: (t) =>
      t('settings:reader.forceDarkMode.label', { defaultValue: 'Force Dark Mode on Manga Pages' })
  },
  imageQuality: {
    section: 'reader',
    label: (t) => t('settings:reader.imageQuality.label', { defaultValue: 'Image Quality' })
  },
  downloadConfirmation: {
    section: 'downloads',
    label: (t) =>
      t('settings:downloads.confirmationLabel', { defaultValue: 'Download Confirmation' })
  },
  defaultQuality: {
    section: 'downloads',
    label: (t) => t('settings:downloads.qualityLabel', { defaultValue: 'Default Quality' })
  },
  maxConcurrentDownloads: {
    section: 'downloads',
    label: (t) => t('settings:downloads.concurrentLabel', { defaultValue: 'Concurrent Downloads' })
  },
  downloadsPath: {
    section: 'downloads',
    label: (t) => t('settings:downloads.locationSection', { defaultValue: 'Download Location' })
  },
  chapterCacheTier: {
    section: 'performance',
    label: (t) => t('settings:performance.sectionTitle', { defaultValue: 'Chapter Cache Size' })
  },
  customCacheSize: {
    section: 'performance',
    label: (t) => t('settings:performance.customCacheLabel', { defaultValue: 'Custom Cache Size' })
  },
  maxDiskCacheSize: {
    section: 'performance',
    label: (t) =>
      t('settings:cacheManagement.coverCacheLimitLabel', { defaultValue: 'Cover Cache Limit' })
  },
  autoCheckForUpdates: {
    section: 'advanced',
    label: (t) =>
      t('settings:advanced.autoCheckLabel', { defaultValue: 'Automatically check for updates' })
  },
  autoDownloadUpdates: {
    section: 'advanced',
    label: (t) =>
      t('settings:advanced.autoDownloadLabel', {
        defaultValue: 'Automatically download updates'
      })
  },
  useHardwareAcceleration: {
    section: 'advanced',
    label: (t) =>
      t('settings:advanced.hardwareAcceleration.label', {
        defaultValue: 'Use hardware acceleration'
      })
  },
  logRetentionDays: {
    section: 'advanced',
    label: (t) => t('settings:logging.retentionLabel', { defaultValue: 'Log Retention Period' })
  }
}

export function getSettingSection(key: string): string {
  return SETTING_METADATA[key]?.section ?? 'appearance'
}

/**
 * Human-readable label for a modified-setting key, shown in the UnsavedChangesBanner.
 */
export function getSettingLabel(key: string, t: TFunction): string {
  return SETTING_METADATA[key]?.label(t) ?? key
}
