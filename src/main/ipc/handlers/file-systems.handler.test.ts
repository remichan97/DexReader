import { ipcMain, IpcMainInvokeEvent, BrowserWindow, dialog, shell } from 'electron'
import { getAppDataPath, getDownloadsPath } from '../../filesystem/path-validator'
import { secureFs } from '../../filesystem/secure-fs'
import { settingsManager } from '../../settings/settings-manager'
import { registerFileSystemHandlers } from './file-systems.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
  shell: { openPath: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../filesystem/path-validator', () => ({
  getAppDataPath: vi.fn(() => '/appdata'),
  getDownloadsPath: vi.fn(() => '/appdata/downloads')
}))

vi.mock('../../filesystem/secure-fs', () => ({
  secureFs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copyFile: vi.fn(),
    appendFile: vi.fn(),
    rename: vi.fn(),
    mkdir: vi.fn(),
    deleteFile: vi.fn(),
    deleteDir: vi.fn(),
    isExists: vi.fn(),
    stat: vi.fn(),
    readDir: vi.fn()
  }
}))

vi.mock('../../settings/settings-manager', () => ({
  settingsManager: { validateDownloadsPath: vi.fn() }
}))

type RegisteredHandler = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<{ success: boolean; data?: unknown; error?: unknown }>

function getRegisteredHandler(channel: string): RegisteredHandler {
  const call = vi
    .mocked(ipcMain.handle)
    .mock.calls.find(([registeredChannel]) => registeredChannel === channel)
  if (!call) {
    throw new Error(`No handler registered for channel "${channel}"`)
  }
  return call[1] as RegisteredHandler
}

const EVENT = {} as IpcMainInvokeEvent
const FAKE_WINDOW = {} as BrowserWindow
const getWindow = (): BrowserWindow => FAKE_WINDOW

