import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'

// vi.mock factories are hoisted above imports, so the mock fns themselves must be
// created via vi.hoisted - that also keeps them stable across the vi.resetModules()
// calls the "context isolation" tests below use to re-evaluate index.ts, where a plain
// module-scope object would otherwise be replaced by a fresh, disconnected instance.
const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  send: vi.fn(),
  exposeInMainWorld: vi.fn()
}))

vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: mocks.invoke,
    on: mocks.on,
    removeListener: mocks.removeListener,
    send: mocks.send
  },
  contextBridge: {
    exposeInMainWorld: mocks.exposeInMainWorld
  }
}))

// @electron-toolkit/preload is a real node_modules package that Vite treats as an
// external dependency, so its own `import ... from 'electron'` bypasses the vi.mock
// above and hits the real (non-Electron-runtime) 'electron' package. Its actual
// implementation is irrelevant here - index.ts only re-exposes electronAPI as-is.
vi.mock('@electron-toolkit/preload', () => ({
  electronAPI: { ipcRenderer: {}, webFrame: {}, webUtils: {}, process: {} }
}))

// Side-effect import: process.contextIsolated is undefined in this Node test
// environment, so this populates globalThis.* (the same branch a non-isolated
// renderer would take) rather than calling contextBridge.
import './index'

beforeEach(() => {
  mocks.invoke.mockClear()
  mocks.on.mockClear()
  mocks.removeListener.mockClear()
  mocks.send.mockClear()
  mocks.exposeInMainWorld.mockClear()
})

// The preload surface is ~140 thin ipcRenderer wrappers with heterogeneous signatures.
// These two helpers cast once at a single boundary so the case tables below can stay
// flat data instead of needing a bespoke type for every method.
function callMethod(method: unknown, args: unknown[]): unknown {
  return (method as (...methodArgs: unknown[]) => unknown)(...args)
}

function registerListener(method: unknown, callback: (...payload: unknown[]) => void): () => void {
  return (method as (cb: (...payload: unknown[]) => void) => () => void)(callback)
}

type InvokeCase = [label: string, channel: string, args: unknown[], getMethod: () => unknown]

