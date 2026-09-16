vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/mock/user-data') }
}))

vi.mock('./logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

class MockElectronStore<T extends object> {
  private data: Partial<T>

  public constructor(options: { defaults: T }) {
    this.data = { ...options.defaults }
  }

  public get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K] {
    return (this.data[key] ?? defaultValue) as T[K]
  }

  public set(keyOrObject: keyof T | Partial<T>, value?: unknown): void {
    if (typeof keyOrObject === 'object') {
      Object.assign(this.data, keyOrObject)
    } else {
      this.data[keyOrObject] = value as T[typeof keyOrObject]
    }
  }

  public clear(): void {
    this.data = {}
  }
}

vi.mock('electron-store', () => ({
  default: MockElectronStore
}))

describe('GatekeeperService', () => {
  let gatekeeperService: typeof import('./gatekeeper.service').gatekeeperService

  beforeEach(async () => {
    vi.clearAllMocks()
    // The service is an exported singleton with its own in-memory store, so each test
    // needs a fresh module instance to avoid state leaking between tests.
    vi.resetModules()
    ;({ gatekeeperService } = await import('./gatekeeper.service'))
  })

  describe('isEnabled / getRequireForSettings', () => {
    it('default to disabled and not required', () => {
      expect(gatekeeperService.isEnabled()).toBe(false)
      expect(gatekeeperService.getRequireForSettings()).toBe(false)
    })
  })

  describe('toggleRequiredForSettings', () => {
    it('throws when gatekeeper is not enabled', () => {
      expect(() => gatekeeperService.toggleRequiredForSettings(true)).toThrow(/not enabled/i)
    })

    it('sets the flag once gatekeeper is enabled', async () => {
      await gatekeeperService.enable('correct-horse')

      gatekeeperService.toggleRequiredForSettings(true)

      expect(gatekeeperService.getRequireForSettings()).toBe(true)
    })
  })

  describe('enable', () => {
    it.each([
      ['', 0],
      ['abc', 3],
      ['x'.repeat(129), 129]
    ])('rejects a passphrase of invalid length (%s chars)', async (passphrase) => {
      await expect(gatekeeperService.enable(passphrase)).rejects.toThrow(/between 4 and 128/i)
    })

    it('enables gatekeeper with a valid passphrase', async () => {
      const result = await gatekeeperService.enable('correct-horse')

      expect(result).toBe(true)
      expect(gatekeeperService.isEnabled()).toBe(true)
    })

    it('rejects enabling again once already enabled', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(gatekeeperService.enable('another-one')).rejects.toThrow(/already enabled/i)
    })
  })

  describe('verify', () => {
    it('returns false without throwing when gatekeeper is not enabled', async () => {
      await expect(gatekeeperService.verify('anything')).resolves.toBe(false)
    })

    it('returns true for the correct passphrase', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(gatekeeperService.verify('correct-horse')).resolves.toBe(true)
    })

    it('returns false for an incorrect passphrase', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(gatekeeperService.verify('wrong-passphrase')).resolves.toBe(false)
    })
  })

  describe('changePassphrase', () => {
    it('throws when gatekeeper is not enabled', async () => {
      await expect(gatekeeperService.changePassphrase('old', 'new-passphrase')).rejects.toThrow(
        /not enabled/i
      )
    })

    it('throws when the new passphrase has an invalid length', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(gatekeeperService.changePassphrase('correct-horse', 'abc')).rejects.toThrow(
        /between 4 and 128/i
      )
    })

    it('returns false without throwing when the current passphrase is wrong', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(
        gatekeeperService.changePassphrase('wrong-current', 'brand-new-phrase')
      ).resolves.toBe(false)
    })

    it('throws when the new passphrase is the same as the old one', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(
        gatekeeperService.changePassphrase('correct-horse', 'correct-horse')
      ).rejects.toThrow(/must be different/i)
    })

    it('changes the passphrase so only the new one verifies afterwards', async () => {
      await gatekeeperService.enable('correct-horse')

      const result = await gatekeeperService.changePassphrase('correct-horse', 'brand-new-phrase')

      expect(result).toBe(true)
      await expect(gatekeeperService.verify('brand-new-phrase')).resolves.toBe(true)
      await expect(gatekeeperService.verify('correct-horse')).resolves.toBe(false)
    })
  })

  describe('disable', () => {
    it('throws when gatekeeper is not enabled', async () => {
      await expect(gatekeeperService.disable('anything')).rejects.toThrow(/not enabled/i)
    })

    it('returns false and leaves gatekeeper enabled when the passphrase is wrong', async () => {
      await gatekeeperService.enable('correct-horse')

      await expect(gatekeeperService.disable('wrong-passphrase')).resolves.toBe(false)
      expect(gatekeeperService.isEnabled()).toBe(true)
    })

    it('disables and resets gatekeeper when the passphrase is correct', async () => {
      await gatekeeperService.enable('correct-horse')

      const result = await gatekeeperService.disable('correct-horse')

      expect(result).toBe(true)
      expect(gatekeeperService.isEnabled()).toBe(false)
      await expect(gatekeeperService.verify('correct-horse')).resolves.toBe(false)
    })
  })

  describe('reset', () => {
    it('clears the store back to a disabled state', async () => {
      await gatekeeperService.enable('correct-horse')

      gatekeeperService.reset()

      expect(gatekeeperService.isEnabled()).toBe(false)
    })
  })
})
