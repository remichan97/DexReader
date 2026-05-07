import os from 'node:os'
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
import { ValidationError } from '../../ipc/error/validation.error'
import { UpdateSettings } from '../entities/update-settings.entity'
import { LogsSettings } from '../entities/logs-settings.entity'
import { StartupPage } from '../enums/startup-page.enum'
import { AppSettings } from '../entities/app-settings.entity'
import { SearchSettings } from '../entities/search-settings.entity'

export function validateSettings(newSettings: unknown): newSettings is AppSettings {
  if (typeof newSettings !== 'object' || newSettings === null) {
    throw new TypeError('Settings must be an object')
  }

  const settings = newSettings as AppSettings

  // Validate each section using the specific validators
  if (!isAppearanceSettings(settings.appearance)) {
    throw new TypeError('Invalid appearance settings')
  }

  if (!isDownloadsSettings(settings.downloads)) {
    throw new TypeError('Invalid download settings')
  }

  if (!isReaderSettings(settings.reader)) {
    throw new TypeError('Invalid reader settings')
  }

  if (!isUpdateSettings(settings.update)) {
    throw new TypeError('Invalid update settings')
  }

  if (!isLogSettings(settings.logs)) {
    throw new TypeError('Invalid log settings')
  }

  return true
}

// Validate appearance settings
export function isAppearanceSettings(values: unknown): values is AppearanceSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save appearance settings: not an object')
  }

  const appearanceSettings = values as AppearanceSettings

  // Validate theme is a valid AppTheme enum value
  if (!Object.values(AppTheme).includes(appearanceSettings.theme)) {
    throw new Error('Refused to save appearance settings: theme is not a valid AppTheme value')
  }

  // Validate accentColor is a valid hex color code if provided
  if (
    appearanceSettings.accentColor &&
    !/^#([0-9A-F]{3}){1,2}$/i.test(appearanceSettings.accentColor)
  ) {
    throw new TypeError(
      'Refused to save appearance settings: accentColor must be a valid hex color code if provided'
    )
  }

  // Validate StartupPage is a valid StartupPage enum value
  if (
    appearanceSettings.startupPage &&
    !Object.values(StartupPage).includes(appearanceSettings.startupPage)
  ) {
    throw new TypeError(
      'Refused to save appearance settings: startupPage is not a valid StartupPage value if provided'
    )
  }

  return true
}

// Validate download settings
export function isDownloadsSettings(values: unknown): values is DownloadSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save download settings: not an object')
  }

  const downloadsSettings = values as DownloadSettings

  // Validate downloadPath type
  if (downloadsSettings.downloadPath && typeof downloadsSettings.downloadPath !== 'string') {
    throw new TypeError(
      'Refused to save download settings: downloadPath must be string if provided'
    )
  }

  // Validate downloadPath doesn't contain null bytes (security)
  if (downloadsSettings.downloadPath?.includes('\0')) {
    throw new Error('Refused to save download settings: downloadPath contains null bytes')
  }

  // Validate downloadConfirmation is a valid DownloadConfirmation enum value
  if (!Object.values(DownloadConfirmation).includes(downloadsSettings.shouldConfirmDownload)) {
    throw new Error(
      'Refused to save download settings: shouldConfirmDownload is not a valid DownloadConfirmation value'
    )
  }

  // Validate defaultQuality is a valid ImageQuality enum value
  if (!Object.values(ImageQuality).includes(downloadsSettings.defaultQuality)) {
    throw new Error(
      'Refused to save download settings: defaultQuality is not a valid ImageQuality value'
    )
  }

  // Validate the maxDiskCacheSize is a non-negative integer, allowing 0 for unlimited, if larger than 0, it should be around 10MB to 500MB
  if (
    !Number.isInteger(downloadsSettings.maxDiskCacheSize) ||
    downloadsSettings.maxDiskCacheSize < 0 ||
    (downloadsSettings.maxDiskCacheSize > 0 &&
      (downloadsSettings.maxDiskCacheSize < 10 * 1024 * 1024 ||
        downloadsSettings.maxDiskCacheSize > 500 * 1024 * 1024))
  ) {
    throw new Error(
      'Refused to save download settings: maxDiskCacheSize must be a non-negative integer, or between 10MB and 500MB. If you mean to set it to unlimited, please set it to 0.'
    )
  }

  // Validate maxConcurrentDownloads is integer within reasonable range (1-10)
  if (
    !Number.isInteger(downloadsSettings.maxConcurrentDownloads) ||
    downloadsSettings.maxConcurrentDownloads < 1 ||
    downloadsSettings.maxConcurrentDownloads > 10
  ) {
    throw new Error('Refused to save download settings: maxConcurrentDownloads must be 1-10')
  }

  return true
}

// Validate manga reader override settings

export function isMangaOverrideSettings(values: unknown): values is MangaOverrideSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save manga override settings: not an object')
  }

  const mangaOverrideSettings = values as MangaOverrideSettings

  // Validate settings
  if (
    typeof mangaOverrideSettings.settings !== 'object' ||
    mangaOverrideSettings.settings === null ||
    !isMangaReadingSettings(mangaOverrideSettings.settings)
  ) {
    throw new TypeError('Refused to save manga override settings: settings are invalid')
  }

  return isMangaReadingSettings(mangaOverrideSettings.settings)
}

