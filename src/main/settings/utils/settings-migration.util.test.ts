import type { AppSettings } from '../../../shared/types/settings/app-settings.type'
import { ContentLanguage } from '../../../shared/enums/settings/content-language.enum'
import { DisplayLanguage } from '../../../shared/enums/settings/display-languages.enum'

vi.mock('../../filesystem/path-validator', () => ({
  getDownloadsPath: vi.fn(() => '/mock/default/downloads'),
  updateDownloadsPath: vi.fn(),
  validateDirectoryPath: vi.fn()
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/reader-settings.repo', () => ({
  readerSettingsRepo: { getMangaOverride: vi.fn() }
}))

vi.mock('../../api/utils/memory-cache.util', () => ({
  memoryCacheUtil: { getDynamicTiers: vi.fn(), getMemoryLimit: vi.fn() }
}))

class MockElectronStore<T extends object> {
  public store: T

  public constructor(options: { defaults: T }) {
    this.store = options.defaults
  }
}

vi.mock('electron-store', () => ({
  default: MockElectronStore
}))

describe('migrateSettings', () => {
  let migrateSettings: typeof import('./settings-migration.util').migrateSettings
  let currentVersion: number
  let defaults: AppSettings

  beforeEach(async () => {
    // settingsManager is a singleton built on import, so each test needs a fresh module graph
    vi.resetModules()
    ;({ migrateSettings, CURRENT_SETTINGS_VERSION: currentVersion } =
      await import('./settings-migration.util'))
    const { settingsManager } = await import('../settings-manager')
    defaults = settingsManager.load()
  })

  // Settings as an older release would have persisted them, with only the language section varied
  function storedAt(version: number, language: Record<string, unknown>): AppSettings {
    return { ...structuredClone(defaults), version, language } as unknown as AppSettings
  }

  describe('content language repair (version 8)', () => {
    const previousVersion = 7

    it('only runs for settings older than the version that introduced it', () => {
      expect(currentVersion).toBeGreaterThan(previousVersion)
    })

    it('fills in English when syncing is off and the content languages are missing', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toEqual([ContentLanguage.English])
      expect(migrated.language.syncContentLanguage).toBe(false)
    })

    it('fills in English when syncing is off and the content languages are empty', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false,
        contentLanguage: []
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toEqual([ContentLanguage.English])
    })

    it('removes duplicate content languages, keeping the first occurrence of each', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false,
        contentLanguage: [
          ContentLanguage.Japanese,
          ContentLanguage.Japanese,
          ContentLanguage.Korean
        ]
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toEqual([
        ContentLanguage.Japanese,
        ContentLanguage.Korean
      ])
    })

    it('trims content languages to the 5 allowed, keeping the highest priorities', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false,
        contentLanguage: [
          ContentLanguage.English,
          ContentLanguage.Japanese,
          ContentLanguage.Korean,
          ContentLanguage.Vietnamese,
          ContentLanguage.French,
          ContentLanguage.German,
          ContentLanguage.Italian
        ]
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toEqual([
        ContentLanguage.English,
        ContentLanguage.Japanese,
        ContentLanguage.Korean,
        ContentLanguage.Vietnamese,
        ContentLanguage.French
      ])
    })

    it('leaves a valid priority list untouched, order included', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false,
        contentLanguage: [ContentLanguage.Vietnamese, ContentLanguage.English]
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toEqual([
        ContentLanguage.Vietnamese,
        ContentLanguage.English
      ])
    })

    it('does not invent a content language list while syncing is on', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: true
      })

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.language.contentLanguage).toBeUndefined()
    })

    it('keeps the rest of the user settings instead of resetting everything to defaults', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.Vietnamese,
        syncContentLanguage: false
      })
      stored.appearance = { ...stored.appearance, accentColor: '#112233' }

      const migrated = migrateSettings(stored, structuredClone(defaults))

      expect(migrated.appearance.accentColor).toBe('#112233')
      expect(migrated.language.displayLanguage).toBe(DisplayLanguage.Vietnamese)
    })

    it('stamps the migrated settings with the current version', () => {
      const stored = storedAt(previousVersion, {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: false
      })

      expect(migrateSettings(stored, structuredClone(defaults)).version).toBe(currentVersion)
    })
  })

  it('resets to defaults when the settings come from a newer app version', () => {
    const stored = storedAt(currentVersion + 1, {
      displayLanguage: DisplayLanguage.Vietnamese,
      syncContentLanguage: true
    })

    expect(migrateSettings(stored, structuredClone(defaults))).toEqual(defaults)
  })
})
