import { ChapterCacheTier } from './../enums/chapter-cache-tier.enum'
import { ImageQuality } from '../../api/enums'
import { DownloadChapterOptions } from '../../services/options/download-chapter.option'
import { QueuedDownloads } from '../../services/types/downloads/queued-downloads.type'
import { DownloadSettings } from '../entities/downloads-settings.entity'
import { MangaOverrideSettings } from '../entities/manga-override-settings.entity'
import { ReaderSettings } from '../entities/reader-settings.entity'
import { MangaReadingSettings } from '../entities/reading-settings.entity'
import { DownloadConfirmation } from '../enums/download-confirmation.enum'
import { ReadingMode } from '../enums/reading-mode.enum'
import { AppTheme } from '../enums/theme-mode.enum'
import { AppearanceSettings } from '../entities/appearance-settings.entity'

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

  // Validate downloadConfirmation is a valid DownloadConfirmation enum value
  if (!Object.values(DownloadConfirmation).includes(downloadsSettings.shouldConfirmDownload)) {
    console.error(
      'Refused to save download settings: shouldConfirmDownload is not a valid DownloadConfirmation value'
    )
    return false
  }

  // Validate defaultQuality is a valid ImageQuality enum value
  if (!Object.values(ImageQuality).includes(downloadsSettings.defaultQuality)) {
    console.error(
      'Refused to save download settings: defaultQuality is not a valid ImageQuality value'
    )
    return false
  }

  // Validate the maxDiskCacheSize is a non-negative integer, allowing 0 for unlimited, if larger than 0, it should be around 10MB to 500MB
  if (
    !Number.isInteger(downloadsSettings.maxDiskCacheSize) ||
    downloadsSettings.maxDiskCacheSize < 0 ||
    (downloadsSettings.maxDiskCacheSize > 0 &&
      (downloadsSettings.maxDiskCacheSize < 10 * 1024 * 1024 ||
        downloadsSettings.maxDiskCacheSize > 500 * 1024 * 1024))
  ) {
    console.error(
      'Refused to save download settings: maxDiskCacheSize must be a non-negative integer, or between 10MB and 500MB. If you mean to set it to unlimited, please set it to 0.'
    )
    return false
  }

  // Validate maxConcurrentDownloads is integer within reasonable range (1-10)
  if (
    !Number.isInteger(downloadsSettings.maxConcurrentDownloads) ||
    downloadsSettings.maxConcurrentDownloads < 1 ||
    downloadsSettings.maxConcurrentDownloads > 10
  ) {
    console.error('Refused to save download settings: maxConcurrentDownloads must be 1-10')
    return false
  }

  return true
}

// Validate manga reader override settings

export function isMangaOverrideSettings(values: unknown): values is MangaOverrideSettings {
  if (typeof values !== 'object' || values === null) {
    console.error('Refused to save manga override settings: not an object')
    return false
  }

  const mangaOverrideSettings = values as MangaOverrideSettings

  // Validate settings
  if (
    typeof mangaOverrideSettings.settings !== 'object' ||
    mangaOverrideSettings.settings === null ||
    !isMangaReadingSettings(mangaOverrideSettings.settings)
  ) {
    console.error('Refused to save manga override settings: settings are invalid')
    return false
  }

  return isMangaReadingSettings(mangaOverrideSettings.settings)
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

  // Validate performance settings
  if (
    typeof readerSettings.performance !== 'object' ||
    readerSettings.performance === null ||
    !Object.values(ChapterCacheTier).includes(readerSettings.performance.cacheTier)
  ) {
    console.error('Refused to save reader settings: performance settings are invalid')
    return false
  }

  // If cache tier is custom, validate the number, do not allow lower than 30MB or more than 500MB in bytes
  if (
    readerSettings.performance.cacheTier === ChapterCacheTier.Custom &&
    (typeof readerSettings.performance.customCacheSize !== 'number' ||
      readerSettings.performance.customCacheSize < 30 * 1024 * 1024 ||
      readerSettings.performance.customCacheSize > 500 * 1024 * 1024)
  ) {
    console.error(
      'Refused to save reader settings: custom cache size must be a number between 30 and 500 MB (in bytes)'
    )
    return false
  }

  return true
}

export function isDownloadChapterOptions(values: unknown): values is DownloadChapterOptions {
  if (values === null || typeof values !== 'object') {
    console.error('Invalid parameters for downloading chapter')
    return false
  }

  if (!('chapterId' in values) || typeof values.chapterId !== 'string') {
    console.error('Missing or invalid chapterId')
    return false
  }

  if (!('mangaId' in values) || typeof values.mangaId !== 'string') {
    console.error('Missing or invalid mangaId')
    return false
  }

  if (!('language' in values) || typeof values.language !== 'string') {
    console.error('Missing or invalid language')
    return false
  }

  if (!('quality' in values) || typeof values.quality !== 'string') {
    console.error('Missing or invalid quality')
    return false
  }

  return true
}

export function isQueuedDownloads(values: unknown): values is QueuedDownloads {
  if (values === null || typeof values !== 'object') {
    console.error('Invalid parameters for queued downloads')
    return false
  }

  if (!('chapterId' in values) || typeof values.chapterId !== 'string') {
    console.error('Missing or invalid chapterId')
    return false
  }

  if (!('mangaId' in values) || typeof values.mangaId !== 'string') {
    console.error('Missing or invalid mangaId')
    return false
  }

  if (!('language' in values) || typeof values.language !== 'string') {
    console.error('Missing or invalid language')
    return false
  }

  if (!('quality' in values) || typeof values.quality !== 'string') {
    console.error('Missing or invalid quality')
    return false
  }

  if (!('addedAt' in values) || !(values.addedAt instanceof Date)) {
    console.error('Missing or invalid addedAt')
    return false
  }

  return true
}