const INVOKE_CASES: InvokeCase[] = [
  // api
  ['api.getTheme', 'get-theme', [], () => globalThis.api.getTheme],
  [
    'api.getSystemAccentColor',
    'theme:get-system-accent-color',
    [],
    () => globalThis.api.getSystemAccentColor
  ],
  [
    'api.showConfirmDialog',
    'show-confirm-dialog',
    ['Delete this manga?', 'This cannot be undone.', 'Delete', 'Cancel'],
    () => globalThis.api.showConfirmDialog
  ],
  ['api.showDialog', 'show-dialog', [{ message: 'Continue?' }], () => globalThis.api.showDialog],
  [
    'api.openExternal',
    'shell:open-external',
    ['https://mangadex.org'],
    () => globalThis.api.openExternal
  ],

  // fileSystem
  [
    'fileSystem.readFile',
    'fs:read-file',
    ['/tmp/a.json', 'utf-8'],
    () => globalThis.fileSystem.readFile
  ],
  [
    'fileSystem.writeFile',
    'fs:write-file',
    ['/tmp/a.json', 'data', 'utf-8'],
    () => globalThis.fileSystem.writeFile
  ],
  ['fileSystem.isExists', 'fs:is-exists', ['/tmp/a.json'], () => globalThis.fileSystem.isExists],
  [
    'fileSystem.copyFile',
    'fs:copy-file',
    ['/tmp/a.json', '/tmp/b.json'],
    () => globalThis.fileSystem.copyFile
  ],
  [
    'fileSystem.appendFile',
    'fs:append-file',
    ['/tmp/a.json', 'more'],
    () => globalThis.fileSystem.appendFile
  ],
  [
    'fileSystem.rename',
    'fs:rename',
    ['/tmp/a.json', '/tmp/b.json'],
    () => globalThis.fileSystem.rename
  ],
  ['fileSystem.mkdir', 'fs:mkdir', ['/tmp/dir'], () => globalThis.fileSystem.mkdir],
  ['fileSystem.unlink', 'fs:unlink', ['/tmp/a.json'], () => globalThis.fileSystem.unlink],
  ['fileSystem.rmdir', 'fs:rmdir', ['/tmp/dir'], () => globalThis.fileSystem.rmdir],
  ['fileSystem.stat', 'fs:stat', ['/tmp/a.json'], () => globalThis.fileSystem.stat],
  ['fileSystem.readdir', 'fs:readdir', ['/tmp/dir'], () => globalThis.fileSystem.readdir],
  [
    'fileSystem.getAllowedPaths',
    'fs:get-allowed-paths',
    [],
    () => globalThis.fileSystem.getAllowedPaths
  ],
  [
    'fileSystem.selectDownloadsFolder',
    'fs:select-downloads-folder',
    [],
    () => globalThis.fileSystem.selectDownloadsFolder
  ],
  [
    'fileSystem.openDownloadsFolder',
    'fs:open-downloads-folder',
    [],
    () => globalThis.fileSystem.openDownloadsFolder
  ],

  // mangadex
  [
    'mangadex.searchManga',
    'mangadex:search-manga',
    [{ title: 'Berserk' }],
    () => globalThis.mangadex.searchManga
  ],
  [
    'mangadex.getManga',
    'mangadex:get-manga',
    ['manga-1', ['cover_art']],
    () => globalThis.mangadex.getManga
  ],
  [
    'mangadex.getMangaFeed',
    'mangadex:get-manga-feed',
    ['manga-1', { limit: 20 }],
    () => globalThis.mangadex.getMangaFeed
  ],
  [
    'mangadex.getChapter',
    'mangadex:get-chapter',
    ['chapter-1', ['scanlation_group']],
    () => globalThis.mangadex.getChapter
  ],
  [
    'mangadex.getChapterImages',
    'mangadex:get-chapter-images',
    ['chapter-1', ImageQuality.High],
    () => globalThis.mangadex.getChapterImages
  ],
  ['mangadex.isServiceAlive', 'mangadex:healthcheck', [], () => globalThis.mangadex.isServiceAlive],

  // progress
  [
    'progress.getProgress',
    'progress:get-progress',
    ['manga-1'],
    () => globalThis.progress.getProgress
  ],
  [
    'progress.saveProgress',
    'progress:save-progress',
    [{ mangaId: 'manga-1', chapterId: 'chapter-1' }],
    () => globalThis.progress.saveProgress
  ],
  [
    'progress.getAllProgress',
    'progress:get-all-progress',
    [],
    () => globalThis.progress.getAllProgress
  ],
  [
    'progress.deleteProgress',
    'progress:delete-progress',
    ['manga-1'],
    () => globalThis.progress.deleteProgress
  ],
  [
    'progress.getStatistics',
    'progress:get-statistics',
    [],
    () => globalThis.progress.getStatistics
  ],
  [
    'progress.getAllChapterProgress',
    'progress:get-all-chapter-progress',
    ['manga-1'],
    () => globalThis.progress.getAllChapterProgress
  ],
  [
    'progress.saveChapters',
    'progress:save-chapters',
    [[{ chapterId: 'chapter-1' }]],
    () => globalThis.progress.saveChapters
  ],

  // reader
  [
    'reader.getMangaReaderSettings',
    'reader:get-manga-settings',
    ['manga-1'],
    () => globalThis.reader.getMangaReaderSettings
  ],
  [
    'reader.updateMangaReaderSettings',
    'reader:update-manga-settings',
    ['manga-1', { readingMode: 'single' }],
    () => globalThis.reader.updateMangaReaderSettings
  ],
  [
    'reader.resetMangaReaderSettings',
    'reader:reset-manga-settings',
    ['manga-1'],
    () => globalThis.reader.resetMangaReaderSettings
  ],
  [
    'reader.clearAllOverrides',
    'reader:clear-all-overrides',
    [],
    () => globalThis.reader.clearAllOverrides
  ],
  [
    'reader.getAllMangaOverrides',
    'reader:get-all-manga-overrides',
    [],
    () => globalThis.reader.getAllMangaOverrides
  ],

  // library
  [
    'library.getLibraryManga',
    'library:get-manga',
    [{ limit: 20 }],
    () => globalThis.library.getLibraryManga
  ],
  [
    'library.getMangaById',
    'library:get-manga-by-id',
    ['manga-1'],
    () => globalThis.library.getMangaById
  ],
  [
    'library.getCachedChapters',
    'library:get-cached-chapters',
    ['manga-1'],
    () => globalThis.library.getCachedChapters
  ],
  [
    'library.toggleFavourite',
    'library:toggle-favourite',
    ['manga-1'],
    () => globalThis.library.toggleFavourite
  ],
  [
    'library.upsertManga',
    'library:upsert-manga',
    [{ mangaId: 'manga-1', title: 'Berserk' }],
    () => globalThis.library.upsertManga
  ],
  [
    'library.getDownloadedManga',
    'library:get-downloaded-manga',
    [],
    () => globalThis.library.getDownloadedManga
  ],

  // storage
  ['storage.statsMangaTable', 'storage:get-stats', [], () => globalThis.storage.statsMangaTable],
  [
    'storage.clearMangaCache',
    'storage:clear-manga-cache',
    [true],
    () => globalThis.storage.clearMangaCache
  ],
  [
    'storage.optimiseMangaCache',
    'storage:optimise-manga-cache',
    [],
    () => globalThis.storage.optimiseMangaCache
  ],

  // collections
  [
    'collections.getAllCollections',
    'collections:get-all',
    [],
    () => globalThis.collections.getAllCollections
  ],
  [
    'collections.getMangaInCollection',
    'collections:get-manga',
    [1],
    () => globalThis.collections.getMangaInCollection
  ],
  [
    'collections.getCollectionsByManga',
    'collections:get-by-manga',
    ['manga-1'],
    () => globalThis.collections.getCollectionsByManga
  ],
  [
    'collections.createCollection',
    'collections:create',
    [{ name: 'Favourites' }],
    () => globalThis.collections.createCollection
  ],
  [
    'collections.updateCollection',
    'collections:update',
    [{ id: 1, name: 'Renamed' }],
    () => globalThis.collections.updateCollection
  ],
  [
    'collections.deleteCollection',
    'collections:delete',
    [1],
    () => globalThis.collections.deleteCollection
  ],
  [
    'collections.addToCollection',
    'collections:add-manga',
    [{ collectionId: 1, mangaId: 'manga-1' }],
    () => globalThis.collections.addToCollection
  ],
  [
    'collections.removeFromCollection',
    'collections:remove-manga',
    [[{ collectionId: 1, mangaId: 'manga-1' }]],
    () => globalThis.collections.removeFromCollection
  ],

  // mihon
  [
    'mihon.importBackup',
    'mihon:import-backup',
    ['/tmp/backup.tachibk'],
    () => globalThis.mihon.importBackup
  ],
  ['mihon.cancelImport', 'mihon:cancel-import', [], () => globalThis.mihon.cancelImport],
  [
    'mihon.exportBackup',
    'mihon:export-backup',
    ['/tmp/export.tachibk'],
    () => globalThis.mihon.exportBackup
  ],

  // settings
  ['settings.load', 'settings:load', [], () => globalThis.settings.load],
  [
    'settings.getSettingByPath',
    'settings:get',
    ['appearance', 'theme'],
    () => globalThis.settings.getSettingByPath
  ],
  ['settings.openFile', 'settings:open-settings-file', [], () => globalThis.settings.openFile],
  [
    'settings.resetToDefaults',
    'settings:reset-to-defaults',
    [],
    () => globalThis.settings.resetToDefaults
  ],
  ['settings.clearAllData', 'settings:clear-all', [], () => globalThis.settings.clearAllData],
  [
    'settings.openSystemDateSettings',
    'settings:open-system-date-settings',
    [],
    () => globalThis.settings.openSystemDateSettings
  ],
  [
    'settings.openSystemProxySettings',
    'settings:open-system-proxy-settings',
    [],
    () => globalThis.settings.openSystemProxySettings
  ],
  [
    'settings.getMemoryTierInfo',
    'settings:get-memory-tier-info',
    [],
    () => globalThis.settings.getMemoryTierInfo
  ],
  [
    'settings.updateSection',
    'settings:update-section',
    ['appearance', { theme: 'dark' }],
    () => globalThis.settings.updateSection
  ],
  ['settings.restart', 'app:restart', [], () => globalThis.settings.restart],

  // dexreader
  [
    'dexreader.exportData',
    'dexreader:export-data',
    [
      '/tmp/export.zip',
      { includeCollections: true, includeProgress: true, includeReaderSettings: false }
    ],
    () => globalThis.dexreader.exportData
  ],
  [
    'dexreader.importData',
    'dexreader:import-data',
    ['/tmp/import.zip'],
    () => globalThis.dexreader.importData
  ],
  [
    'dexreader.cancelImport',
    'dexreader:cancel-import',
    [],
    () => globalThis.dexreader.cancelImport
  ],

  // downloads
  [
    'downloads.deleteChapter',
    'download:delete-chapter',
    [{ chapterId: 'chapter-1', isDeletePermanent: true }],
    () => globalThis.downloads.deleteChapter
  ],
  [
    'downloads.getAllDownloads',
    'download:get-all-downloads',
    [],
    () => globalThis.downloads.getAllDownloads
  ],
  [
    'downloads.getStorageInfo',
    'download:storage-stats',
    [],
    () => globalThis.downloads.getStorageInfo
  ],
  [
    'downloads.clearCompleted',
    'download:clear-completed',
    [],
    () => globalThis.downloads.clearCompleted
  ],
  [
    'downloads.getDownload',
    'download:get-download',
    ['chapter-1'],
    () => globalThis.downloads.getDownload
  ],
  [
    'downloads.isDownloaded',
    'download:is-downloaded',
    ['chapter-1'],
    () => globalThis.downloads.isDownloaded
  ],
  [
    'downloads.addToQueue',
    'download:add-to-queue',
    [{ chapterId: 'chapter-1', mangaId: 'manga-1' }],
    () => globalThis.downloads.addToQueue
  ],
  [
    'downloads.removeFromQueue',
    'download:remove-from-queue',
    ['chapter-1'],
    () => globalThis.downloads.removeFromQueue
  ],
  ['downloads.clearQueue', 'download:clear-queue', [], () => globalThis.downloads.clearQueue],
  [
    'downloads.clearCoverCache',
    'download:clear-cover-cache',
    [],
    () => globalThis.downloads.clearCoverCache
  ],
  [
    'downloads.deleteManga',
    'download:delete-manga',
    ['manga-1'],
    () => globalThis.downloads.deleteManga
  ],
  [
    'downloads.batchDeleteManga',
    'download:batch-delete-manga',
    [['manga-1', 'manga-2']],
    () => globalThis.downloads.batchDeleteManga
  ],
  [
    'downloads.cancelAllQueued',
    'download:cancel-all-queued',
    [],
    () => globalThis.downloads.cancelAllQueued
  ],
  [
    'downloads.retryDownload',
    'download:retry',
    ['chapter-1'],
    () => globalThis.downloads.retryDownload
  ],
  [
    'downloads.getQueuedItems',
    'download:get-queued-items',
    [],
    () => globalThis.downloads.getQueuedItems
  ],
  [
    'downloads.getDownloadStats',
    'download:get-download-stats',
    ['manga-1'],
    () => globalThis.downloads.getDownloadStats
  ],

  // appUpdate
  [
    'appUpdate.checkForUpdates',
    'app-update:check',
    [true],
    () => globalThis.appUpdate.checkForUpdates
  ],
  [
    'appUpdate.downloadUpdate',
    'app-update:download',
    [],
    () => globalThis.appUpdate.downloadUpdate
  ],
  ['appUpdate.installUpdate', 'app-update:install', [], () => globalThis.appUpdate.installUpdate],
  ['appUpdate.getAppVersion', 'app-update:version', [], () => globalThis.appUpdate.getAppVersion],

  // logger
  ['logger.info', 'log:info', ['a message', 1, 2], () => globalThis.logger.info],
  ['logger.error', 'log:error', ['a message'], () => globalThis.logger.error],
  ['logger.debug', 'log:debug', ['a message'], () => globalThis.logger.debug],
  ['logger.warn', 'log:warn', ['a message'], () => globalThis.logger.warn],
  ['logger.cleanupLogs (explicit)', 'log:cleanup', [true], () => globalThis.logger.cleanupLogs],
  ['logger.openLogsFolder', 'log:open-folder', [], () => globalThis.logger.openLogsFolder],

  // searchPresets
  ['searchPresets.getAll', 'search-presets:getAll', [], () => globalThis.searchPresets.getAll],
  [
    'searchPresets.updateLastUsedAt',
    'search-presets:updateLastUsedAt',
    [1],
    () => globalThis.searchPresets.updateLastUsedAt
  ],
  ['searchPresets.delete', 'search-presets:delete', [1], () => globalThis.searchPresets.delete],
  [
    'searchPresets.create',
    'search-presets:save',
    [{ name: 'Default' }],
    () => globalThis.searchPresets.create
  ],

  // gatekeeper
  ['gatekeeper.isEnabled', 'gatekeeper:available', [], () => globalThis.gatekeeper.isEnabled],
  [
    'gatekeeper.getRequireForSettings',
    'gatekeeper:getRequireForSettings',
    [],
    () => globalThis.gatekeeper.getRequireForSettings
  ],
  ['gatekeeper.enable', 'gatekeeper:enable', ['hunter2'], () => globalThis.gatekeeper.enable],
  ['gatekeeper.verify', 'gatekeeper:verify', ['hunter2'], () => globalThis.gatekeeper.verify],
  ['gatekeeper.disable', 'gatekeeper:disable', ['hunter2'], () => globalThis.gatekeeper.disable],
  [
    'gatekeeper.changePassphrase',
    'gatekeeper:update',
    ['hunter2', 'hunter3'],
    () => globalThis.gatekeeper.changePassphrase
  ],
  ['gatekeeper.reset', 'gatekeeper:reset', [], () => globalThis.gatekeeper.reset],
  [
    'gatekeeper.toggleRequiredForSettings',
    'gatekeeper:toggleRequireForSettings',
    [true],
    () => globalThis.gatekeeper.toggleRequiredForSettings
  ],

  // snapshots
  [
    'snapshots.createSnapshot',
    'snapshot:create',
    [SnapshotTrigger.Manual],
    () => globalThis.snapshots.createSnapshot
  ],
  ['snapshots.listSnapshots', 'snapshot:list', [], () => globalThis.snapshots.listSnapshots],
  [
    'snapshots.deleteSnapshot',
    'snapshot:delete',
    ['dexreader-1000_auto.db'],
    () => globalThis.snapshots.deleteSnapshot
  ],
  [
    'snapshots.restoreSnapshot',
    'snapshot:restore',
    ['dexreader-1000_auto.db'],
    () => globalThis.snapshots.restoreSnapshot
  ],

  // readHistory
  [
    'readHistory.getActiveDates',
    'history:get-active-dates',
    [{ fromDate: '2026-01-01', toDate: '2026-01-31' }],
    () => globalThis.readHistory.getActiveDates
  ],
  [
    'readHistory.getEventsByDate',
    'history:get-events-by-date',
    ['2026-01-01'],
    () => globalThis.readHistory.getEventsByDate
  ],
  [
    'readHistory.getRecentEvents',
    'history:get-recent-events',
    [20],
    () => globalThis.readHistory.getRecentEvents
  ]
]

