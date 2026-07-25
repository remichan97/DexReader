import type { AppSettings } from './entities/app-settings.entity'
import {
  getDownloadsPath,
  updateDownloadsPath,
  validateDirectoryPath
} from '../filesystem/path-validator'

vi.mock('../filesystem/path-validator', () => ({
  getDownloadsPath: vi.fn(() => '/mock/default/downloads'),
  updateDownloadsPath: vi.fn(),
  validateDirectoryPath: vi.fn()
}))

vi.mock('../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../database/repositories/reader-settings.repo', () => ({
  readerSettingsRepo: { getMangaOverride: vi.fn() }
}))

vi.mock('../api/utils/memory-cache.util', () => ({
  memoryCacheUtil: { getDynamicTiers: vi.fn(), getMemoryLimit: vi.fn() }
}))

class MockElectronStore<T extends object> {
  public store: T

  public constructor(options: { defaults: T }) {
    this.store = options.defaults
  }

  public clear(): void {
    this.store = {} as T
  }

  public openInEditor(): Promise<void> {
    return Promise.resolve()
  }
}

vi.mock('electron-store', () => ({
  default: MockElectronStore
}))

describe('SettingsManager', () => {
  let settingsManager: typeof import('./settings-manager').settingsManager
  let baseline: AppSettings

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(validateDirectoryPath).mockResolvedValue(undefined)
    vi.mocked(getDownloadsPath).mockReturnValue('/mock/default/downloads')

    // settingsManager is an exported singleton, so each test needs a fresh module
    // instance to avoid state leaking between tests.
    vi.resetModules()
    ;({ settingsManager } = await import('./settings-manager'))
    baseline = settingsManager.load()
  })

  describe('saveAll', () => {
    it('persists settings unchanged when no downloads path is provided', async () => {
      const newSettings: AppSettings = { ...baseline }

      await settingsManager.saveAll(newSettings)

      expect(settingsManager.load().downloads.downloadPath).toBeUndefined()
      expect(updateDownloadsPath).not.toHaveBeenCalled()
    })

    it('rejects and persists nothing when the downloads path is a system directory', async () => {
      const newSettings: AppSettings = {
        ...baseline,
        downloads: { ...baseline.downloads, downloadPath: String.raw`C:\Windows\System32` }
      }

      await expect(settingsManager.saveAll(newSettings)).rejects.toThrow(/system director/i)

      // The rejected path must never have made it into the persisted store, even though
      // the rest of newSettings was otherwise valid - the whole call must fail, not just
      // the downloads section.
      expect(settingsManager.load().downloads.downloadPath).toBeUndefined()
      expect(updateDownloadsPath).not.toHaveBeenCalled()
    })

    it('rejects and persists nothing when the downloads path fails existence validation', async () => {
      vi.mocked(validateDirectoryPath).mockRejectedValue(new Error('ENOENT'))

      const newSettings: AppSettings = {
        ...baseline,
        downloads: { ...baseline.downloads, downloadPath: String.raw`D:\Nonexistent` }
      }

      await expect(settingsManager.saveAll(newSettings)).rejects.toThrow()

      expect(settingsManager.load().downloads.downloadPath).toBeUndefined()
      expect(updateDownloadsPath).not.toHaveBeenCalled()
    })

    it('sanitizes control characters, persists the sanitized path, and applies it in-memory', async () => {
      const dirtyPath = 'D:\\MyDownloads	'
      const newSettings: AppSettings = {
        ...baseline,
        downloads: { ...baseline.downloads, downloadPath: dirtyPath }
      }

      await settingsManager.saveAll(newSettings)

      expect(settingsManager.load().downloads.downloadPath).toBe('D:\\MyDownloads')
      expect(updateDownloadsPath).toHaveBeenCalledWith('D:\\MyDownloads')
    })
  })

  describe('initializeDownloadsPath', () => {
    it('applies the persisted downloads path when it passes validation', async () => {
      settingsManager.save({
        ...baseline,
        downloads: { ...baseline.downloads, downloadPath: String.raw`D:\MyDownloads` }
      })

      await settingsManager.initializeDownloadsPath()

      expect(updateDownloadsPath).toHaveBeenCalledWith(String.raw`D:\MyDownloads`)
    })

    it('falls back to the default and clears the stored path for a hand-edited system-directory path', async () => {
      // Simulates a user manually editing settings.json (via the "open settings file"
      // feature) to point downloads at a system directory, bypassing the UI entirely.
      // This is the regression case for initializeDownloadsPath: it used to only check
      // existence (validateDirectoryPath), not the system-directory blocklist.
      settingsManager.save({
        ...baseline,
        downloads: { ...baseline.downloads, downloadPath: String.raw`C:\Windows` }
      })

      await expect(settingsManager.initializeDownloadsPath()).resolves.toBeUndefined()

      expect(updateDownloadsPath).not.toHaveBeenCalled()
      expect(settingsManager.load().downloads.downloadPath).toBeUndefined()
    })
  })
})