// Validate manga reading settings
export function isMangaReadingSettings(values: unknown): values is MangaReadingSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save manga reading settings: not an object')
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
    throw new Error('Refused to save reader settings: not an object')
  }

  const readerSettings = values as ReaderSettings

  // Validate forceDarkMode
  if (typeof readerSettings.forceDarkMode !== 'boolean') {
    throw new TypeError('Refused to save reader settings: forceDarkMode is not a boolean')
  }

  // Validate quality is a valid ImageQuality enum value
  if (!Object.values(ImageQuality).includes(readerSettings.quality)) {
    throw new Error('Refused to save reader settings: quality is not a valid ImageQuality value')
  }

  // Validate global reading settings
  if (
    typeof readerSettings.global !== 'object' ||
    readerSettings.global === null ||
    !isMangaReadingSettings(readerSettings.global)
  ) {
    throw new Error('Refused to save reader settings: global settings are invalid')
  }

  // Validate performance settings
  if (
    typeof readerSettings.performance !== 'object' ||
    readerSettings.performance === null ||
    !Object.values(ChapterCacheTier).includes(readerSettings.performance.cacheTier)
  ) {
    throw new Error('Refused to save reader settings: performance settings are invalid')
  }

  // If cache tier is custom, validate the number with min and sanity max limits
  if (readerSettings.performance.cacheTier === ChapterCacheTier.Custom) {
    if (typeof readerSettings.performance.customCacheSize !== 'number') {
      throw new ValidationError('performance.customCacheSize', 'Must be a number')
    }

    const cacheSizeMB = Math.round(readerSettings.performance.customCacheSize / (1024 * 1024))
    const totalRAM_MB = Math.round(os.totalmem() / (1024 * 1024))
    const sanityMaxMB = Math.round(totalRAM_MB * 0.3) // 30% of system RAM

    // Enforce minimum 10 MB
    if (readerSettings.performance.customCacheSize < 10 * 1024 * 1024) {
      throw new ValidationError(
        'performance.customCacheSize',
        `Minimum 10 MB required (got ${cacheSizeMB} MB)`
      )
    }

    // Enforce sanity maximum 30% of RAM
    if (readerSettings.performance.customCacheSize > sanityMaxMB * 1024 * 1024) {
      throw new ValidationError(
        'performance.customCacheSize',
        `Maximum ${sanityMaxMB} MB allowed (30% of ${Math.round(totalRAM_MB / 1024)} GB RAM). Got ${cacheSizeMB} MB.`
      )
    }
  }

  return true
}

export function isDownloadChapterOptions(values: unknown): values is DownloadChapterOptions {
  if (values === null || typeof values !== 'object') {
    throw new TypeError('Invalid parameters for downloading chapter')
  }

  if (!('chapterId' in values) || typeof values.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId')
  }

  if (!('mangaId' in values) || typeof values.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId')
  }

  if (!('language' in values) || typeof values.language !== 'string') {
    throw new TypeError('Missing or invalid language')
  }

  if (!('quality' in values) || typeof values.quality !== 'string') {
    throw new TypeError('Missing or invalid quality')
  }

  return true
}

export function isQueuedDownloads(values: unknown): values is QueuedDownloads {
  if (values === null || typeof values !== 'object') {
    throw new TypeError('Invalid parameters for queued downloads')
  }

  if (!('chapterId' in values) || typeof values.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId')
  }

  if (!('mangaId' in values) || typeof values.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId')
  }

  if (!('language' in values) || typeof values.language !== 'string') {
    throw new TypeError('Missing or invalid language')
  }

  if (!('quality' in values) || typeof values.quality !== 'string') {
    throw new TypeError('Missing or invalid quality')
  }

  if (!('addedAt' in values) || !(values.addedAt instanceof Date)) {
    throw new TypeError('Missing or invalid addedAt')
  }

  return true
}

export function isUpdateSettings(values: unknown): values is UpdateSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save update settings: not an object')
  }

  const updateSettings = values as UpdateSettings

  if (typeof updateSettings.autoCheck !== 'boolean') {
    throw new TypeError('Refused to save update settings: autoCheck is not a boolean')
  }

  if (updateSettings.autoDownload && typeof updateSettings.autoDownload !== 'boolean') {
    throw new TypeError('Refused to save update settings: autoDownload is not a boolean')
  }

  return true
}

export function isLogSettings(values: unknown): values is LogsSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save log settings: not an object')
  }

  const logSettings = values as LogsSettings

  // At most 30 days of retention
  if (
    typeof logSettings.retentionInDays !== 'number' ||
    !Number.isInteger(logSettings.retentionInDays) ||
    logSettings.retentionInDays < 0 ||
    logSettings.retentionInDays > 30
  ) {
    throw new TypeError(
      'Refused to save log settings: retentionInDays is not a valid number, must be an integer between 0 and 30'
    )
  }

  return true
}

export function isSearchSettings(values: unknown): values is SearchSettings {
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Refused to save search settings: not an object')
  }

  const searchSettings = values as SearchSettings

  if (
    searchSettings.defaultPresetId !== undefined &&
    typeof searchSettings.defaultPresetId !== 'number'
  ) {
    throw new TypeError('Refused to save search settings: defaultPresetId is not a number')
  }

  return true
}