describe('invoke-based methods', () => {
  it.each(INVOKE_CASES)(
    '%s forwards its channel and arguments to ipcRenderer.invoke',
    (_label, channel, args, getMethod) => {
      callMethod(getMethod(), args)

      expect(mocks.invoke).toHaveBeenCalledWith(channel, ...args)
    }
  )

  it('logger.cleanupLogs defaults forceCleanup to false when called with no arguments', () => {
    globalThis.logger.cleanupLogs()

    expect(mocks.invoke).toHaveBeenCalledWith('log:cleanup', false)
  })
})

describe('api.updateMenuState', () => {
  it('sends (fire-and-forget) rather than invokes', () => {
    globalThis.api.updateMenuState({ isFavorited: true })

    expect(mocks.send).toHaveBeenCalledWith('update-menu-state', { isFavorited: true })
    expect(mocks.invoke).not.toHaveBeenCalled()
  })
})

// Methods where the callback registered by the caller IS the ipcRenderer listener -
// no unwrapping of the event/payload happens in between.
const RAW_LISTENER_CASES: Array<[string, string, (cb: () => void) => () => void]> = [
  ['api.onAddToFavorites', 'add-to-favorites', (cb) => globalThis.api.onAddToFavorites(cb)],
  ['api.onCreateCollection', 'create-collection', (cb) => globalThis.api.onCreateCollection(cb)],
  ['api.onManageCollections', 'manage-collections', (cb) => globalThis.api.onManageCollections(cb)],
  ['api.onDownloadChapter', 'download-chapter', (cb) => globalThis.api.onDownloadChapter(cb)],
  ['api.onDownloadManga', 'download-manga', (cb) => globalThis.api.onDownloadManga(cb)],
  ['api.onShowShortcuts', 'show-shortcuts', (cb) => globalThis.api.onShowShortcuts(cb)],
  [
    'api.onConnectivityToggle',
    'connectivity:toggle-offline',
    (cb) => globalThis.api.onConnectivityToggle(cb)
  ],
  [
    'progress.onIncognitoToggle',
    'progress:toggle-incognito',
    (cb) => globalThis.progress.onIncognitoToggle(cb)
  ],
  [
    'appUpdate.onUpdateChecking',
    'app-update:update-checking',
    (cb) => globalThis.appUpdate.onUpdateChecking(cb)
  ],
  [
    'appUpdate.onUpdateDownloading',
    'app-update:update-downloading',
    (cb) => globalThis.appUpdate.onUpdateDownloading(cb)
  ]
]

