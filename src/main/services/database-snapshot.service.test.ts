import type { Stats } from 'node:fs'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'
import { dateToUnixTimestamp } from '../utils/timestamps.util'

vi.mock('../filesystem/path-validator', () => ({
  getSnapshotPath: vi.fn(() => '/mock/appdata/snapshots'),
  validatePath: vi.fn(async (targetPath: string) => targetPath)
}))

vi.mock('../filesystem/secure-fs', () => ({
  secureFs: {
    readDir: vi.fn(),
    stat: vi.fn(),
    deleteFile: vi.fn(),
    copyFile: vi.fn()
  }
}))

vi.mock('../database/db-connection', () => ({
  databaseConnection: {
    backupDatabase: vi.fn(),
    close: vi.fn(),
    init: vi.fn(),
    getDbFilePath: vi.fn(() => '/mock/appdata/dexreader.db')
  }
}))

vi.mock('../settings/settings-manager', () => ({
  settingsManager: {
    getByPath: vi.fn()
  }
}))

vi.mock('./logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('electron', () => ({
  app: { relaunch: vi.fn(), exit: vi.fn() }
}))

import { databaseSnapshotService } from './database-snapshot.service'
import { secureFs } from '../filesystem/secure-fs'
import { databaseConnection } from '../database/db-connection'
import { settingsManager } from '../settings/settings-manager'
import { validatePath } from '../filesystem/path-validator'
import { app } from 'electron'

function mockStats(overrides: Partial<Stats> = {}): Stats {
  return { isFile: () => true, size: 1024, ...overrides } as Stats
}

// settingsManager.getByPath is called with ('snapshot', 'isEnabled' | 'intervalInHours' | 'maxSnapshotsCount').
// Route each path to its own controllable mock value so tests can override just the field they care about.
function mockSnapshotSettings(overrides: {
  isEnabled?: boolean
  intervalInHours?: number
  maxSnapshotsCount?: number
}): void {
  const values: Record<string, unknown> = {
    isEnabled: overrides.isEnabled ?? true,
    intervalInHours: overrides.intervalInHours,
    maxSnapshotsCount: overrides.maxSnapshotsCount
  }
  vi.mocked(settingsManager.getByPath).mockImplementation(
    (_section: string, path?: string) => values[path as string]
  )
}

