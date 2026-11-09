// Marks this file as a module, so its hoisted `mocks` does not collide with other test files'.
export {}

type Listener = (...args: unknown[]) => void

const mocks = vi.hoisted(() => {
  type HoistedListener = (...args: unknown[]) => void

  class FakeBrowserWindow {
    public static instances: FakeBrowserWindow[] = []
    public static loadError: Error | undefined = undefined

    public readonly options: Record<string, unknown>
    public readonly listeners = new Map<string, HoistedListener>()
    public readonly webContentsListeners = new Map<string, HoistedListener>()
    public minimizable = true
    public maximizable = true
    public fullScreenable = true
    public readonly removeMenu = vi.fn()
    public readonly focus = vi.fn()
    public readonly show = vi.fn()
    public readonly loadURL = vi.fn(() => FakeBrowserWindow.load())
    public readonly loadFile = vi.fn(() => FakeBrowserWindow.load())
    public readonly webContents = {
      setWindowOpenHandler: vi.fn(),
      on: vi.fn((event: string, listener: HoistedListener) => {
        this.webContentsListeners.set(event, listener)
      })
    }

    public constructor(options: Record<string, unknown>) {
      this.options = options
      FakeBrowserWindow.instances.push(this)
    }

    private static load(): Promise<void> {
      return FakeBrowserWindow.loadError
        ? Promise.reject(FakeBrowserWindow.loadError)
        : Promise.resolve()
    }

    public once(event: string, listener: HoistedListener): void {
      this.listeners.set(event, listener)
    }

    public on(event: string, listener: HoistedListener): void {
      this.listeners.set(event, listener)
    }
  }

  return {
    FakeBrowserWindow,
    is: { dev: false },
    getMainWindow: vi.fn(),
    openExternal: vi.fn(),
    logError: vi.fn()
  }
})

vi.mock('electron', () => ({ BrowserWindow: mocks.FakeBrowserWindow }))
vi.mock('@electron-toolkit/utils', () => ({ is: mocks.is }))
vi.mock('./window', () => ({ getMainWindow: mocks.getMainWindow }))
vi.mock('./utils/shell.util', () => ({ openExternal: mocks.openExternal }))
vi.mock('./services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: mocks.logError, debug: vi.fn() }
}))

const { FakeBrowserWindow } = mocks

// The window is tracked in module state, so each test starts from a freshly evaluated module.
async function loadModule(): Promise<typeof import('./changelog-window')> {
  vi.resetModules()
  return import('./changelog-window')
}

function lastWindow(): InstanceType<typeof FakeBrowserWindow> {
  const window = FakeBrowserWindow.instances.at(-1)
  if (!window) {
    throw new Error('No window was created')
  }
  return window
}

function webPreferences(): Record<string, unknown> {
  return lastWindow().options['webPreferences'] as Record<string, unknown>
}

function emit(window: InstanceType<typeof FakeBrowserWindow>, event: string): void {
  const listener: Listener | undefined = window.listeners.get(event)
  if (!listener) {
    throw new Error(`No "${event}" listener registered`)
  }
  listener()
}

