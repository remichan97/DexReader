# IPC API Reference

**DexReader Desktop Manga Reader**
Version: 1.0.0
Last Updated: April 20, 2026

---

## Table of Contents

- [Introduction](#introduction)
- [Usage Pattern](#usage-pattern)
- [API Categories](#api-categories)
  - [Logging](#logging)
  - [Theme Management](#theme-management)
  - [Dialogs](#dialogs)
  - [Reader Settings](#reader-settings)
  - [App Updates](#app-updates)
  - [Filesystem Operations](#filesystem-operations)
  - [Progress Tracking](#progress-tracking)
  - [Backup & Restore](#backup--restore)
  - [App Settings](#app-settings)
  - [Storage Management](#storage-management)
  - [Downloads](#downloads)
  - [Library](#library)
  - [Collections](#collections)
  - [Reading History](#reading-history)
  - [MangaDex API](#mangadex-api)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Conventions](#conventions)

---

## Introduction

This document provides a comprehensive reference for all IPC (Inter-Process Communication) handlers available in DexReader. The application follows Electron's main-renderer architecture where:

- **Main Process** - Node.js environment with filesystem access, native APIs, and MangaDex client
- **Renderer Process** - Chromium browser environment running React UI (security-sandboxed)

IPC handlers bridge these processes, allowing the renderer to safely request operations from the main process.

**Related Documentation:**

- [IPC Messaging Architecture](./architecture/ipc-messaging.md)
- [Error Handling Patterns](./architecture/error-handling.md)
- [State Management](./architecture/state-management.md)

---

## Usage Pattern

### From Renderer Process

All IPC methods are exposed via the `window.api` object (defined in preload script):

```typescript
// Basic pattern
const result = await window.api.methodName(param1, param2)

// Example: Download a chapter
await window.api.downloadChapter({
  chapterId: 'abc123-def456...',
  mangaId: 'xyz789-uvw012...',
  language: 'en',
  quality: 'data'
})

// Example: Get library manga
const manga = await window.api.getLibraryManga({
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  limit: 50,
  offset: 0
})
```

### Error Handling

All IPC handlers throw errors that propagate to the renderer:

```typescript
try {
  await window.api.downloadChapter({
    /* ... */
  })
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Invalid parameters:', error.message)
  } else {
    console.error('Operation failed:', error.message)
  }
}
```

### Event Listeners

Some operations emit progress events:

```typescript
// Listen for download progress
window.api.on('download:progress', (event, { chapterId, progress }) => {
  console.log(`Chapter ${chapterId}: ${progress}%`)
})

// Listen for import progress
window.api.on('dexreader:import-progress', (event, progress) => {
  console.log(`Import: ${progress.current}/${progress.total}`)
})
```

---

## API Categories

### Logging

Write logs from renderer to main process log file.

#### `window.api.logInfo(message: string)`

Logs informational message.

```typescript
await window.api.logInfo('User viewed manga details')
```

#### `window.api.logError(message: string)`

Logs error message.

```typescript
await window.api.logError('Failed to load chapter list')
```

#### `window.api.logDebug(message: string)`

Logs debug message (only appears when log level is DEBUG).

```typescript
await window.api.logDebug('State transition: IDLE -> LOADING')
```

#### `window.api.logWarn(message: string)`

Logs warning message.

```typescript
await window.api.logWarn('API rate limit approaching')
```

#### `window.api.cleanupLogs(retentionDays?: number)`

Deletes old log files.

**Parameters:**

- `retentionDays` - Keep logs newer than this (default: from settings). Pass `0` to force delete all logs.

**Returns:** `{deletedCount: number, freedSpace: number}`

```typescript
// Delete logs older than 30 days
const result = await window.api.cleanupLogs(30)
console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)

// Force delete all logs
await window.api.cleanupLogs(0)
```

#### `window.api.openLogsFolder()`

Opens logs directory in file explorer.

```typescript
await window.api.openLogsFolder()
```

---

### Theme Management

#### `window.api.getSystemAccentColor()`

Gets Windows 11/macOS system accent color.

**Returns:** `string` - Hex color code (e.g., `'#0078D4'`)

```typescript
const accentColor = await window.api.getSystemAccentColor()
// Use for UI theming
```

#### `window.api.getTheme()`

Gets current theme preference.

**Returns:** `'light' | 'dark' | 'system'`

```typescript
const theme = await window.api.getTheme()
```

---

### Dialogs

#### `window.api.setHasUnsavedChanges(hasChanges: boolean)`

Enables/disables quit confirmation dialog.

**Parameters:**

- `hasChanges` - If `true`, shows "Unsaved changes" dialog on quit

```typescript
// Enable quit confirmation
await window.api.setHasUnsavedChanges(true)

// Disable (normal quit)
await window.api.setHasUnsavedChanges(false)
```

#### `window.api.showConfirmDialog(options)`

Shows native confirmation dialog (OK/Cancel).

**Parameters:**

```typescript
{
  title: string
  message: string
  detail?: string
  confirmLabel?: string  // Default: 'OK'
  cancelLabel?: string   // Default: 'Cancel'
}
```

**Returns:** `Promise<boolean>` - `true` if user clicked confirm, `false` if cancelled

```typescript
const confirmed = await window.api.showConfirmDialog({
  title: 'Delete Download',
  message: 'Are you sure you want to delete this chapter?',
  detail: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  cancelLabel: 'Keep'
})

if (confirmed) {
  // Delete chapter
}
```

#### `window.api.showDialog(options)`

Shows custom multi-button dialog.

**Parameters:**

```typescript
{
  title: string
  message: string
  detail?: string
  buttons: Array<{
    label: string
    value: string
  }>
  checkboxLabel?: string  // Optional checkbox
}
```

**Returns:** `Promise<{buttonValue: string, checkboxChecked: boolean}>`

```typescript
const result = await window.api.showDialog({
  title: 'Download Quality',
  message: 'Choose image quality for download',
  buttons: [
    { label: 'Original (3-5 MB/image)', value: 'data' },
    { label: 'Data Saver (500 KB/image)', value: 'data-saver' }
  ],
  checkboxLabel: 'Remember my choice'
})

const quality = result.buttonValue // 'data' or 'data-saver'
if (result.checkboxChecked) {
  // Save preference
}
```

---

### Reader Settings

Per-manga reader settings overrides.

#### `window.api.getMangaReaderSettings(mangaId: string)`

Gets reader settings overrides for a manga.

**Returns:** `MangaReaderSettings | null` - Override settings or `null` if using global defaults

```typescript
const settings = await window.api.getMangaReaderSettings('xyz789...')
if (settings) {
  console.log(`Reading mode: ${settings.readingMode}`)
}
```

#### `window.api.updateMangaReaderSettings(mangaId: string, settings: Partial<MangaReaderSettings>)`

Updates reader settings for a manga.

**Parameters:**

```typescript
{
  readingMode?: 'single-page' | 'double-page' | 'vertical' | 'webtoon'
  fitMode?: 'width' | 'height' | 'original'
  zoom?: number  // 25-300
}
```

**Auto-reset behavior:** If updated settings match global defaults, override is automatically deleted.

```typescript
await window.api.updateMangaReaderSettings('xyz789...', {
  readingMode: 'webtoon',
  fitMode: 'width'
})
```

#### `window.api.resetMangaReaderSettings(mangaId: string)`

Resets manga to global default reader settings.

```typescript
await window.api.resetMangaReaderSettings('xyz789...')
```

#### `window.api.clearAllReaderOverrides()`

Removes all per-manga overrides.

**Returns:** `{deletedCount: number}`

```typescript
const result = await window.api.clearAllReaderOverrides()
console.log(`Cleared ${result.deletedCount} overrides`)
```

#### `window.api.getAllMangaReaderOverrides()`

Gets all manga with reader setting overrides.

**Returns:** `Array<{mangaId: string, settings: MangaReaderSettings}>`

```typescript
const overrides = await window.api.getAllMangaReaderOverrides()
// Show in Settings UI
```

---

### App Updates

Auto-update system using electron-updater + GitHub Releases.

#### `window.api.checkForUpdates(isAutoCheck: boolean)`

Checks for app updates.

**Parameters:**

- `isAutoCheck` - If `true`, silent check (no UI notification). If `false`, user-initiated (shows "no updates" message).

**Returns:** `{updateAvailable: boolean, version?: string}`

```typescript
// Auto-check on app start (silent)
const result = await window.api.checkForUpdates(true)
if (result.updateAvailable) {
  showUpdateNotification(result.version)
}

// Manual check from menu (shows notification)
await window.api.checkForUpdates(false)
```

**Events:**

- `update:available` - Update found
- `update:not-available` - No updates
- `update:error` - Check failed

#### `window.api.downloadUpdate()`

Downloads available update.

**Returns:** `Promise<void>`

**Events:**

- `update:download-progress` - `{percent: number, transferred: number, total: number}`
- `update:downloaded` - Download complete

```typescript
await window.api.downloadUpdate()

window.api.on('update:download-progress', (_, progress) => {
  console.log(`${progress.percent}%`)
})
```

#### `window.api.installUpdate()`

Quits app and installs update.

**Warning:** App exits immediately.

```typescript
await window.api.installUpdate()
// App will quit and installer will run
```

#### `window.api.getAppVersion()`

Gets current app version.

**Returns:** `string` - Version from package.json (e.g., `'1.0.0'`)

```typescript
const version = await window.api.getAppVersion()
```

---

### Filesystem Operations

Security-restricted filesystem access (AppData + downloads directory only).

**Security Note:** All paths are validated against allowed directories. Attempts to access outside these locations throw errors.

#### `window.api.readFile(filePath: string, encoding?: BufferEncoding)`

Reads file contents.

**Parameters:**

- `filePath` - Absolute path (must be within allowed directories)
- `encoding` - `'utf-8'` | `'base64'` | etc. (default: `'utf-8'`)

**Returns:** `Promise<string>`

```typescript
const json = await window.api.readFile('C:\\...\\AppData\\...\\data.json')
const data = JSON.parse(json)
```

#### `window.api.writeFile(filePath: string, data: string, encoding?: BufferEncoding)`

Writes file contents.

```typescript
await window.api.writeFile('C:\\...\\AppData\\...\\backup.json', JSON.stringify(data, null, 2))
```

#### `window.api.appendFile(filePath: string, data: string, encoding?: BufferEncoding)`

Appends to file.

```typescript
await window.api.appendFile('log.txt', 'New entry\n')
```

#### `window.api.copyFile(src: string, dest: string)`

Copies file.

```typescript
await window.api.copyFile('C:\\...\\source.json', 'C:\\...\\backup.json')
```

#### `window.api.renameFile(oldPath: string, newPath: string)`

Renames/moves file.

```typescript
await window.api.renameFile('C:\\...\\old-name.json', 'C:\\...\\new-name.json')
```

#### `window.api.fileExists(filePath: string)`

Checks if file exists.

**Returns:** `Promise<boolean>`

```typescript
if (await window.api.fileExists(path)) {
  // File exists
}
```

#### `window.api.createDirectory(dirPath: string, recursive?: boolean)`

Creates directory.

**Parameters:**

- `recursive` - If `true`, creates parent directories (default: `true`)

```typescript
await window.api.createDirectory('C:\\...\\new-folder')
```

#### `window.api.deleteFile(filePath: string)`

Deletes single file.

```typescript
await window.api.deleteFile('C:\\...\\temp.json')
```

#### `window.api.deleteDirectory(dirPath: string, recursive?: boolean)`

Deletes directory.

**Parameters:**

- `recursive` - If `true`, deletes directory and all contents (default: `false`)

**Warning:** Recursive delete is permanent and cannot be undone.

```typescript
// Delete empty directory
await window.api.deleteDirectory('C:\\...\\empty-folder')

// Delete directory and contents (DESTRUCTIVE)
await window.api.deleteDirectory('C:\\...\\folder', true)
```

#### `window.api.getFileStats(filePath: string)`

Gets file/directory metadata.

**Returns:** `{size: number, isFile: boolean, isDirectory: boolean, created: Date, modified: Date}`

```typescript
const stats = await window.api.getFileStats('C:\\...\\data.json')
console.log(`Size: ${stats.size} bytes, Modified: ${stats.modified}`)
```

#### `window.api.readDirectory(dirPath: string)`

Lists directory contents.

**Returns:** `Promise<Array<{name: string, isFile: boolean, isDirectory: boolean}>>`

```typescript
const entries = await window.api.readDirectory('C:\\...\\downloads')
entries.forEach((entry) => {
  console.log(entry.isFile ? 'File:' : 'Dir:', entry.name)
})
```

#### `window.api.getAllowedPaths()`

Gets allowed filesystem paths.

**Returns:** `{appData: string, downloads: string}`

```typescript
const paths = await window.api.getAllowedPaths()
console.log(`AppData: ${paths.appData}`)
console.log(`Downloads: ${paths.downloads}`)
```

#### `window.api.selectDownloadsFolder()`

Shows folder picker to change downloads directory.

**Returns:** `Promise<string | null>` - Selected path or `null` if cancelled

```typescript
const newPath = await window.api.selectDownloadsFolder()
if (newPath) {
  console.log(`Downloads folder changed to: ${newPath}`)
}
```

#### `window.api.openDownloadsFolder()`

Opens downloads directory in file explorer.

```typescript
await window.api.openDownloadsFolder()
```

---

### Progress Tracking

Reading progress and statistics.

#### `window.api.getReadingProgress(mangaId: string)`

Gets reading progress for a manga.

**Returns:** `{lastReadChapterId: string, lastReadPage: number, lastReadAt: Date} | null`

```typescript
const progress = await window.api.getReadingProgress('xyz789...')
if (progress) {
  console.log(`Resume from chapter ${progress.lastReadChapterId}, page ${progress.lastReadPage}`)
}
```

#### `window.api.saveReadingProgress(mangaId: string, chapterId: string, page: number)`

Saves current reading position.

```typescript
// Save progress: page 15 of current chapter
await window.api.saveReadingProgress('xyz789...', 'abc123...', 15)
```

#### `window.api.deleteReadingProgress(mangaId: string)`

Removes reading progress for a manga.

```typescript
await window.api.deleteReadingProgress('xyz789...')
```

#### `window.api.getReadingStatistics()`

Gets reading statistics across all manga.

**Returns:**

```typescript
{
  totalMangaRead: number
  totalChaptersRead: number
  totalPagesRead: number
  readingTimeMinutes: number
}
```

```typescript
const stats = await window.api.getReadingStatistics()
console.log(`Read ${stats.totalChaptersRead} chapters across ${stats.totalMangaRead} manga`)
```

#### `window.api.getAllReadingProgress()`

Gets progress for all manga.

**Returns:** `Array<{mangaId: string, lastReadChapterId: string, lastReadPage: number, lastReadAt: Date}>`

```typescript
const allProgress = await window.api.getAllReadingProgress()
// Show in Continue Reading section
```

#### `window.api.getChapterProgress(chapterId: string)`

Gets progress for a specific chapter.

**Returns:** `{read: boolean, lastReadPage: number} | null`

```typescript
const progress = await window.api.getChapterProgress('abc123...')
if (progress?.read) {
  // Show as read
}
```

#### `window.api.getAllChapterProgress(mangaId: string)`

Gets progress for all chapters of a manga.

**Returns:** `Array<{chapterId: string, read: boolean, lastReadPage: number}>`

```typescript
const chapters = await window.api.getAllChapterProgress('xyz789...')
// Mark read chapters in chapter list
```

#### `window.api.saveChapterProgress(items: Array<{mangaId: string, chapterId: string, read: boolean}>)`

Batch update chapter read status.

```typescript
// Mark chapters 1-10 as read
await window.api.saveChapterProgress([
  { mangaId: 'xyz789...', chapterId: 'ch1...', read: true },
  { mangaId: 'xyz789...', chapterId: 'ch2...', read: true }
  // ...
])
```

---

### Backup & Restore

#### DexReader Native Format

##### `window.api.exportDexReaderData(savePath: string)`

Exports library to .dexreader backup file.

**Parameters:**

- `savePath` - Absolute path for backup file (should end with `.dexreader`)

**Returns:** `{success: boolean, mangaCount: number, size: number}`

**Events:**

- `dexreader:export-progress` - `{current: number, total: number, currentManga: string}`

```typescript
const result = await window.api.exportDexReaderData(
  'C:\\...\\Documents\\dexreader-backup-2026-04-20.dexreader'
)
console.log(`Exported ${result.mangaCount} manga (${result.size} bytes)`)
```

##### `window.api.importDexReaderData(filePath: string)`

Imports library from .dexreader backup file.

**Parameters:**

- `filePath` - Absolute path to backup file

**Returns:** `{success: boolean, mangaImported: number, chaptersImported: number}`

**Merge Strategy:** Adds new entries, preserves existing data (no deletion).

**Events:**

- `dexreader:import-progress` - `{current: number, total: number, currentManga: string}`

```typescript
const result = await window.api.importDexReaderData('C:\\...\\Downloads\\backup.dexreader')
console.log(`Imported ${result.mangaImported} manga`)
```

##### `window.api.cancelDexReaderImport()`

Cancels ongoing import operation.

**Note:** Partially imported data remains (not rolled back).

```typescript
await window.api.cancelDexReaderImport()
```

#### Mihon/Tachiyomi Compatibility

##### `window.api.importMihonBackup(filePath: string)`

Imports library from Mihon/Tachiyomi backup.

**Parameters:**

- `filePath` - Path to `.tachibk` or `.proto.gz` file

**Returns:** `{success: boolean, mangaImported: number, chaptersImported: number}`

**Note:** Only MangaDex manga are imported (other sources skipped).

```typescript
const result = await window.api.importMihonBackup(
  'C:\\...\\Downloads\\tachiyomi_2026-04-20.tachibk'
)
console.log(`Imported ${result.mangaImported} MangaDex manga`)
```

##### `window.api.cancelMihonImport()`

Cancels ongoing Mihon import.

```typescript
await window.api.cancelMihonImport()
```

##### `window.api.exportMihonBackup(savePath: string)`

Exports library to Mihon/Tachiyomi compatible backup.

**Parameters:**

- `savePath` - Path where `.tachibk` file will be saved

**Returns:** `{success: boolean, mangaExported: number, chaptersExported: number}`

```typescript
const result = await window.api.exportMihonBackup('C:\\...\\Documents\\dexreader-to-mihon.tachibk')
console.log(`Exported ${result.mangaExported} manga for Mihon`)
```

---

### App Settings

Application configuration CRUD.

#### `window.api.loadSettings()`

Loads all settings from disk.

**Returns:** `AppSettings`

```typescript
const settings = await window.api.loadSettings()
console.log(`Theme: ${settings.appearance.theme}`)
```

#### `window.api.getSetting(key: string)`

Gets a specific settings section.

**Parameters:**

- `key` - Section key: `'appearance'` | `'downloads'` | `'reader'` | `'update'` | `'logs'`

**Returns:** Section object (e.g., `AppearanceSettings`)

```typescript
const readerSettings = await window.api.getSetting('reader')
console.log(`Default reading mode: ${readerSettings.readingMode}`)
```

#### `window.api.saveSetting(key: string, value: object)`

Updates a settings section.

**Parameters:**

- `key` - Section key
- `value` - New settings object matching section structure

**Triggers:** Cache updates, chapter cache resize (if reader settings changed)

```typescript
// Update reader settings
await window.api.saveSetting('reader', {
  readingMode: 'vertical',
  fitMode: 'width',
  zoom: 100,
  chapterCacheSize: 200
})
```

#### `window.api.openSettingsFile()`

Opens settings.json in default text editor.

**Note:** Changes made externally require app restart.

```typescript
await window.api.openSettingsFile()
```

#### `window.api.resetToDefaults()`

Resets all settings to factory defaults.

**Warning:** User preferences are lost. Library data (favorites, progress) is preserved.

```typescript
await window.api.resetToDefaults()
```

#### `window.api.clearAllData()`

**DESTRUCTIVE:** Deletes entire database and resets settings.

**Warning:** Deletes favorites, progress, downloads, collections. Cannot be undone. App restarts after operation.

```typescript
await window.api.clearAllData()
// App will restart
```

#### `window.api.openSystemDateSettings()`

Opens OS region & language settings.

**Returns:** `Promise<boolean>` - `true` if opened, `false` if unsupported platform (Linux)

```typescript
const opened = await window.api.openSystemDateSettings()
if (!opened) {
  console.log('Platform not supported')
}
```

#### `window.api.getMemoryTierInfo()`

Gets system memory tier for cache recommendations.

**Returns:**

```typescript
{
  tier: 'Low' | 'Normal' | 'High'
  totalRAM: number // GB
  recommendedSize: number // MB
}
```

```typescript
const tierInfo = await window.api.getMemoryTierInfo()
console.log(`Your system: ${tierInfo.tier} tier (${tierInfo.totalRAM} GB RAM)`)
console.log(`Recommended cache: ${tierInfo.recommendedSize} MB`)
```

---

### Storage Management

#### `window.api.getStorageStats()`

Gets storage statistics for all manga data.

**Returns:**

```typescript
{
  totalSize: number // bytes
  coverCacheSize: number
  downloadedChaptersSize: number
  mangaCount: number
}
```

```typescript
const stats = await window.api.getStorageStats()
console.log(`Total: ${stats.totalSize / 1024 / 1024} MB`)
console.log(`${stats.mangaCount} manga in library`)
```

#### `window.api.clearMangaCache(immediate: boolean)`

Clears manga metadata cache.

**Parameters:**

- `immediate` - If `true`, deletes all non-favorited manga. If `false`, only deletes entries older than 90 days.

**Returns:** `{deletedCount: number, freedSpace: number}`

```typescript
// Gentle cleanup (90+ days)
await window.api.clearMangaCache(false)

// Aggressive cleanup (all non-favorited)
await window.api.clearMangaCache(true)
```

#### `window.api.optimiseStorage()`

Runs VACUUM on database to reclaim space.

**Returns:** `{freedSpace: number}`

**Note:** May take a few seconds for large databases.

```typescript
const result = await window.api.optimiseStorage()
console.log(`Reclaimed ${result.freedSpace / 1024 / 1024} MB`)
```

#### `window.api.setCoverCacheLimit(limit: number)`

Sets cover image cache size limit.

**Parameters:**

- `limit` - Limit in MB (10-500, or 0 for unlimited)

**Throws:** `RangeError` if limit is outside valid range

```typescript
// Set 200 MB limit
await window.api.setCoverCacheLimit(200)

// Set unlimited
await window.api.setCoverCacheLimit(0)
```

---

### Downloads

Chapter download queue and management.

#### `window.api.downloadChapter(params)`

Downloads a chapter for offline reading.

**Parameters:**

```typescript
{
  chapterId: string // MangaDex UUID
  mangaId: string
  language: string // e.g., 'en', 'ja'
  quality: 'data' | 'data-saver' // original (~3-5MB) or compressed (~500KB)
}
```

**Events:**

- `download:progress` - `{chapterId: string, progress: number}`
- `download:complete` - `{chapterId: string}`
- `download:error` - `{chapterId: string, error: string}`

```typescript
await window.api.downloadChapter({
  chapterId: 'abc123...',
  mangaId: 'xyz789...',
  language: 'en',
  quality: 'data'
})

window.api.on('download:progress', (_, { chapterId, progress }) => {
  console.log(`${chapterId}: ${progress}%`)
})
```

#### `window.api.deleteDownloadedChapter(chapterId: string)`

Deletes downloaded chapter from disk.

**Warning:** Cannot be undone.

```typescript
await window.api.deleteDownloadedChapter('abc123...')
```

#### `window.api.getAllDownloads()`

Gets all downloaded chapters.

**Returns:** `Array<{chapterId: string, mangaId: string, status: string, progress: number, ...}>`

```typescript
const downloads = await window.api.getAllDownloads()
```

#### `window.api.clearCompletedDownloads()`

Removes completed download records from database.

**Note:** Downloaded files remain on disk.

```typescript
await window.api.clearCompletedDownloads()
```

#### `window.api.getDownload(chapterId: string)`

Gets download info for a chapter.

**Returns:** `{downloaded: boolean, quality: string, ...} | null`

```typescript
const download = await window.api.getDownload('abc123...')
if (download) {
  console.log(`Downloaded at ${download.quality} quality`)
}
```

#### `window.api.isDownloaded(chapterId: string)`

Checks if chapter is downloaded (boolean).

**Returns:** `Promise<boolean>`

```typescript
if (await window.api.isDownloaded('abc123...')) {
  showDownloadBadge()
}
```

#### `window.api.getDownloadStorageStats()`

Gets storage statistics for downloads.

**Returns:** `{totalSize: number, mangaBreakdown: Array<{mangaId: string, size: number}>}`

```typescript
const stats = await window.api.getDownloadStorageStats()
console.log(`Total: ${stats.totalSize / 1024 / 1024} MB`)
```

#### `window.api.deleteMangaDownloads(mangaId: string)`

Deletes all downloaded chapters for a manga.

**Returns:** `{deletedCount: number, freedSpace: number}`

```typescript
const result = await window.api.deleteMangaDownloads('xyz789...')
console.log(`Deleted ${result.deletedCount} chapters`)
```

#### `window.api.batchDeleteMangaDownloads(mangaIds: string[])`

Batch delete downloads for multiple manga.

**Returns:** `{deletedCount: number, freedSpace: number}`

```typescript
const result = await window.api.batchDeleteMangaDownloads(['id1...', 'id2...'])
console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
```

#### Download Queue Operations

##### `window.api.addToDownloadQueue(params)`

Adds chapter to download queue.

**Parameters:**

```typescript
{
  chapterId: string
  mangaId: string
  language: string
  quality: 'data' | 'data-saver'
  addedAt: number // timestamp
}
```

```typescript
await window.api.addToDownloadQueue({
  chapterId: 'abc123...',
  mangaId: 'xyz789...',
  language: 'en',
  quality: 'data',
  addedAt: Date.now()
})
```

##### `window.api.clearCoverCache()`

Deletes all cached cover images.

**Returns:** `{freedSpace: number}`

```typescript
const result = await window.api.clearCoverCache()
console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
```

##### `window.api.addBatchToDownloadQueue(params: Array<QueueItem>)`

Batch add chapters to queue.

```typescript
await window.api.addBatchToDownloadQueue([
  { chapterId: 'ch1...', mangaId: 'mg1...', language: 'en', quality: 'data', addedAt: Date.now() },
  { chapterId: 'ch2...', mangaId: 'mg1...', language: 'en', quality: 'data', addedAt: Date.now() }
])
```

##### `window.api.removeFromDownloadQueue(chapterId: string)`

Removes/cancels queued download.

```typescript
await window.api.removeFromDownloadQueue('abc123...')
```

##### `window.api.clearDownloadQueue()`

Clears all pending downloads.

**Note:** Active downloads continue.

```typescript
await window.api.clearDownloadQueue()
```

##### `window.api.cancelAllQueuedDownloads()`

Cancels all active and pending downloads.

```typescript
await window.api.cancelAllQueuedDownloads()
```

##### `window.api.retryDownload(chapterId: string)`

Retries failed download.

```typescript
await window.api.retryDownload('abc123...')
```

##### `window.api.getQueueStats()`

Gets download queue statistics.

**Returns:** `{pending: number, active: number, completed: number, failed: number}`

```typescript
const stats = await window.api.getQueueStats()
console.log(`${stats.active} active, ${stats.pending} pending`)
```

##### `window.api.getQueuedDownloadItems()`

Gets all queued download items.

**Returns:** `Array<{chapterId: string, status: string, progress: number, ...}>`

```typescript
const items = await window.api.getQueuedDownloadItems()
```

##### `window.api.getDownloadStats(mangaId: string)`

Gets download statistics for a manga.

**Returns:** `{totalChapters: number, downloaded: number, inProgress: number}`

```typescript
const stats = await window.api.getDownloadStats('xyz789...')
console.log(`${stats.downloaded}/${stats.totalChapters} chapters downloaded`)
```

---

### Library

Favorites, manga metadata, and update checking.

#### `window.api.getLibraryManga(options)`

Gets library manga with filtering and sorting.

**Parameters:**

```typescript
{
  sortBy?: 'title' | 'updatedAt' | 'addedAt'
  sortOrder?: 'asc' | 'desc'
  filters?: {
    tags?: string[]
    contentRating?: string[]
    status?: string[]
  }
  limit?: number
  offset?: number
}
```

**Returns:** `Promise<Array<Manga>>`

```typescript
const manga = await window.api.getLibraryManga({
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  limit: 50,
  offset: 0
})
```

#### `window.api.getMangaById(mangaId: string)`

Gets manga details from local cache.

**Returns:** `Promise<Manga | null>`

```typescript
const manga = await window.api.getMangaById('xyz789...')
if (manga) console.log(manga.title)
```

#### `window.api.getCachedChapters(mangaId: string)`

Gets chapter list from local cache.

**Returns:** `Promise<Array<Chapter>>`

**Note:** May be stale. Use `checkForUpdates` to refresh.

```typescript
const chapters = await window.api.getCachedChapters('xyz789...')
```

#### `window.api.toggleFavorite(mangaId: string)`

Toggles favorite status.

**Returns:** `{favorited: boolean}`

**Note:** Downloaded chapters are NOT deleted when unfavoriting.

```typescript
const result = await window.api.toggleFavorite('xyz789...')
console.log(result.favorited ? 'Added to library' : 'Removed from library')
```

#### `window.api.upsertManga(command)`

Inserts/updates manga metadata in cache.

**Parameters:**

```typescript
{
  id: string
  title: string
  description: string
  tags: string[]
  authors: string[]
  coverUrl: string
  // ... other metadata
}
```

```typescript
await window.api.upsertManga({
  id: 'xyz789...',
  title: 'Sample Manga',
  description: '...',
  tags: [...],
  authors: ['Author Name'],
  coverUrl: 'https://...'
})
```

#### `window.api.checkForUpdates(mangaIds: string[])`

Checks for new chapters.

**Returns:** `Promise<Array<{mangaId: string, newChapterCount: number}>>`

```typescript
const updates = await window.api.checkForUpdates(libraryMangaIds)
updates.forEach((u) => console.log(`${u.mangaId}: ${u.newChapterCount} new chapters`))
```

#### `window.api.getMangaWithUpdates()`

Gets manga with unread new chapters.

**Returns:** `Promise<Array<Manga & {newChapterCount: number}>>`

```typescript
const mangaWithUpdates = await window.api.getMangaWithUpdates()
console.log(`${mangaWithUpdates.length} manga have new chapters`)
```

#### `window.api.getDownloadedManga()`

Gets manga with downloaded chapters.

**Returns:** `Promise<Array<Manga & {downloadedChapterCount: number}>>`

```typescript
const downloadedManga = await window.api.getDownloadedManga()
```

---

### Collections

Custom reading lists.

#### `window.api.getAllCollections()`

Gets all collections.

**Returns:** `Promise<Array<Collection>>`

```typescript
const collections = await window.api.getAllCollections()
collections.forEach((c) => console.log(`${c.name}: ${c.mangaCount} manga`))
```

#### `window.api.getCollectionManga(collectionId: number)`

Gets manga in a collection.

**Returns:** `Promise<Array<Manga>>`

```typescript
const manga = await window.api.getCollectionManga(5)
```

#### `window.api.getCollectionsByManga(mangaId: string)`

Gets collections containing a manga.

**Returns:** `Promise<Array<Collection>>`

```typescript
const collections = await window.api.getCollectionsByManga('xyz789...')
console.log(`In ${collections.length} collections`)
```

#### `window.api.createCollection(command)`

Creates new collection.

**Parameters:**

```typescript
{
  name: string
  description?: string
}
```

**Returns:** `{id: number}`

```typescript
const result = await window.api.createCollection({
  name: 'Favorites',
  description: 'My top picks'
})
console.log(`Created collection ${result.id}`)
```

#### `window.api.updateCollection(command)`

Updates collection metadata.

**Parameters:**

```typescript
{
  id: number
  name?: string
  description?: string
}
```

```typescript
await window.api.updateCollection({
  id: 5,
  name: 'Top Picks',
  description: 'Updated description'
})
```

#### `window.api.deleteCollection(collectionId: number)`

Deletes collection.

**Warning:** Cannot be undone. Manga are NOT deleted.

```typescript
await window.api.deleteCollection(5)
```

#### `window.api.addMangaToCollection(command)`

Adds manga to collection.

**Parameters:**

```typescript
{
  collectionId: number
  mangaIds: string[]
}
```

```typescript
await window.api.addMangaToCollection({
  collectionId: 5,
  mangaIds: ['xyz789...', 'abc123...']
})
```

#### `window.api.removeMangaFromCollection(command)`

Removes manga from collection(s).

**Parameters:** `Array<{collectionId: number, mangaId: string}>`

```typescript
await window.api.removeMangaFromCollection([{ collectionId: 5, mangaId: 'xyz789...' }])
```

#### `window.api.reorderCollectionManga(command)`

Reorders manga in collection.

**Parameters:**

```typescript
{
  collectionId: number
  mangaIds: string[]  // New order
}
```

```typescript
await window.api.reorderCollectionManga({
  collectionId: 5,
  mangaIds: ['id3...', 'id1...', 'id2...']
})
```

---

### Reading History

#### `window.api.getReadingHistory()`

Gets full reading history.

**Returns:** `Promise<Array<HistoryEntry>>`

```typescript
const history = await window.api.getReadingHistory()
history.forEach((h) => console.log(`${h.mangaTitle} - ${h.lastRead}`))
```

#### `window.api.getRecentlyRead(limit: number)`

Gets recently read manga.

**Returns:** `Promise<Array<HistoryEntry>>`

```typescript
const recent = await window.api.getRecentlyRead(10)
```

#### `window.api.recordRead(command)`

Records chapter read event.

**Parameters:**

```typescript
{
  mangaId: string
  chapterId: string
  lastPage: number
}
```

```typescript
await window.api.recordRead({
  mangaId: 'xyz789...',
  chapterId: 'abc123...',
  lastPage: 15
})
```

#### `window.api.clearReadingHistory()`

**DESTRUCTIVE:** Deletes all reading history.

**Note:** Reading progress (last read chapter/page) is preserved.

```typescript
await window.api.clearReadingHistory()
```

---

### MangaDex API

MangaDex API proxy handlers (rate-limited by main process).

#### `window.api.searchManga(query)`

Searches manga on MangaDex.

**Parameters:**

```typescript
{
  title?: string
  includedTags?: string[]  // Tag UUIDs
  excludedTags?: string[]
  contentRating?: Array<'safe' | 'suggestive' | 'erotica' | 'pornographic'>
  status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>
  publicationDemographic?: 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'
  order?: {[field: string]: 'asc' | 'desc'}
  limit?: number  // max 100
  offset?: number
}
```

**Returns:** `{data: Array<Manga>, total: number}`

```typescript
const results = await window.api.searchManga({
  includedTags: ['391b0423-d847-456f-aff0-8b0cfc03066b'], // Action
  contentRating: ['safe', 'suggestive'],
  status: ['ongoing'],
  order: { latestUploadedChapter: 'desc' },
  limit: 20,
  offset: 0
})
console.log(`Found ${results.total} manga`)
```

#### `window.api.getMangaDetails(id: string, includes?: string[])`

Gets manga details from MangaDex API.

**Parameters:**

- `id` - MangaDex manga UUID
- `includes` - Optional: `['author', 'artist', 'cover_art']`

**Returns:** `{data: Manga}`

```typescript
const result = await window.api.getMangaDetails('xyz789...', ['cover_art', 'author'])
console.log(result.data.attributes.title.en)
```

#### `window.api.getMangaFeed(id: string, query)`

Gets chapter feed for a manga.

**Parameters:**

```typescript
{
  translatedLanguage?: string[]  // e.g., ['en', 'ja']
  contentRating?: string[]
  order?: {chapter: 'asc' | 'desc'}
  limit?: number  // max 500
  offset?: number
}
```

**Returns:** `{data: Array<Chapter>, total: number}`

```typescript
const feed = await window.api.getMangaFeed('xyz789...', {
  translatedLanguage: ['en'],
  order: { chapter: 'asc' },
  limit: 100,
  offset: 0
})
console.log(`${feed.total} English chapters available`)
```

#### `window.api.getChapterDetails(id: string, includes?: string[])`

Gets chapter details.

**Parameters:**

- `id` - MangaDex chapter UUID
- `includes` - Optional: `['scanlation_group', 'manga', 'user']`

**Returns:** `{data: Chapter}`

```typescript
const result = await window.api.getChapterDetails('abc123...', ['scanlation_group'])
console.log(`Chapter ${result.data.attributes.chapter} - ${result.data.attributes.pages} pages`)
```

#### `window.api.getChapterImages(id: string, quality: 'data' | 'data-saver')`

Gets chapter image URLs.

**Returns:**

```typescript
{
  baseUrl: string
  chapter: {
    hash: string
    data: string[]  // Original quality filenames
    dataSaver: string[]  // Compressed quality filenames
  }
}
```

```typescript
const images = await window.api.getChapterImages('abc123...', 'data')
images.chapter.data.forEach((hash, i) => {
  const url = `${images.baseUrl}/data/${images.chapter.hash}/${hash}`
  console.log(`Page ${i + 1}: ${url}`)
})
```

#### `window.api.checkMangaDexHealth()`

Checks MangaDex API health.

**Returns:** `Promise<boolean>`

```typescript
const isOnline = await window.api.checkMangaDexHealth()
if (!isOnline) {
  showError('MangaDex API is offline')
}
```

---

## Type Definitions

### Common Types

```typescript
// Manga metadata
interface Manga {
  id: string // MangaDex UUID
  title: string
  description: string
  tags: string[]
  authors: string[]
  artists: string[]
  coverUrl: string
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
  contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic'
  publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'
  year: number
  lastVolumeNumber: string
  lastChapterNumber: string
  createdAt: Date
  updatedAt: Date
}

// Chapter metadata
interface Chapter {
  id: string // MangaDex UUID
  title: string
  volume: string | null
  chapter: string
  pages: number
  translatedLanguage: string
  publishAt: Date
  createdAt: Date
  updatedAt: Date
}

// Reader settings
interface MangaReaderSettings {
  readingMode: 'single-page' | 'double-page' | 'vertical' | 'webtoon'
  fitMode: 'width' | 'height' | 'original'
  zoom: number // 25-300
}

// App settings
interface AppSettings {
  appearance: AppearanceSettings
  downloads: DownloadsSettings
  reader: ReaderSettings
  update: UpdateSettings
  logs: LogSettings
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string // hex
}

interface DownloadsSettings {
  downloadsPath: string
  maxConcurrentDownloads: number
  maxDiskCacheSize: number // bytes (0 = unlimited)
  deleteDownloadsOnUnfavorite: boolean
}

interface ReaderSettings {
  readingMode: 'single-page' | 'double-page' | 'vertical' | 'webtoon'
  fitMode: 'width' | 'height' | 'original'
  zoom: number
  chapterCacheSize: number // MB
  preloadNextChapter: boolean
  showPageNumber: boolean
}

interface UpdateSettings {
  checkForUpdatesOnStartup: boolean
  autoDownloadUpdates: boolean
  includePreReleases: boolean
}

interface LogSettings {
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  retentionDays: number
  maxLogFileSize: number // MB
}

// Collection
interface Collection {
  id: number // Auto-increment
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  mangaCount: number
}

// Reading progress
interface ReadingProgress {
  mangaId: string
  lastReadChapterId: string
  lastReadPage: number // 0-indexed
  lastReadAt: Date
}

// Download queue item
interface QueuedDownloads {
  chapterId: string
  mangaId: string
  language: string
  quality: 'data' | 'data-saver'
  addedAt: number // timestamp
}
```

---

## Error Handling

All IPC handlers use consistent error patterns:

### Parameter Validation Errors

**Error Type:** `TypeError`

Thrown when parameters are invalid, missing, or wrong type.

```typescript
try {
  await window.api.downloadChapter(invalidParams)
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Invalid parameters:', error.message)
    // Show validation error to user
  }
}
```

### Operation Errors

**Error Type:** `Error`

Thrown when operations fail (filesystem errors, network errors, database errors).

```typescript
try {
  await window.api.deleteDownloadedChapter(chapterId)
} catch (error) {
  if (error instanceof Error) {
    console.error('Operation failed:', error.message)
    // Show error notification
  }
}
```

### Range Errors

**Error Type:** `RangeError`

Thrown when numeric parameters are outside valid ranges.

```typescript
try {
  await window.api.setCoverCacheLimit(5000) // Too large
} catch (error) {
  if (error instanceof RangeError) {
    console.error('Value out of range:', error.message)
  }
}
```

### Error Messages

Error messages are descriptive and user-friendly:

- `"Invalid file path"` - Path validation failed
- `"Selected file isn't a valid Tachiyomi/Mihon backup file"` - File extension check failed
- `"Cover cache limit must be between 10 MB and 500 MB"` - Range validation failed
- `"At least one mangaId is required for batch deleting manga downloads"` - Empty array

---

## Conventions

### Naming Patterns

- **Channel names:** `category:action` (e.g., `download:get-stats`, `library:toggle-favourite`)
- **Method names:** `camelCase` following action (e.g., `downloadChapter`, `getMangaById`)
- **Boolean returns:** Methods starting with `is` return boolean (e.g., `isDownloaded`)

### Parameter Validation

All handlers validate parameters before processing:

1. **Type check** - Ensures correct type (`typeof`, `Array.isArray`)
2. **Structure check** - Validates object shape using type guards
3. **Range check** - Validates numeric bounds
4. **Existence check** - Ensures required values are not null/empty

### Async/Await

All IPC handlers are asynchronous and return Promises:

```typescript
// Always use await
const result = await window.api.methodName()

// Or .then()
window.api
  .methodName()
  .then((result) => {
    /* ... */
  })
  .catch((error) => {
    /* ... */
  })
```

### UUIDs

MangaDex uses v4 UUIDs for all IDs:

- **Manga IDs:** `'xyz789-uvw012-...'` (36 characters with hyphens)
- **Chapter IDs:** `'abc123-def456-...'`
- **Tag IDs:** `'391b0423-d847-456f-aff0-8b0cfc03066b'`

### Timestamps

- **JavaScript Date objects** in responses
- **Unix timestamps (number)** in requests (e.g., `addedAt: Date.now()`)

### Paths

- **Absolute paths** required for filesystem operations
- **Platform-specific separators** - `\\` on Windows, `/` on macOS/Linux
- **Security restrictions** - Only AppData and downloads directory accessible

### Destructive Operations

Operations that delete data are clearly documented as **DESTRUCTIVE** or **Warning**:

- `clearAllData()` - Deletes entire database
- `clearReadingHistory()` - Deletes all history
- `deleteDirectory(path, true)` - Recursive delete
- `resetToDefaults()` - Resets settings

Always show confirmation dialogs before calling destructive operations.

---

## See Also

- [IPC Messaging Architecture](./architecture/ipc-messaging.md) - Technical details of IPC system
- [Error Handling Patterns](./architecture/error-handling.md) - Error propagation and handling
- [State Management](./architecture/state-management.md) - Zustand stores and state flow
- [MangaDex API Documentation](./architecture/mangadex-api.md) - MangaDex API reference
- [System Patterns](../.github/memory-bank/system-pattern.md) - Coding standards and best practices

---

**Document Version:** 1.0.0
**Generated:** April 20, 2026
**Maintainer:** DexReader Development Team
