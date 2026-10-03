import { AppSettings } from '@shared/types/settings/app-settings.type'
import { AppearanceSettings } from '@shared/types/settings/appearance-settings.type'
import { DownloadSettings } from '@shared/types/settings/downloads-settings.type'
import { ReaderSettings } from '@shared/types/settings/reader-settings.type'
import { UpdateSettings } from '@shared/types/settings/update-settings.type'
import { LogsSettings } from '@shared/types/settings/logs-settings.type'
import { SearchSettings } from '@shared/types/settings/search-settings.type'
import { SystemSettings } from '@shared/types/settings/system-settings.type'
import { LanguageSettings } from '@shared/types/settings/language-settings.type'
import { SnapshotSettings } from '@shared/types/settings/snapshot-settings.type'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
import { AppTheme } from '@shared/enums/settings/theme-mode.enum'
import { StartupPage } from '@shared/enums/settings/startup-page.enum'
import { SidebarSize } from '@shared/enums/settings/sidebar-size.enum'
import { DownloadConfirmation } from '@shared/enums/settings/download-confirmation.enum'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'
import { ChapterCacheTier } from '@shared/enums/settings/chapter-cache-tier.enum'
import { DisplayLanguage } from '@shared/enums/settings/display-languages.enum'
import { ContentLanguage } from '@shared/enums/settings/content-language.enum'
import { ValidationError } from '../../ipc/error/validation.error'

const TOTAL_RAM_BYTES = 16 * 1024 * 1024 * 1024 // 16 GB - fixed so the 30%-of-RAM sanity cap is deterministic

vi.mock('node:os', () => ({
  default: { totalmem: () => TOTAL_RAM_BYTES }
}))

import {
  validateSettings,
  isAppearanceSettings,
  isDownloadsSettings,
  isMangaOverrideSettings,
  isMangaReadingSettings,
  isReaderSettings,
  isUpdateSettings,
  isLogSettings,
  isSearchSettings,
  isSystemSettings,
  isLanguageSettings,
  isSnapshotSettings
} from './settings.validator'

const validMangaReading: MangaReadingSettings = {
  readingMode: ReadingMode.SinglePage
}

const validAppearance: AppearanceSettings = {
  theme: AppTheme.Dark,
  startupPage: StartupPage.Library,
  sidebarSize: SidebarSize.Full
}

const validDownloads: DownloadSettings = {
  maxConcurrentDownloads: 3,
  shouldConfirmDownload: DownloadConfirmation.Always,
  defaultQuality: ImageQuality.High,
  maxDiskCacheSize: 0
}

const validReader: ReaderSettings = {
  forceDarkMode: false,
  quality: ImageQuality.High,
  global: validMangaReading,
  performance: { cacheTier: ChapterCacheTier.Normal }
}

const validUpdate: UpdateSettings = {
  autoCheck: true,
  autoDownload: false
}

const validLogs: LogsSettings = {
  retentionInDays: 7
}

const validSearch: SearchSettings = {}

const validSystem: SystemSettings = {
  useHardwareAcceleration: true
}

const validLanguage: LanguageSettings = {
  displayLanguage: DisplayLanguage.EnglishUK,
  syncContentLanguage: true
}

const validSnapshot: SnapshotSettings = {
  isEnabled: false
}

const validSettings: AppSettings = {
  version: 1,
  downloads: validDownloads,
  appearance: validAppearance,
  reader: validReader,
  update: validUpdate,
  logs: validLogs,
  search: validSearch,
  language: validLanguage,
  snapshot: validSnapshot,
  system: validSystem
}

describe('validateSettings', () => {
  it('accepts a fully valid settings object', () => {
    expect(validateSettings(validSettings)).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => validateSettings(null)).toThrow(TypeError)
    expect(() => validateSettings('settings')).toThrow(TypeError)
  })

  it('rejects when any section is invalid', () => {
    expect(() =>
      validateSettings({ ...validSettings, appearance: { ...validAppearance, theme: 'invalid' } })
    ).toThrow(/appearance/i)
  })
})

describe('isAppearanceSettings', () => {
  it('accepts a valid theme, optional hex accent colour, and startup page', () => {
    expect(isAppearanceSettings({ ...validAppearance, accentColor: '#FF5733' })).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isAppearanceSettings(null)).toThrow(TypeError)
  })

  it('rejects an invalid theme', () => {
    expect(() => isAppearanceSettings({ ...validAppearance, theme: 'not-a-theme' })).toThrow()
  })

  it('rejects a non-hex accent colour', () => {
    expect(() => isAppearanceSettings({ ...validAppearance, accentColor: 'red' })).toThrow()
  })

  it('rejects an invalid startup page', () => {
    expect(() => isAppearanceSettings({ ...validAppearance, startupPage: 'homepage' })).toThrow()
  })
})

