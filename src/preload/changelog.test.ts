// Marks this file as a module, so its hoisted `mocks` does not collide with other test files'.
export {}

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  exposeInMainWorld: vi.fn()
}))

vi.mock('electron', () => ({
  ipcRenderer: { invoke: mocks.invoke },
  contextBridge: { exposeInMainWorld: mocks.exposeInMainWorld }
}))

interface PreloadProcess {
  contextIsolated?: boolean
}

function setContextIsolated(value: boolean | undefined): void {
  if (value === undefined) {
    delete (process as PreloadProcess).contextIsolated
  } else {
    ;(process as PreloadProcess).contextIsolated = value
  }
}

// Each test re-evaluates the preload, since it runs its branch once, at import time.
async function loadPreload(): Promise<void> {
  vi.resetModules()
  await import('./changelog')
}

describe('changelog preload', () => {
  beforeEach(() => {
    mocks.invoke.mockReset()
    mocks.exposeInMainWorld.mockReset()
  })

  afterEach(() => {
    setContextIsolated(undefined)
    delete (globalThis as { changelog?: unknown }).changelog
  })

  describe('without context isolation', () => {
    it('assigns the surface to globalThis.changelog', async () => {
      await loadPreload()

      expect(globalThis.changelog).toBeDefined()
      expect(mocks.exposeInMainWorld).not.toHaveBeenCalled()
    })

    it('exposes only what the changelog window needs', async () => {
      await loadPreload()

      expect(Object.keys(globalThis.changelog).sort()).toEqual([
        'getChangelog',
        'getCspNonce',
        'getSystemAccentColour',
        'getTheme',
        'openExternal'
      ])
    })

    it.each([
      ['getChangelog', 'changelog:get'],
      ['getCspNonce', 'security:get-csp-nonce'],
      ['getTheme', 'get-theme'],
      ['getSystemAccentColour', 'theme:get-system-accent-color']
    ] as const)('%s invokes the %s channel', async (method, channel) => {
      mocks.invoke.mockResolvedValue({ success: true, data: 'value' })
      await loadPreload()

      await expect(globalThis.changelog[method]()).resolves.toEqual({
        success: true,
        data: 'value'
      })
      expect(mocks.invoke).toHaveBeenCalledExactlyOnceWith(channel)
    })

    it('openExternal forwards the URL on shell:open-external', async () => {
      mocks.invoke.mockResolvedValue({ success: true })
      await loadPreload()

      await globalThis.changelog.openExternal('https://example.com')

      expect(mocks.invoke).toHaveBeenCalledExactlyOnceWith(
        'shell:open-external',
        'https://example.com'
      )
    })
  })

  describe('with context isolation', () => {
    it('exposes the surface through contextBridge as "changelog"', async () => {
      setContextIsolated(true)

      await loadPreload()

      expect(mocks.exposeInMainWorld).toHaveBeenCalledExactlyOnceWith(
        'changelog',
        expect.objectContaining({
          getChangelog: expect.any(Function),
          getCspNonce: expect.any(Function),
          getTheme: expect.any(Function),
          getSystemAccentColour: expect.any(Function),
          openExternal: expect.any(Function)
        })
      )
      expect((globalThis as { changelog?: unknown }).changelog).toBeUndefined()
    })

    it('logs and carries on when contextBridge throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failure = new Error('bridge unavailable')
      mocks.exposeInMainWorld.mockImplementation(() => {
        throw failure
      })
      setContextIsolated(true)

      await expect(loadPreload()).resolves.toBeUndefined()

      expect(errorSpy).toHaveBeenCalledExactlyOnceWith(failure)
      errorSpy.mockRestore()
    })
  })
})