describe('event listeners with no payload unwrapping', () => {
  it.each(RAW_LISTENER_CASES)(
    '%s registers and unregisters the same callback reference',
    (_label, channel, register) => {
      const callback = vi.fn()

      const cleanup = register(callback)

      expect(mocks.on).toHaveBeenCalledWith(channel, callback)

      cleanup()

      expect(mocks.removeListener).toHaveBeenCalledWith(channel, callback)
    }
  )
})

// Methods where ipcRenderer.on is given a wrapper that strips the Electron event object
// and forwards only the payload to the caller's callback.
const WRAPPED_LISTENER_CASES: Array<
  [string, string, (cb: (...payload: unknown[]) => void) => () => void, unknown]
> = [
  [
    'api.onThemeChanged',
    'theme-changed',
    (cb) => registerListener(globalThis.api.onThemeChanged, cb),
    'dark'
  ],
  [
    'api.onAccentColorChanged',
    'accent-color-changed',
    (cb) => registerListener(globalThis.api.onAccentColorChanged, cb),
    '#ff6600'
  ],
  [
    'api.onNavigate',
    'navigate',
    (cb) => registerListener(globalThis.api.onNavigate, cb),
    '/library'
  ],
  [
    'api.onImportLibrary',
    'import-library',
    (cb) => registerListener(globalThis.api.onImportLibrary, cb),
    '/tmp/library.json'
  ],
  [
    'api.onImportTachiyomi',
    'import-tachiyomi',
    (cb) => registerListener(globalThis.api.onImportTachiyomi, cb),
    '/tmp/backup.tachibk'
  ],
  [
    'api.onExportLibrary',
    'export-library',
    (cb) => registerListener(globalThis.api.onExportLibrary, cb),
    '/tmp/library.json'
  ],
  [
    'api.onExportTachiyomi',
    'export-tachiyomi',
    (cb) => registerListener(globalThis.api.onExportTachiyomi, cb),
    '/tmp/backup.tachibk'
  ],
  [
    'api.onDownloadProgress',
    'download:chapter-progress',
    (cb) => registerListener(globalThis.api.onDownloadProgress, cb),
    { chapterId: 'chapter-1', progress: 50 }
  ],
  [
    'appUpdate.onUpdateAvailable',
    'app-update:update-available',
    (cb) => registerListener(globalThis.appUpdate.onUpdateAvailable, cb),
    { version: '1.2.3' }
  ],
  [
    'appUpdate.onUpdateNotAvailable',
    'app-update:update-not-available',
    (cb) => registerListener(globalThis.appUpdate.onUpdateNotAvailable, cb),
    { version: '1.2.3' }
  ],
  [
    'appUpdate.onDownloadProgress',
    'app-update:update-download-progress',
    (cb) => registerListener(globalThis.appUpdate.onDownloadProgress, cb),
    { percent: 50, transferred: 500, total: 1000, bytesPerSecond: 100 }
  ],
  [
    'appUpdate.onUpdateDownloaded',
    'app-update:update-downloaded',
    (cb) => registerListener(globalThis.appUpdate.onUpdateDownloaded, cb),
    { version: '1.2.3' }
  ],
  [
    'appUpdate.onUpdateError',
    'app-update:update-error',
    (cb) => registerListener(globalThis.appUpdate.onUpdateError, cb),
    { message: 'boom', userMessage: 'Something went wrong' }
  ]
]