describe('isDownloadsSettings', () => {
  it('accepts a valid configuration, including maxDiskCacheSize 0 for unlimited', () => {
    expect(isDownloadsSettings(validDownloads)).toBe(true)
  })

  it('rejects a non-string downloadPath', () => {
    expect(() => isDownloadsSettings({ ...validDownloads, downloadPath: 123 })).toThrow(TypeError)
  })

  it('rejects a downloadPath containing null bytes', () => {
    expect(() =>
      isDownloadsSettings({ ...validDownloads, downloadPath: 'D:\\Downloads\0evil' })
    ).toThrow(/null bytes/i)
  })

  it('rejects an invalid shouldConfirmDownload value', () => {
    expect(() =>
      isDownloadsSettings({ ...validDownloads, shouldConfirmDownload: 'sometimes' })
    ).toThrow()
  })

  it('rejects an invalid defaultQuality value', () => {
    expect(() => isDownloadsSettings({ ...validDownloads, defaultQuality: 'ultra' })).toThrow()
  })

  it.each([
    ['a non-integer', 1.5],
    ['a negative number', -1],
    ['below the 10MB floor', 5 * 1024 * 1024],
    ['above the 500MB ceiling', 501 * 1024 * 1024]
  ])('rejects maxDiskCacheSize that is %s', (_label, maxDiskCacheSize) => {
    expect(() => isDownloadsSettings({ ...validDownloads, maxDiskCacheSize })).toThrow()
  })

  it.each([10 * 1024 * 1024, 500 * 1024 * 1024])(
    'accepts maxDiskCacheSize at the %d boundary',
    (maxDiskCacheSize) => {
      expect(isDownloadsSettings({ ...validDownloads, maxDiskCacheSize })).toBe(true)
    }
  )

  it.each([0, 11])('rejects maxConcurrentDownloads outside 1-10 (%d)', (maxConcurrentDownloads) => {
    expect(() => isDownloadsSettings({ ...validDownloads, maxConcurrentDownloads })).toThrow()
  })

  it.each([1, 10])(
    'accepts maxConcurrentDownloads at the %d boundary',
    (maxConcurrentDownloads) => {
      expect(isDownloadsSettings({ ...validDownloads, maxConcurrentDownloads })).toBe(true)
    }
  )
})

describe('isMangaReadingSettings', () => {
  it('accepts a valid reading mode with no double-page mode', () => {
    expect(isMangaReadingSettings(validMangaReading)).toBe(true)
  })

  it('accepts a valid double-page mode', () => {
    expect(
      isMangaReadingSettings({
        readingMode: ReadingMode.DoublePage,
        doublePageMode: { skipCoverPages: true, readRightToLeft: false }
      })
    ).toBe(true)
  })

  it('rejects an invalid reading mode', () => {
    expect(isMangaReadingSettings({ readingMode: 'sideways' })).toBe(false)
  })

  it('rejects a malformed double-page mode', () => {
    expect(
      isMangaReadingSettings({
        readingMode: ReadingMode.DoublePage,
        doublePageMode: { skipCoverPages: 'yes' }
      })
    ).toBe(false)
  })
})

describe('isMangaOverrideSettings', () => {
  it('accepts a valid override', () => {
    expect(isMangaOverrideSettings({ settings: validMangaReading })).toBe(true)
  })

  it('rejects missing/invalid nested settings', () => {
    expect(() => isMangaOverrideSettings({ settings: { readingMode: 'sideways' } })).toThrow()
  })
})

describe('isReaderSettings', () => {
  it('accepts a valid configuration', () => {
    expect(isReaderSettings(validReader)).toBe(true)
  })

  it('rejects a non-boolean forceDarkMode', () => {
    expect(() => isReaderSettings({ ...validReader, forceDarkMode: 'no' })).toThrow(TypeError)
  })

  it('rejects an invalid quality value', () => {
    expect(() => isReaderSettings({ ...validReader, quality: 'ultra' })).toThrow()
  })

  it('rejects invalid global reading settings', () => {
    expect(() =>
      isReaderSettings({ ...validReader, global: { readingMode: 'sideways' } })
    ).toThrow()
  })

  it('rejects an invalid cache tier', () => {
    expect(() =>
      isReaderSettings({ ...validReader, performance: { cacheTier: 'ultra' } })
    ).toThrow()
  })

  describe('custom cache tier sizing', () => {
    const customReader = (customCacheSize: unknown): unknown => ({
      ...validReader,
      performance: { cacheTier: ChapterCacheTier.Custom, customCacheSize }
    })

    it('accepts a value within the 10MB floor and 30%-of-RAM ceiling', () => {
      expect(isReaderSettings(customReader(200 * 1024 * 1024))).toBe(true)
    })

    it('rejects a non-number customCacheSize', () => {
      expect(() => isReaderSettings(customReader('lots'))).toThrow(ValidationError)
    })

    it('rejects below the 10MB minimum', () => {
      expect(() => isReaderSettings(customReader(5 * 1024 * 1024))).toThrow(/Minimum 10 MB/)
    })

    it('rejects above 30% of total system RAM', () => {
      // 30% of the mocked 16GB is ~4915MB - comfortably exceeded by 8GB.
      expect(() => isReaderSettings(customReader(8 * 1024 * 1024 * 1024))).toThrow(/Maximum/)
    })
  })
})

