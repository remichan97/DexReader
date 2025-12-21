import { ImageQuality } from '../../api/enums'
import { DownloadSettings } from '../entity/downloads-settings.entity'
import { ReaderSettings } from '../entity/reader-settings.entity'
import { MangaReadingSettings } from '../entity/reading-settings.entity'
import { ReadingMode } from '../enum/reading-mode.enum'
import { AppTheme } from '../enum/theme-mode.enum'
import { AppearanceSettings } from './../entity/appearance-settings.entity'

// Validate appearance settings
export function isAppearanceSettings(values: unknown): values is AppearanceSettings {
  if (typeof values !== 'object' || values === null) {
    console.error('Refused to save appearance settings: not an object')
    return false
  }

  const appearanceSettings = values as AppearanceSettings

  return (
    Object.values(AppTheme).includes(appearanceSettings.theme) &&
    (appearanceSettings.accentColor === undefined ||
      (typeof appearanceSettings.accentColor === 'string' &&
        /^#[0-9A-Fa-f]{6}$/.test(appearanceSettings.accentColor)))
  )
}

// Validate download settings
export function isDownloadsSettings(values: unknown): values is DownloadSettings {
  if (typeof values !== 'object' || values === null) {
    console.error('Refused to save download settings: not an object')
    return false
  }

  const downloadsSettings = values as DownloadSettings

  return (
    (downloadsSettings.downloadPath === null ||
      typeof downloadsSettings.downloadPath === 'string') &&
    Object.values(ImageQuality).includes(downloadsSettings.downloadQuality) &&
    typeof downloadsSettings.concurrentChapterDownloads === 'number'
  )
}

// Validate manga reading settings
export function isMangaReadingSettings(values: unknown): values is MangaReadingSettings {
  if (typeof values !== 'object' || values === null) {
    console.error('Refused to save manga reading settings: not an object')
    return false
  }

  const mangaReadingSettings = values as MangaReadingSettings

  const isDoublePageModeValid =
    mangaReadingSettings.doublePageMode === undefined ||
    (typeof mangaReadingSettings.doublePageMode === 'object' &&
      mangaReadingSettings.doublePageMode !== null &&
      typeof mangaReadingSettings.doublePageMode.skipCoverPages === 'boolean' &&
      typeof mangaReadingSettings.doublePageMode.readRightToLeft === 'boolean')

  return (
    typeof mangaReadingSettings.readingMode === ReadingMode[mangaReadingSettings.readingMode] &&
    isDoublePageModeValid
  )
}

// Validate reader settings
export function isReaderSettings(values: unknown): values is ReaderSettings {
  if (typeof values !== 'object' || values === null) {
    console.error('Refused to save reader settings: not an object')
    return false
  }

  const readerSettings = values as ReaderSettings

  // Validate forceDarkMode
  if (typeof readerSettings.forceDarkMode !== 'boolean') {
    console.error('Refused to save reader settings: forceDarkMode is not a boolean')
    return false
  }

  // Validate quality is a valid ImageQuality enum value
  if (!Object.values(ImageQuality).includes(readerSettings.quality)) {
    console.error('Refused to save reader settings: quality is not a valid ImageQuality value')
    return false
  }

  // Validate global reading settings
  if (
    typeof readerSettings.global !== 'object' ||
    readerSettings.global === null ||
    !isMangaReadingSettings(readerSettings.global)
  ) {
    console.error('Refused to save reader settings: global settings are invalid')
    return false
  }

  // Validate manga-specific overrides
  if (typeof readerSettings.manga !== 'object' || readerSettings.manga === null) {
    console.error('Refused to save reader settings: manga overrides is not an object')
    return false
  }

  // Check each manga override is valid
  return Object.values(readerSettings.manga).every(isMangaReadingSettings)
}