describe('file-systems.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAppDataPath).mockReturnValue('/appdata')
    vi.mocked(getDownloadsPath).mockReturnValue('/appdata/downloads')
    registerFileSystemHandlers(getWindow)
  })

  describe('fs:read-file', () => {
    it('validates the path and forwards it with encoding to secureFs.readFile', async () => {
      vi.mocked(secureFs.readFile).mockResolvedValue('file contents')

      await expect(
        getRegisteredHandler('fs:read-file')(EVENT, '/appdata/a.json', 'utf-8')
      ).resolves.toEqual({ success: true, data: 'file contents' })
      expect(secureFs.readFile).toHaveBeenCalledWith('/appdata/a.json', 'utf-8')
    })

    it('rejects a non-string filePath before touching secureFs', async () => {
      const response = await getRegisteredHandler('fs:read-file')(EVENT, 42, 'utf-8')

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('filePath') })
      })
      expect(secureFs.readFile).not.toHaveBeenCalled()
    })

    it('rejects an unsupported encoding before touching secureFs', async () => {
      const response = await getRegisteredHandler('fs:read-file')(
        EVENT,
        '/appdata/a.json',
        'utf-42'
      )

      expect(response.success).toBe(false)
      expect(secureFs.readFile).not.toHaveBeenCalled()
    })
  })

  describe('fs:write-file', () => {
    it('validates the path and writes via secureFs.writeFile, returning true', async () => {
      await expect(
        getRegisteredHandler('fs:write-file')(EVENT, '/appdata/a.json', 'data', 'utf-8')
      ).resolves.toEqual({ success: true, data: true })
      expect(secureFs.writeFile).toHaveBeenCalledWith('/appdata/a.json', 'data')
    })
  })

  describe('fs:copy-file', () => {
    it('validates both paths and copies via secureFs.copyFile, returning true', async () => {
      await expect(
        getRegisteredHandler('fs:copy-file')(EVENT, '/appdata/a.json', '/appdata/b.json')
      ).resolves.toEqual({ success: true, data: true })
      expect(secureFs.copyFile).toHaveBeenCalledWith('/appdata/a.json', '/appdata/b.json')
    })
  })

  describe('fs:append-file', () => {
    it('validates the path and appends via secureFs.appendFile, returning true', async () => {
      await expect(
        getRegisteredHandler('fs:append-file')(EVENT, '/appdata/a.log', 'more')
      ).resolves.toEqual({ success: true, data: true })
      expect(secureFs.appendFile).toHaveBeenCalledWith('/appdata/a.log', 'more')
    })
  })

  describe('fs:rename', () => {
    it('validates both paths and renames via secureFs.rename, returning true', async () => {
      await expect(
        getRegisteredHandler('fs:rename')(EVENT, '/appdata/a.json', '/appdata/b.json')
      ).resolves.toEqual({ success: true, data: true })
      expect(secureFs.rename).toHaveBeenCalledWith('/appdata/a.json', '/appdata/b.json')
    })
  })

  describe('fs:is-exists', () => {
    it('validates the path and returns secureFs.isExists() unchanged', async () => {
      vi.mocked(secureFs.isExists).mockResolvedValue(false)

      await expect(getRegisteredHandler('fs:is-exists')(EVENT, '/appdata/a.json')).resolves.toEqual(
        { success: true, data: false }
      )
      expect(secureFs.isExists).toHaveBeenCalledWith('/appdata/a.json')
    })
  })

  describe('fs:mkdir', () => {
    it('validates the path and creates via secureFs.mkdir, returning true', async () => {
      await expect(getRegisteredHandler('fs:mkdir')(EVENT, '/appdata/dir')).resolves.toEqual({
        success: true,
        data: true
      })
      expect(secureFs.mkdir).toHaveBeenCalledWith('/appdata/dir')
    })
  })

  describe('fs:unlink', () => {
    it('validates the path and deletes via secureFs.deleteFile, returning true', async () => {
      await expect(getRegisteredHandler('fs:unlink')(EVENT, '/appdata/a.json')).resolves.toEqual({
        success: true,
        data: true
      })
      expect(secureFs.deleteFile).toHaveBeenCalledWith('/appdata/a.json')
    })
  })

  describe('fs:rmdir', () => {
    it('validates the path and deletes via secureFs.deleteDir, returning true', async () => {
      await expect(getRegisteredHandler('fs:rmdir')(EVENT, '/appdata/dir')).resolves.toEqual({
        success: true,
        data: true
      })
      expect(secureFs.deleteDir).toHaveBeenCalledWith('/appdata/dir')
    })
  })

  describe('fs:readdir', () => {
    it('validates the path and returns secureFs.readDir() unchanged', async () => {
      vi.mocked(secureFs.readDir).mockResolvedValue(['a.json', 'b.json'])

      await expect(getRegisteredHandler('fs:readdir')(EVENT, '/appdata/dir')).resolves.toEqual({
        success: true,
        data: ['a.json', 'b.json']
      })
      expect(secureFs.readDir).toHaveBeenCalledWith('/appdata/dir')
    })
  })

  describe('fs:stat', () => {
    it('serialises the Stats object into plain isFile/isDirectory/size/created/modified fields', async () => {
      const birthtime = new Date('2026-01-01T00:00:00.000Z')
      const mtime = new Date('2026-01-02T00:00:00.000Z')
      vi.mocked(secureFs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        birthtime,
        mtime
      } as unknown as Awaited<ReturnType<typeof secureFs.stat>>)

      await expect(getRegisteredHandler('fs:stat')(EVENT, '/appdata/a.json')).resolves.toEqual({
        success: true,
        data: {
          isFile: true,
          isDirectory: false,
          size: 1024,
          created: birthtime.toISOString(),
          modified: mtime.toISOString()
        }
      })
    })
  })

  describe('fs:get-allowed-paths', () => {
    it('returns the appData and downloads roots', async () => {
      await expect(getRegisteredHandler('fs:get-allowed-paths')(EVENT)).resolves.toEqual({
        success: true,
        data: { appData: '/appdata', downloads: '/appdata/downloads' }
      })
    })
  })

  describe('fs:select-downloads-folder', () => {
    it('returns cancelled: true when the user dismisses the dialog', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] })

      await expect(getRegisteredHandler('fs:select-downloads-folder')(EVENT)).resolves.toEqual({
        success: true,
        data: { cancelled: true, filePath: undefined }
      })
      expect(settingsManager.validateDownloadsPath).not.toHaveBeenCalled()
    })

    it('returns cancelled: true when no folder was selected', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: false, filePaths: [] })

      await expect(getRegisteredHandler('fs:select-downloads-folder')(EVENT)).resolves.toEqual({
        success: true,
        data: { cancelled: true, filePath: undefined }
      })
    })

    it('validates and returns the selected folder without persisting it', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/new/downloads']
      })
      vi.mocked(settingsManager.validateDownloadsPath).mockResolvedValue('/new/downloads')

      await expect(getRegisteredHandler('fs:select-downloads-folder')(EVENT)).resolves.toEqual({
        success: true,
        data: { cancelled: false, filePath: '/new/downloads' }
      })
      expect(settingsManager.validateDownloadsPath).toHaveBeenCalledWith('/new/downloads')
    })

    it('wraps a validation failure with a descriptive message', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/not/writable']
      })
      vi.mocked(settingsManager.validateDownloadsPath).mockRejectedValue(new Error('not writable'))

      const response = await getRegisteredHandler('fs:select-downloads-folder')(EVENT)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Unable to set downloads folder: not writable'
        })
      })
    })
  })

  describe('fs:open-downloads-folder', () => {
    it('opens the downloads path in the system file explorer and returns true', async () => {
      await expect(getRegisteredHandler('fs:open-downloads-folder')(EVENT)).resolves.toEqual({
        success: true,
        data: true
      })
      expect(shell.openPath).toHaveBeenCalledWith('/appdata/downloads')
    })
  })
})
