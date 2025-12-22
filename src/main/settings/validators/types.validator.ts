import { ImageQuality } from '../../api/enums'
import { DownloadSettings } from '../entity/downloads-settings.entity'
import { ReaderSettings } from '../entity/reader-settings.entity'
import { MangaReadingSettings } from '../entity/reading-settings.entity'
import { ReadingMode } from '../enum/reading-mode.enum'
import { AppTheme } from '../enum/theme-mode.enum'
import { AppearanceSettings } from './../entity/appearance-settings.entity'

interface FieldValidationResult {
  isFieldUpdate: boolean
  isValid: boolean
  error?: string
}

/**
 * Validate individual field updates
 * Returns whether this is a field-level update and if it's valid
 */
export function validateSettingsField(field: string, value: unknown): FieldValidationResult {
  switch (field) {
    case 'accentColor':
      // Validate accent color format (hex color or undefined)
      if (value === undefined || value === null) {
        return { isFieldUpdate: true, isValid: true }
      }
      if (typeof value !== 'string') {
        return {
          isFieldUpdate: true,
          isValid: false,
          error: 'Accent color must be a string or undefined'
        }
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return {
          isFieldUpdate: true,
          isValid: false,
          error: 'Accent color must be in hex format (#RRGGBB)'
        }
      }
      return { isFieldUpdate: true, isValid: true }

    case 'theme':
      // Validate theme is a valid enum value
      if (!Object.values(AppTheme).includes(value as AppTheme)) {
        return {
          isFieldUpdate: true,
          isValid: false,
          error: `Theme must be one of: ${Object.values(AppTheme).join(', ')}`
        }
      }
      return { isFieldUpdate: true, isValid: true }

    default:
      // Not a recognized field-level update
      return { isFieldUpdate: false, isValid: false }
  }
}

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

  // Validate downloadPath type
  if (
    downloadsSettings.downloadPath !== null &&
    typeof downloadsSettings.downloadPath !== 'string'
  ) {
    console.error('Refused to save download settings: downloadPath must be string or null')
    return false
  }

  // Validate downloadPath doesn't contain null bytes (security)
  if (downloadsSettings.downloadPath?.includes('\0')) {
    console.error('Refused to save download settings: downloadPath contains null bytes')
    return false
  }

  // Validate downloadQuality is valid enum
  if (!Object.values(ImageQuality).includes(downloadsSettings.downloadQuality)) {
    console.error('Refused to save download settings: invalid downloadQuality')
    return false
  }

  // Validate concurrentChapterDownloads is integer within reasonable range (1-10)
  if (
    !Number.isInteger(downloadsSettings.concurrentChapterDownloads) ||
    downloadsSettings.concurrentChapterDownloads < 1 ||
    downloadsSettings.concurrentChapterDownloads > 10
  ) {
    console.error('Refused to save download settings: concurrentChapterDownloads must be 1-10')
    return false
  }

  return true
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
    Object.values(ReadingMode).includes(mangaReadingSettings.readingMode) && isDoublePageModeValid
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

  // Validate manga overrides don't exceed reasonable limit
  const mangaIds = Object.keys(readerSettings.manga)
  if (mangaIds.length > 1000) {
    console.error('Refused to save reader settings: too many manga overrides (max 1000)')
    return false
  }

  // Validate each manga ID is a valid UUID format and its settings are valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  for (const mangaId of mangaIds) {
    if (!uuidRegex.test(mangaId)) {
      console.error(`Refused to save reader settings: invalid manga ID format: ${mangaId}`)
      return false
    }

    // Validate each manga's settings
    if (!isMangaReadingSettings(readerSettings.manga[mangaId])) {
      console.error(`Refused to save reader settings: invalid settings for manga ${mangaId}`)
      return false
    }
  }

  return true
}