describe('DatabaseSnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSnapshotSettings({ isEnabled: true })
    // Sane defaults so every `.catch(...)` call site in the service has a real promise to
    // chain onto unless a test deliberately overrides one of these to simulate a failure.
    vi.mocked(secureFs.copyFile).mockResolvedValue(undefined)
    vi.mocked(secureFs.deleteFile).mockResolvedValue(undefined)
  })

  describe('listSnapshots', () => {
    it('returns an empty list without touching the filesystem when snapshots are disabled', async () => {
      mockSnapshotSettings({ isEnabled: false })

      const result = await databaseSnapshotService.listSnapshots()

      expect(result).toEqual([])
      expect(secureFs.readDir).not.toHaveBeenCalled()
    })

    it('parses both auto and manual filenames into snapshot contracts', async () => {
      vi.mocked(secureFs.readDir).mockResolvedValue([
        'dexreader-1700000000_auto.db',
        'dexreader-1700003600_manual.db'
      ])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ size: 2048 }))

      const result = await databaseSnapshotService.listSnapshots()

      expect(result).toEqual([
        {
          fileName: 'dexreader-1700000000_auto.db',
          createdAt: new Date(1700000000 * 1000),
          sizeInBytes: 2048,
          trigger: SnapshotTrigger.Auto
        },
        {
          fileName: 'dexreader-1700003600_manual.db',
          createdAt: new Date(1700003600 * 1000),
          sizeInBytes: 2048,
          trigger: SnapshotTrigger.Manual
        }
      ])
    })

    it('ignores files that do not match the snapshot filename pattern', async () => {
      vi.mocked(secureFs.readDir).mockResolvedValue([
        'dexreader-1700000000_auto.db',
        'readme.txt',
        'dexreader-not-a-timestamp_auto.db',
        '.DS_Store'
      ])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      const result = await databaseSnapshotService.listSnapshots()

      expect(result).toHaveLength(1)
      expect(result[0].fileName).toBe('dexreader-1700000000_auto.db')
    })

    it('returns an empty list when the snapshots directory does not exist yet', async () => {
      vi.mocked(secureFs.readDir).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      )

      const result = await databaseSnapshotService.listSnapshots()

      expect(result).toEqual([])
    })

    it('wraps and rethrows any other filesystem error', async () => {
      vi.mocked(secureFs.readDir).mockRejectedValue(new Error('permission denied'))

      await expect(databaseSnapshotService.listSnapshots()).rejects.toThrow(
        /failed to list snapshots/i
      )
    })
  })

  describe('createSnapshot', () => {
    beforeEach(() => {
      // Keep pruneOldSnapshots' internal listSnapshots() call a no-op unless a test overrides it.
      vi.mocked(secureFs.readDir).mockResolvedValue([])
    })

    it('does nothing when snapshots are disabled', async () => {
      mockSnapshotSettings({ isEnabled: false })

      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Manual)

      expect(databaseConnection.backupDatabase).not.toHaveBeenCalled()
    })

    it('backs up the live database into the snapshots directory using the trigger in the filename', async () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
      const expectedTimestamp = dateToUnixTimestamp(new Date('2026-01-01T00:00:00.000Z'))

      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Manual)

      expect(databaseConnection.backupDatabase).toHaveBeenCalledWith(
        `/mock/appdata/snapshots/dexreader-${expectedTimestamp}_manual.db`
      )
      vi.useRealTimers()
    })

    it('validates the snapshots directory before backing up', async () => {
      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Auto)

      expect(validatePath).toHaveBeenCalledWith('/mock/appdata/snapshots')
    })

    it('wraps and rethrows a failure from the backup itself', async () => {
      vi.mocked(databaseConnection.backupDatabase).mockRejectedValue(new Error('disk full'))

      await expect(databaseSnapshotService.createSnapshot(SnapshotTrigger.Auto)).rejects.toThrow(
        /failed to create snapshot/i
      )
    })
  })

  describe('pruneOldSnapshots (via createSnapshot)', () => {
    beforeEach(() => {
      vi.mocked(databaseConnection.backupDatabase).mockResolvedValue(undefined)
    })

    it('deletes the oldest snapshots once the count exceeds maxSnapshotsCount', async () => {
      mockSnapshotSettings({ maxSnapshotsCount: 2 })
      vi.mocked(secureFs.readDir).mockResolvedValue([
        'dexreader-1000_auto.db',
        'dexreader-2000_auto.db',
        'dexreader-3000_manual.db'
      ])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Manual)

      // Only the single oldest snapshot should be pruned to get back down to the cap of 2.
      expect(secureFs.deleteFile).toHaveBeenCalledTimes(1)
      expect(secureFs.deleteFile).toHaveBeenCalledWith(
        '/mock/appdata/snapshots/dexreader-1000_auto.db'
      )
    })

    it('falls back to a default cap of 5 when maxSnapshotsCount is unset', async () => {
      mockSnapshotSettings({ maxSnapshotsCount: undefined })
      vi.mocked(secureFs.readDir).mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => `dexreader-${1000 * (i + 1)}_auto.db`)
      )
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Auto)

      expect(secureFs.deleteFile).not.toHaveBeenCalled()
    })

    it('does not delete anything when the count is within the cap', async () => {
      mockSnapshotSettings({ maxSnapshotsCount: 5 })
      vi.mocked(secureFs.readDir).mockResolvedValue(['dexreader-1000_auto.db'])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshot(SnapshotTrigger.Auto)

      expect(secureFs.deleteFile).not.toHaveBeenCalled()
    })
  })

  describe('createSnapshotOnAppStartup', () => {
    it('does nothing when snapshots are disabled', async () => {
      mockSnapshotSettings({ isEnabled: false })

      await databaseSnapshotService.createSnapshotOnAppStartup()

      expect(secureFs.readDir).not.toHaveBeenCalled()
      expect(databaseConnection.backupDatabase).not.toHaveBeenCalled()
    })

    it('creates a snapshot when none exist yet', async () => {
      vi.mocked(secureFs.readDir).mockResolvedValue([])

      await databaseSnapshotService.createSnapshotOnAppStartup()

      expect(databaseConnection.backupDatabase).toHaveBeenCalledTimes(1)
    })

    it('skips creating a snapshot when the last automatic one is within the interval', async () => {
      mockSnapshotSettings({ intervalInHours: 6 })
      const oneHourAgo = dateToUnixTimestamp(new Date(Date.now() - 60 * 60 * 1000))
      vi.mocked(secureFs.readDir).mockResolvedValue([`dexreader-${oneHourAgo}_auto.db`])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshotOnAppStartup()

      expect(databaseConnection.backupDatabase).not.toHaveBeenCalled()
    })

    it('creates a snapshot when the last automatic one is older than the interval', async () => {
      mockSnapshotSettings({ intervalInHours: 6 })
      const sevenHoursAgo = dateToUnixTimestamp(new Date(Date.now() - 7 * 60 * 60 * 1000))
      vi.mocked(secureFs.readDir).mockResolvedValue([`dexreader-${sevenHoursAgo}_auto.db`])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshotOnAppStartup()

      expect(databaseConnection.backupDatabase).toHaveBeenCalledTimes(1)
    })

    it('ignores manual snapshots when checking how long it has been since the last automatic one', async () => {
      mockSnapshotSettings({ intervalInHours: 6 })
      // Only a very recent MANUAL snapshot exists - there has never been an automatic one,
      // so this must still count as "due" (falls back to Infinity hours since last auto).
      const justNow = dateToUnixTimestamp(new Date())
      vi.mocked(secureFs.readDir).mockResolvedValue([`dexreader-${justNow}_manual.db`])
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats())

      await databaseSnapshotService.createSnapshotOnAppStartup()

      expect(databaseConnection.backupDatabase).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteSnapshot', () => {
    it('does nothing when snapshots are disabled', async () => {
      mockSnapshotSettings({ isEnabled: false })

      await databaseSnapshotService.deleteSnapshot('dexreader-1000_auto.db')

      expect(secureFs.stat).not.toHaveBeenCalled()
    })

    it.each([
      ['parent-directory traversal', '../dexreader-1000_auto.db'],
      ['a nested path separator', 'sub/dexreader-1000_auto.db'],
      ['an absolute path', '/etc/passwd']
    ])('rejects a filename containing %s', async (_label, unsafeName) => {
      await expect(databaseSnapshotService.deleteSnapshot(unsafeName)).rejects.toThrow(
        /unusual characters/i
      )
      expect(secureFs.stat).not.toHaveBeenCalled()
    })

    it('deletes the snapshot file once it is confirmed to exist', async () => {
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ isFile: () => true }))

      await databaseSnapshotService.deleteSnapshot('dexreader-1000_auto.db')

      expect(secureFs.deleteFile).toHaveBeenCalledWith(
        '/mock/appdata/snapshots/dexreader-1000_auto.db'
      )
    })

    it('refuses to delete a path that is not a regular file', async () => {
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ isFile: () => false }))

      await expect(
        databaseSnapshotService.deleteSnapshot('dexreader-1000_auto.db')
      ).rejects.toThrow()
      expect(secureFs.deleteFile).not.toHaveBeenCalled()
    })
  })

  describe('restoreSnapshot', () => {
    it('does nothing when snapshots are disabled', async () => {
      mockSnapshotSettings({ isEnabled: false })

      await databaseSnapshotService.restoreSnapshot('dexreader-1000_auto.db')

      expect(databaseConnection.close).not.toHaveBeenCalled()
    })

    it.each([
      ['parent-directory traversal', '../dexreader-1000_auto.db'],
      ['a nested path separator', 'sub/dexreader-1000_auto.db'],
      ['an absolute path', '/etc/passwd']
    ])(
      'rejects a filename containing %s before touching the database',
      async (_label, unsafeName) => {
        await expect(databaseSnapshotService.restoreSnapshot(unsafeName)).rejects.toThrow(
          /unusual characters/i
        )
        expect(databaseConnection.close).not.toHaveBeenCalled()
      }
    )

    it('swaps in the snapshot and relaunches the app on success', async () => {
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ isFile: () => true }))

      await databaseSnapshotService.restoreSnapshot('dexreader-1000_auto.db')

      expect(databaseConnection.close).toHaveBeenCalled()
      // Live DB backed up before the swap, in case the copy below fails.
      expect(secureFs.copyFile).toHaveBeenCalledWith(
        '/mock/appdata/dexreader.db',
        '/mock/appdata/dexreader.db.backup'
      )
      // Snapshot copied over the live DB path.
      expect(secureFs.copyFile).toHaveBeenCalledWith(
        '/mock/appdata/snapshots/dexreader-1000_auto.db',
        '/mock/appdata/dexreader.db'
      )
      expect(app.relaunch).toHaveBeenCalled()
      expect(app.exit).toHaveBeenCalledWith(0)
    })

    it('restores the pre-swap backup and reopens the database if the swap fails', async () => {
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ isFile: () => true }))
      // Fail specifically on the snapshot -> live-db copy (the second copyFile call).
      vi.mocked(secureFs.copyFile).mockImplementation(async (_src, dest) => {
        if (dest === '/mock/appdata/dexreader.db.backup') return undefined
        throw new Error('disk error mid-copy')
      })

      await expect(
        databaseSnapshotService.restoreSnapshot('dexreader-1000_auto.db')
      ).rejects.toThrow(/failed to restore snapshot/i)

      expect(secureFs.copyFile).toHaveBeenCalledWith(
        '/mock/appdata/dexreader.db.backup',
        '/mock/appdata/dexreader.db'
      )
      expect(databaseConnection.init).toHaveBeenCalled()
      expect(app.relaunch).not.toHaveBeenCalled()
    })

    it('refuses to restore a path that is not a regular file', async () => {
      vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ isFile: () => false }))

      await expect(
        databaseSnapshotService.restoreSnapshot('dexreader-1000_auto.db')
      ).rejects.toThrow(/failed to restore snapshot/i)
      expect(databaseConnection.close).not.toHaveBeenCalled()
    })
  })
})
