import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'

vi.mock('electron', () => ({
  app: { getPath: vi.fn() }
}))

vi.mock('../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

describe('path-validator', () => {
  let tmpRoot: string
  let homeDir: string
  let userDataDir: string
  let pathValidator: typeof import('./path-validator')

  function appDataRoot(): string {
    return path.join(homeDir, '.dexreader')
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Canonicalise up front: on some platforms (e.g. macOS' /tmp -> /private/tmp)
    // the OS temp root is itself a symlink, which would otherwise trip the
    // validator's own symlink detection for reasons unrelated to the test.
    tmpRoot = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'dexreader-path-validator-'))
    )
    homeDir = path.join(tmpRoot, 'home')
    userDataDir = path.join(tmpRoot, 'userData')
    await fs.mkdir(homeDir, { recursive: true })
    await fs.mkdir(userDataDir, { recursive: true })

    vi.mocked(app.getPath).mockImplementation((name) => {
      if (name === 'home') return homeDir
      if (name === 'userData') return userDataDir
      throw new Error(`Unexpected app.getPath call: ${name}`)
    })

    // path-validator caches its allowed-roots singleton at module scope on first
    // use, so each test needs a fresh module instance to pick up the fresh tmp dirs.
    vi.resetModules()
    pathValidator = await import('./path-validator')
  })

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  describe('allowed roots', () => {
    it('allows the appData root itself', async () => {
      await expect(pathValidator.validatePath(appDataRoot())).resolves.toBe(appDataRoot())
    })

    it('allows a not-yet-existing nested path inside the downloads root', async () => {
      const target = path.join(
        pathValidator.getDownloadsPath(),
        'manga-id',
        'chapter-1',
        'page1.png'
      )

      await expect(pathValidator.validatePath(target)).resolves.toBe(target)
    })

    it('allows the cached cover root', async () => {
      const target = pathValidator.getCachedCoverPath()
      await expect(pathValidator.validatePath(target)).resolves.toBe(target)
    })

    it('allows a custom downloads root outside appData, set via updateDownloadsPath', async () => {
      const customDownloads = path.join(tmpRoot, 'custom-downloads')
      pathValidator.updateDownloadsPath(customDownloads)

      const target = path.join(customDownloads, 'manga-id', 'chapter-1.cbz')
      await expect(pathValidator.validatePath(target)).resolves.toBe(target)
    })
  })

  describe('sibling-directory escape (separator-boundary regression)', () => {
    it('rejects a sibling directory that merely shares a name prefix with appData', async () => {
      const sibling = `${appDataRoot()}-evil`
      await fs.mkdir(sibling, { recursive: true })

      await expect(pathValidator.validatePath(sibling)).rejects.toThrow(/not allowed/)
    })

    it('rejects a sibling directory that shares a prefix with a custom downloads root outside appData', async () => {
      // The default downloads root lives inside appData, so a "sibling" of it is
      // still legitimately within the allowed appData tree - that's not a bypass.
      // Set a custom downloads root outside appData to isolate the downloads
      // check's own separator boundary from appData's.
      const customDownloads = path.join(tmpRoot, 'custom-downloads')
      pathValidator.updateDownloadsPath(customDownloads)

      const sibling = `${customDownloads}-evil`
      await fs.mkdir(sibling, { recursive: true })

      await expect(pathValidator.validatePath(sibling)).rejects.toThrow(/not allowed/)
    })
  })

  describe('paths entirely outside the sandbox', () => {
    it('rejects an unrelated absolute path', async () => {
      const outside = path.join(tmpRoot, 'somewhere-else', 'secret.txt')
      await expect(pathValidator.validatePath(outside)).rejects.toThrow(/not allowed/)
    })
  })

  describe('symlink escape', () => {
    it('rejects a path through a symlinked directory that resolves outside the sandbox', async () => {
      const outsideDir = path.join(tmpRoot, 'outside-secret')
      await fs.mkdir(outsideDir, { recursive: true })
      await fs.mkdir(appDataRoot(), { recursive: true })
      const symlinkPath = path.join(appDataRoot(), 'escape')

      try {
        await fs.symlink(outsideDir, symlinkPath, 'dir')
      } catch (error) {
        // Creating symlinks needs elevated privileges or Developer Mode on Windows -
        // skip rather than fail the suite over a host permission gap unrelated to the code under test.
        if ((error as NodeJS.ErrnoException).code === 'EPERM') {
          return
        }
        throw error
      }

      const target = path.join(symlinkPath, 'file.txt')
      await expect(pathValidator.validatePath(target)).rejects.toThrow(/not allowed/)
    })
  })
})