describe('event listeners that unwrap a payload', () => {
  it.each(WRAPPED_LISTENER_CASES)(
    '%s forwards the payload and cleans up the exact listener it attached',
    (_label, channel, register, payload) => {
      const callback = vi.fn()

      const cleanup = register(callback)

      const registeredCall = mocks.on.mock.calls.find(
        ([registeredChannel]) => registeredChannel === channel
      )
      expect(registeredCall).toBeDefined()
      const listener = registeredCall?.[1] as (event: unknown, payload: unknown) => void

      // Simulate Electron invoking the listener the way ipcRenderer.on would
      listener(undefined, payload)
      expect(callback).toHaveBeenCalledWith(payload)

      cleanup()

      // Cleanup must remove the SAME listener that was attached - passing a different
      // function reference to removeListener is a silent no-op that leaks the listener
      expect(mocks.removeListener).toHaveBeenCalledWith(channel, listener)
    }
  )
})

describe('context isolation', () => {
  const EXPECTED_GLOBAL_NAMES = [
    'electron',
    'api',
    'fileSystem',
    'mangadex',
    'progress',
    'reader',
    'library',
    'collections',
    'mihon',
    'settings',
    'dexreader',
    'downloads',
    'storage',
    'appUpdate',
    'logger',
    'searchPresets',
    'gatekeeper',
    'snapshots',
    'readHistory'
  ]

  afterEach(() => {
    delete (process as unknown as { contextIsolated?: boolean }).contextIsolated
  })

  it('exposes every API namespace via contextBridge under exactly its global name', async () => {
    ;(process as unknown as { contextIsolated?: boolean }).contextIsolated = true
    vi.resetModules()

    await import('./index')

    const exposedNames = mocks.exposeInMainWorld.mock.calls.map(([name]) => name)

    expect([...exposedNames].sort()).toEqual([...EXPECTED_GLOBAL_NAMES].sort())
  })

  it('does not throw while exposing the API surface', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    ;(process as unknown as { contextIsolated?: boolean }).contextIsolated = true
    vi.resetModules()

    await import('./index')

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
