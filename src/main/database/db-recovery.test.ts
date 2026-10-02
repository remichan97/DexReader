vi.mock('electron', () => ({
  app: { getVersion: vi.fn(() => '1.14.0') },
  clipboard: { writeText: vi.fn() },
  dialog: { showMessageBox: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

vi.mock('./db-connection', () => ({
  databaseConnection: { getDbFilePath: vi.fn(() => '/mock/appdata/dexreader.db'), init: vi.fn() }
}))

vi.mock('../filesystem/secure-fs', () => ({
  secureFs: { isExists: vi.fn(), rename: vi.fn() }
}))

vi.mock('../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../i18n/i18n.config', () => ({
  default: { t: vi.fn((key: string) => key) }
}))

import { recoverFromDatabaseOpenFailure, handleMigrationFailure } from './db-recovery'
import { app, clipboard, dialog, shell } from 'electron'
import { databaseConnection } from './db-connection'
import { secureFs } from '../filesystem/secure-fs'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('recoverFromDatabaseOpenFailure', () => {
  it('shows the open-failure dialog and returns false without touching the database when the user quits', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 1 } as never)

    const result = await recoverFromDatabaseOpenFailure(
      new Error('database disk image is malformed')
    )

    expect(result).toBe(false)
    expect(secureFs.rename).not.toHaveBeenCalled()
    expect(databaseConnection.init).not.toHaveBeenCalled()
  })

  it('backs up only the sidecar files that actually exist, then reopens the database', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 0 } as never)
    vi.mocked(secureFs.isExists).mockImplementation(
      async (filePath: string) => filePath.endsWith('.db') || filePath.endsWith('-wal')
    )
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const result = await recoverFromDatabaseOpenFailure(new Error('malformed'))

    expect(result).toBe(true)
    expect(secureFs.rename).toHaveBeenCalledWith(
      '/mock/appdata/dexreader.db',
      expect.stringContaining('/mock/appdata/dexreader.db.corrupt-')
    )
    expect(secureFs.rename).toHaveBeenCalledWith(
      '/mock/appdata/dexreader.db-wal',
      expect.stringContaining('/mock/appdata/dexreader.db-wal.corrupt-')
    )
    expect(secureFs.rename).not.toHaveBeenCalledWith(
      '/mock/appdata/dexreader.db-shm',
      expect.anything()
    )
    expect(databaseConnection.init).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('shows no sidecar backups and still reopens when none of the db files exist', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 0 } as never)
    vi.mocked(secureFs.isExists).mockResolvedValue(false)

    const result = await recoverFromDatabaseOpenFailure(new Error('malformed'))

    expect(result).toBe(true)
    expect(secureFs.rename).not.toHaveBeenCalled()
    expect(databaseConnection.init).toHaveBeenCalled()
  })

  it('shows a second dialog and returns false when re-initialising the database throws', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 0 } as never)
    vi.mocked(secureFs.isExists).mockResolvedValue(false)
    vi.mocked(databaseConnection.init).mockImplementation(() => {
      throw new Error('still corrupt')
    })

    const result = await recoverFromDatabaseOpenFailure(new Error('malformed'))

    expect(result).toBe(false)
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(2)
  })

  it('returns false when backing up a sidecar file throws', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 0 } as never)
    vi.mocked(secureFs.isExists).mockResolvedValue(true)
    vi.mocked(secureFs.rename).mockRejectedValue(new Error('EBUSY'))

    const result = await recoverFromDatabaseOpenFailure(new Error('malformed'))

    expect(result).toBe(false)
    expect(databaseConnection.init).not.toHaveBeenCalled()
  })
})

describe('handleMigrationFailure', () => {
  it('shows the migration-failure dialog built from the real error and app/platform info', async () => {
    vi.mocked(dialog.showMessageBox).mockResolvedValue({ response: 2 } as never)

    await handleMigrationFailure(new Error('column already exists'))

    expect(app.getVersion).toHaveBeenCalled()
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1)
  })

  it('copies diagnostics to the clipboard and keeps the dialog open when that button is chosen', async () => {
    vi.mocked(dialog.showMessageBox)
      .mockResolvedValueOnce({ response: 0 } as never)
      .mockResolvedValueOnce({ response: 2 } as never)

    await handleMigrationFailure(new Error('column already exists'))

    expect(clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('column already exists')
    )
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(2)
    expect(shell.openExternal).not.toHaveBeenCalled()
  })

  it('opens the releases page and keeps the dialog open when that button is chosen', async () => {
    vi.mocked(dialog.showMessageBox)
      .mockResolvedValueOnce({ response: 1 } as never)
      .mockResolvedValueOnce({ response: 2 } as never)

    await handleMigrationFailure(new Error('column already exists'))

    expect(shell.openExternal).toHaveBeenCalledWith(
      'https://github.com/remichan97/dexreader/releases'
    )
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(2)
  })

  it('normalises a non-Error value into the diagnostic text', async () => {
    vi.mocked(dialog.showMessageBox)
      .mockResolvedValueOnce({ response: 0 } as never)
      .mockResolvedValueOnce({ response: 2 } as never)

    await handleMigrationFailure('a plain string failure')

    expect(clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('a plain string failure')
    )
  })
})
