import { app, ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { cleanupRepo } from '../../database/repositories/cleanup.repo'
import { settingsManager } from '../../settings/settings-manager'
import { gatekeeperService } from '../../services/gatekeeper.service'
import { isSettingsSectionKey, validateSection } from '../../settings/validators/section.validator'
import { registerAppSettingsHandlers } from './app-settings.handler'
import type { ImageProxy } from '../../api/proxy/image.proxy'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  app: { relaunch: vi.fn(), exit: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/cleanup.repo', () => ({
  cleanupRepo: { clearAllData: vi.fn() }
}))

vi.mock('../../settings/settings-manager', () => ({
  settingsManager: {
    load: vi.fn(),
    getByDynamicPath: vi.fn(),
    openSettingsFile: vi.fn(),
    reset: vi.fn(),
    getMemoryTierInfo: vi.fn(),
    updateSection: vi.fn()
  }
}))

vi.mock('../../services/gatekeeper.service', () => ({
  gatekeeperService: { reset: vi.fn() }
}))

vi.mock('../../settings/validators/section.validator', () => ({
  isSettingsSectionKey: vi.fn(),
  validateSection: vi.fn()
}))

type RegisteredHandler = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<{ success: boolean; data?: unknown; error?: unknown }>

// Uses the LAST matching registration - some tests below call
// registerAppSettingsHandlers() a second time (with an imageProxy) to exercise that
// branch, which re-registers every channel on top of the beforeEach registration.
function getRegisteredHandler(channel: string): RegisteredHandler {
  const call = vi
    .mocked(ipcMain.handle)
    .mock.calls.findLast(([registeredChannel]) => registeredChannel === channel)
  if (!call) {
    throw new Error(`No handler registered for channel "${channel}"`)
  }
  return call[1] as RegisteredHandler
}

const EVENT = {} as IpcMainInvokeEvent