describe('createChangelogWindow', () => {
  beforeEach(() => {
    FakeBrowserWindow.instances = []
    FakeBrowserWindow.loadError = undefined
    mocks.is.dev = false
    mocks.getMainWindow.mockReset()
    mocks.openExternal.mockReset()
    mocks.openExternal.mockResolvedValue(undefined)
    mocks.logError.mockReset()
    vi.stubEnv('ELECTRON_RENDERER_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('window options', () => {
    it('creates a hidden window so it can show once the first paint is ready', async () => {
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().options['show']).toBe(false)
    })

    it('keeps the renderer isolated and sandboxed with the changelog preload', async () => {
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(webPreferences()).toMatchObject({ contextIsolation: true, sandbox: true })
      expect(String(webPreferences()['preload'])).toMatch(/preload[\\/]changelog\.cjs$/)
    })

    it.each([
      [true, true],
      [false, false]
    ])('sets devTools to %s when is.dev is %s', async (isDev, devTools) => {
      mocks.is.dev = isDev
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(webPreferences()['devTools']).toBe(devTools)
    })

    it('makes the window a child of a live main window', async () => {
      const parent = { isDestroyed: (): boolean => false }
      mocks.getMainWindow.mockReturnValue(parent)
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().options['parent']).toBe(parent)
    })

    it.each([
      ['has been destroyed', { isDestroyed: (): boolean => true }],
      ['does not exist', undefined]
    ])('creates a parentless window when the main window %s', async (_label, mainWindow) => {
      mocks.getMainWindow.mockReturnValue(mainWindow)
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().options['parent']).toBeUndefined()
    })

    it('stops the window being minimised, maximised or full-screened', async () => {
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow()).toMatchObject({
        minimizable: false,
        maximizable: false,
        fullScreenable: false
      })
    })

    it('removes the menu bar', async () => {
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().removeMenu).toHaveBeenCalledOnce()
    })

    it('shows the window once it is ready', async () => {
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()

      expect(lastWindow().show).not.toHaveBeenCalled()
      emit(lastWindow(), 'ready-to-show')

      expect(lastWindow().show).toHaveBeenCalledOnce()
    })
  })

  describe('loading the page', () => {
    it('loads the built file in production', async () => {
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().loadURL).not.toHaveBeenCalled()
      expect(lastWindow().loadFile).toHaveBeenCalledOnce()
      const [target] = lastWindow().loadFile.mock.calls[0] as unknown as [string]
      expect(target).toMatch(/renderer[\\/]changelog\.html$/)
    })

    it('loads the dev server page when running in dev with a renderer URL', async () => {
      mocks.is.dev = true
      vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173')
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().loadURL).toHaveBeenCalledExactlyOnceWith(
        'http://localhost:5173/changelog.html'
      )
      expect(lastWindow().loadFile).not.toHaveBeenCalled()
    })

    it('ignores a leftover renderer URL when not running in dev', async () => {
      vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173')
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().loadURL).not.toHaveBeenCalled()
      expect(lastWindow().loadFile).toHaveBeenCalledOnce()
    })

    it('falls back to the built file in dev without a renderer URL', async () => {
      mocks.is.dev = true
      const { createChangelogWindow } = await loadModule()

      await createChangelogWindow()

      expect(lastWindow().loadFile).toHaveBeenCalledOnce()
    })

    it('logs a failed load instead of rejecting', async () => {
      const failure = new Error('ERR_FILE_NOT_FOUND')
      FakeBrowserWindow.loadError = failure
      const { createChangelogWindow } = await loadModule()

      await expect(createChangelogWindow()).resolves.toBeUndefined()

      expect(mocks.logError).toHaveBeenCalledWith(
        '[Changelog Window] Failed to load changelog content:',
        failure
      )
    })
  })

  describe('single instance', () => {
    it('focuses the existing window instead of opening a second one', async () => {
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()
      const first = lastWindow()

      await createChangelogWindow()

      expect(FakeBrowserWindow.instances).toHaveLength(1)
      expect(first.focus).toHaveBeenCalledOnce()
    })

    it('opens a new window once the previous one has closed', async () => {
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()
      emit(lastWindow(), 'closed')

      await createChangelogWindow()

      expect(FakeBrowserWindow.instances).toHaveLength(2)
    })
  })

  describe('navigation', () => {
    it('denies new windows and hands the URL to openExternal', async () => {
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()
      const [handler] = lastWindow().webContents.setWindowOpenHandler.mock.calls[0] as [
        (details: { url: string }) => { action: string }
      ]

      const result = handler({ url: 'https://example.com' })

      expect(result).toEqual({ action: 'deny' })
      expect(mocks.openExternal).toHaveBeenCalledExactlyOnceWith('https://example.com')
    })

    it('logs when openExternal rejects, for example on a blocked protocol', async () => {
      const failure = new Error('Protocol file: is not allowed')
      mocks.openExternal.mockRejectedValue(failure)
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()
      const [handler] = lastWindow().webContents.setWindowOpenHandler.mock.calls[0] as [
        (details: { url: string }) => { action: string }
      ]

      expect(handler({ url: 'file:///etc/passwd' })).toEqual({ action: 'deny' })

      await vi.waitFor(() =>
        expect(mocks.logError).toHaveBeenCalledWith(
          '[Changelog Window] Failed to open external URL:',
          failure
        )
      )
    })

    it('blocks in-window navigation', async () => {
      const { createChangelogWindow } = await loadModule()
      await createChangelogWindow()
      const listener = lastWindow().webContentsListeners.get('will-navigate')
      const event = { preventDefault: vi.fn() }

      listener?.(event)

      expect(event.preventDefault).toHaveBeenCalledOnce()
    })
  })
})