describe('isUpdateSettings', () => {
  it('accepts a valid configuration', () => {
    expect(isUpdateSettings(validUpdate)).toBe(true)
  })

  it('rejects a non-boolean autoCheck', () => {
    expect(() => isUpdateSettings({ ...validUpdate, autoCheck: 'yes' })).toThrow(TypeError)
  })

  it('rejects a non-boolean autoDownload when provided', () => {
    expect(() => isUpdateSettings({ ...validUpdate, autoDownload: 'yes' })).toThrow(TypeError)
  })
})

describe('isLogSettings', () => {
  it.each([0, 30])('accepts retentionInDays at the %d boundary', (retentionInDays) => {
    expect(isLogSettings({ retentionInDays })).toBe(true)
  })

  it.each([-1, 31, 1.5])(
    'rejects retentionInDays out of range or non-integer (%d)',
    (retentionInDays) => {
      expect(() => isLogSettings({ retentionInDays })).toThrow(TypeError)
    }
  )
})

describe('isSearchSettings', () => {
  it('accepts an empty object (defaultPresetId is optional)', () => {
    expect(isSearchSettings({})).toBe(true)
  })

  it('accepts a numeric defaultPresetId', () => {
    expect(isSearchSettings({ defaultPresetId: 5 })).toBe(true)
  })

  it('rejects a non-numeric defaultPresetId', () => {
    expect(() => isSearchSettings({ defaultPresetId: '5' })).toThrow(TypeError)
  })
})

describe('isSystemSettings', () => {
  it('accepts a valid configuration', () => {
    expect(isSystemSettings(validSystem)).toBe(true)
  })

  it('rejects a non-boolean useHardwareAcceleration', () => {
    expect(() => isSystemSettings({ useHardwareAcceleration: 'yes' })).toThrow(TypeError)
  })
})

describe('isLanguageSettings', () => {
  it('accepts a valid configuration without contentLanguage', () => {
    expect(isLanguageSettings(validLanguage)).toBe(true)
  })

  it('accepts up to 5 valid content languages', () => {
    expect(
      isLanguageSettings({
        ...validLanguage,
        contentLanguage: [
          ContentLanguage.English,
          ContentLanguage.Japanese,
          ContentLanguage.Korean,
          ContentLanguage.French,
          ContentLanguage.German
        ]
      })
    ).toBe(true)
  })

  it('rejects an invalid displayLanguage', () => {
    expect(() => isLanguageSettings({ ...validLanguage, displayLanguage: 'klingon' })).toThrow(
      TypeError
    )
  })

  it('rejects a non-boolean syncContentLanguage', () => {
    expect(() => isLanguageSettings({ ...validLanguage, syncContentLanguage: 'yes' })).toThrow(
      TypeError
    )
  })

  it('rejects more than 5 content languages', () => {
    expect(() =>
      isLanguageSettings({
        ...validLanguage,
        contentLanguage: [
          ContentLanguage.English,
          ContentLanguage.Japanese,
          ContentLanguage.Korean,
          ContentLanguage.French,
          ContentLanguage.German,
          ContentLanguage.Italian
        ]
      })
    ).toThrow(TypeError)
  })

  it('rejects an invalid entry in contentLanguage', () => {
    expect(() => isLanguageSettings({ ...validLanguage, contentLanguage: ['klingon'] })).toThrow(
      TypeError
    )
  })
})

describe('isSnapshotSettings', () => {
  it('accepts disabled snapshots without interval/count', () => {
    expect(isSnapshotSettings({ isEnabled: false })).toBe(true)
  })

  it('accepts enabled snapshots with a valid interval and count', () => {
    expect(isSnapshotSettings({ isEnabled: true, intervalInHours: 6, maxSnapshotsCount: 5 })).toBe(
      true
    )
  })

  it('rejects a non-boolean isEnabled', () => {
    expect(() => isSnapshotSettings({ isEnabled: 'yes' })).toThrow(TypeError)
  })

  it.each([0, 7])(
    'rejects intervalInHours out of the 1-6 range (%d) when enabled',
    (intervalInHours) => {
      expect(() =>
        isSnapshotSettings({ isEnabled: true, intervalInHours, maxSnapshotsCount: 1 })
      ).toThrow(TypeError)
    }
  )

  it.each([0, 6])(
    'rejects maxSnapshotsCount out of the 1-5 range (%d) when enabled',
    (maxSnapshotsCount) => {
      expect(() =>
        isSnapshotSettings({ isEnabled: true, intervalInHours: 1, maxSnapshotsCount })
      ).toThrow(TypeError)
    }
  )
})