describe('app-settings.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(is as { dev: boolean }).dev = false
    // clearAllMocks() resets call history but not mock implementations, so a
    // mockRejectedValue set by one test would otherwise leak into the next
    vi.mocked(shell.openExternal).mockResolvedValue(undefined)
    registerAppSettingsHandlers()
  })

  describe('settings:load', () => {
    it('returns settingsManager.load() unchanged', async () => {
      vi.mocked(settingsManager.load).mockReturnValue({ appearance: {} } as never)

      await expect(getRegisteredHandler('settings:load')(EVENT)).resolves.toEqual({
        success: true,
        data: { appearance: {} }
      })
    })
  })

  describe('settings:get', () => {
    it('forwards a valid section and path to settingsManager.getByDynamicPath', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)
      vi.mocked(settingsManager.getByDynamicPath).mockReturnValue('dark')

      await expect(
        getRegisteredHandler('settings:get')(EVENT, 'appearance', 'theme')
      ).resolves.toEqual({ success: true, data: 'dark' })
      expect(settingsManager.getByDynamicPath).toHaveBeenCalledWith('appearance', 'theme')
    })

    it('rejects a non-string section', async () => {
      const response = await getRegisteredHandler('settings:get')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(settingsManager.getByDynamicPath).not.toHaveBeenCalled()
    })

    it('rejects an unknown section', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(false)

      const response = await getRegisteredHandler('settings:get')(EVENT, 'bogus')

      expect(response.success).toBe(false)
      expect(settingsManager.getByDynamicPath).not.toHaveBeenCalled()
    })

    it('rejects a non-string path', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)

      const response = await getRegisteredHandler('settings:get')(EVENT, 'appearance', 42)

      expect(response.success).toBe(false)
      expect(settingsManager.getByDynamicPath).not.toHaveBeenCalled()
    })
  })

  describe('settings:open-settings-file', () => {
    it('calls settingsManager.openSettingsFile()', async () => {
      await getRegisteredHandler('settings:open-settings-file')(EVENT)

      expect(settingsManager.openSettingsFile).toHaveBeenCalled()
    })
  })

  describe('settings:reset-to-defaults', () => {
    it('resets both settingsManager and gatekeeperService, returning true', async () => {
      await expect(getRegisteredHandler('settings:reset-to-defaults')(EVENT)).resolves.toEqual({
        success: true,
        data: true
      })
      expect(settingsManager.reset).toHaveBeenCalled()
      expect(gatekeeperService.reset).toHaveBeenCalled()
    })
  })

  describe('settings:clear-all', () => {
    it('clears all data, resets settings/gatekeeper, relaunches and exits in production', async () => {
      ;(is as { dev: boolean }).dev = false

      await getRegisteredHandler('settings:clear-all')(EVENT)

      expect(cleanupRepo.clearAllData).toHaveBeenCalled()
      expect(settingsManager.reset).toHaveBeenCalled()
      expect(gatekeeperService.reset).toHaveBeenCalled()
      expect(app.relaunch).toHaveBeenCalled()
      expect(app.exit).toHaveBeenCalledWith(0)
    })

    it('exits without relaunching in dev mode', async () => {
      ;(is as { dev: boolean }).dev = true

      await getRegisteredHandler('settings:clear-all')(EVENT)

      expect(app.relaunch).not.toHaveBeenCalled()
      expect(app.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('app:restart', () => {
    it('relaunches and exits the app', async () => {
      await getRegisteredHandler('app:restart')(EVENT)

      expect(app.relaunch).toHaveBeenCalled()
      expect(app.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('settings:open-system-date-settings', () => {
    it('opens the Windows region & language settings and returns true', async () => {
      vi.stubGlobal('process', { ...process, platform: 'win32' })

      await expect(
        getRegisteredHandler('settings:open-system-date-settings')(EVENT)
      ).resolves.toEqual({ success: true, data: true })
      expect(shell.openExternal).toHaveBeenCalledWith('ms-settings:regionlanguage')

      vi.unstubAllGlobals()
    })

    it('returns false on an unsupported platform (e.g. linux)', async () => {
      vi.stubGlobal('process', { ...process, platform: 'linux' })

      await expect(
        getRegisteredHandler('settings:open-system-date-settings')(EVENT)
      ).resolves.toEqual({ success: true, data: false })
      expect(shell.openExternal).not.toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('returns false when shell.openExternal rejects', async () => {
      vi.stubGlobal('process', { ...process, platform: 'win32' })
      vi.mocked(shell.openExternal).mockRejectedValue(new Error('failed to open'))

      await expect(
        getRegisteredHandler('settings:open-system-date-settings')(EVENT)
      ).resolves.toEqual({ success: true, data: false })

      vi.unstubAllGlobals()
    })
  })

  describe('settings:open-system-proxy-settings', () => {
    it('opens the Windows network proxy settings and returns true', async () => {
      vi.stubGlobal('process', { ...process, platform: 'win32' })

      await expect(
        getRegisteredHandler('settings:open-system-proxy-settings')(EVENT)
      ).resolves.toEqual({ success: true, data: true })
      expect(shell.openExternal).toHaveBeenCalledWith('ms-settings:network-proxy')

      vi.unstubAllGlobals()
    })
  })

  describe('settings:get-memory-tier-info', () => {
    it('returns settingsManager.getMemoryTierInfo() unchanged', async () => {
      vi.mocked(settingsManager.getMemoryTierInfo).mockReturnValue({ tier: 'High' } as never)

      await expect(getRegisteredHandler('settings:get-memory-tier-info')(EVENT)).resolves.toEqual({
        success: true,
        data: { tier: 'High' }
      })
    })
  })

  describe('settings:update-section', () => {
    it('forwards a valid section/value to settingsManager.updateSection', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)
      vi.mocked(validateSection).mockReturnValue(true)

      await getRegisteredHandler('settings:update-section')(EVENT, 'downloads', {
        maxConcurrentDownloads: 3
      })

      expect(settingsManager.updateSection).toHaveBeenCalledWith('downloads', {
        maxConcurrentDownloads: 3
      })
    })

    it('rejects an unknown section', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(false)

      const response = await getRegisteredHandler('settings:update-section')(EVENT, 'bogus', {})

      expect(response.success).toBe(false)
      expect(settingsManager.updateSection).not.toHaveBeenCalled()
    })

    it('rejects a section value that fails its validator', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)
      vi.mocked(validateSection).mockReturnValue(false)

      const response = await getRegisteredHandler('settings:update-section')(EVENT, 'downloads', {})

      expect(response.success).toBe(false)
      expect(settingsManager.updateSection).not.toHaveBeenCalled()
    })

    it('refreshes the image proxy chapter cache size after a reader settings change', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)
      vi.mocked(validateSection).mockReturnValue(true)
      const updateChapterCacheSize = vi.fn().mockResolvedValue(undefined)
      const imageProxy = { updateChapterCacheSize } as unknown as ImageProxy

      // Re-register with an imageProxy instance to exercise that branch
      registerAppSettingsHandlers(imageProxy)

      await getRegisteredHandler('settings:update-section')(EVENT, 'reader', {})

      expect(updateChapterCacheSize).toHaveBeenCalled()
    })

    it('does not touch the image proxy for a non-reader section', async () => {
      vi.mocked(isSettingsSectionKey).mockReturnValue(true)
      vi.mocked(validateSection).mockReturnValue(true)
      const updateChapterCacheSize = vi.fn().mockResolvedValue(undefined)
      const imageProxy = { updateChapterCacheSize } as unknown as ImageProxy

      registerAppSettingsHandlers(imageProxy)

      await getRegisteredHandler('settings:update-section')(EVENT, 'downloads', {})

      expect(updateChapterCacheSize).not.toHaveBeenCalled()
    })
  })
})
