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

// Maps each modified-setting key to its section ID for scroll-to navigation
const SETTING_TO_SECTION: Record<string, string> = {
  themeMode: 'appearance',
  accentColor: 'appearance',
  startupPage: 'appearance',
  sidebarSize: 'appearance',
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
  useHardwareAcceleration: 'advanced',
  logRetentionDays: 'advanced'
}

export function getSettingSection(key: string): string {
  return SETTING_TO_SECTION[key] ?? 'appearance'
}

type TFunction = (key: string, options?: Record<string, unknown>) => string

/**
 * Human-readable label for a modified-setting key, shown in the UnsavedChangesBanner.
 */
export function getSettingLabel(key: string, t: TFunction): string {
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
    downloadsPath: t('settings:downloads.locationSection', { defaultValue: 'Download Location' }),
    globalReaderSettings: t('settings:reader.displaySection', {
      defaultValue: 'Reader Settings'
    }),
    forceDarkMode: t('settings:reader.forceDarkMode.label', {
      defaultValue: 'Force Dark Mode on Manga Pages'
    }),
    imageQuality: t('settings:reader.imageQuality.label', { defaultValue: 'Image Quality' }),
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
