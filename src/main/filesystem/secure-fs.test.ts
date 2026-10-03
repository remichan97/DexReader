vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    mkdir: vi.fn(),
    unlink: vi.fn(),
    rm: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    statfs: vi.fn(),
    copyFile: vi.fn(),
    rename: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn()
  }
}))

vi.mock('./path-validator', () => ({
  validatePath: vi.fn(async (inputPath: string) => `/validated${inputPath}`)
}))

import fs from 'node:fs/promises'
import { secureFs } from './secure-fs'
import { validatePath } from './path-validator'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('readFile', () => {
  it('validates the path before reading, without encoding by default', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from([1]))

    const result = await secureFs.readFile('/foo.txt')

    expect(validatePath).toHaveBeenCalledWith('/foo.txt')
    expect(fs.readFile).toHaveBeenCalledWith('/validated/foo.txt')
    expect(result).toEqual(Buffer.from([1]))
  })

  it('passes the encoding through when provided', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('text')

    await secureFs.readFile('/foo.txt', 'utf-8')

    expect(fs.readFile).toHaveBeenCalledWith('/validated/foo.txt', { encoding: 'utf-8' })
  })
})

describe('mkdir / ensureDir', () => {
  it('validates the path and creates it recursively', async () => {
    await secureFs.mkdir('/new-dir')

    expect(validatePath).toHaveBeenCalledWith('/new-dir')
    expect(fs.mkdir).toHaveBeenCalledWith('/validated/new-dir', { recursive: true })
  })

  it('ensureDir delegates to mkdir', async () => {
    await secureFs.ensureDir('/new-dir')

    expect(fs.mkdir).toHaveBeenCalledWith('/validated/new-dir', { recursive: true })
  })
})

describe('deleteFile', () => {
  it('validates the path before unlinking', async () => {
    await secureFs.deleteFile('/foo.txt')

    expect(validatePath).toHaveBeenCalledWith('/foo.txt')
    expect(fs.unlink).toHaveBeenCalledWith('/validated/foo.txt')
  })
})

describe('deleteDir', () => {
  it('validates the path and removes it recursively and forcefully', async () => {
    await secureFs.deleteDir('/some-dir')

    expect(validatePath).toHaveBeenCalledWith('/some-dir')
    expect(fs.rm).toHaveBeenCalledWith('/validated/some-dir', { recursive: true, force: true })
  })
})

describe('isExists', () => {
  it('returns true when the validated path is accessible', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined)

    await expect(secureFs.isExists('/foo.txt')).resolves.toBe(true)
  })

  it('returns false when access throws', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))

    await expect(secureFs.isExists('/missing.txt')).resolves.toBe(false)
  })
})

describe('stat', () => {
  it('validates the path before stat-ing it', async () => {
    const stats = { size: 100 } as Awaited<ReturnType<typeof fs.stat>>
    vi.mocked(fs.stat).mockResolvedValue(stats)

    const result = await secureFs.stat('/foo.txt')

    expect(fs.stat).toHaveBeenCalledWith('/validated/foo.txt')
    expect(result).toBe(stats)
  })
})

describe('readDir', () => {
  it('validates the path before listing it', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['a.txt', 'b.txt'] as never)

    const result = await secureFs.readDir('/some-dir')

    expect(fs.readdir).toHaveBeenCalledWith('/validated/some-dir')
    expect(result).toEqual(['a.txt', 'b.txt'])
  })
})

describe('statFs', () => {
  it('validates the path before reading filesystem stats', async () => {
    const statsFs = { bsize: 4096 } as Awaited<ReturnType<typeof fs.statfs>>
    vi.mocked(fs.statfs).mockResolvedValue(statsFs)

    const result = await secureFs.statFs('/some-dir')

    expect(fs.statfs).toHaveBeenCalledWith('/validated/some-dir')
    expect(result).toBe(statsFs)
  })
})

describe('copyFile', () => {
  it('validates both paths and ensures the destination directory exists first', async () => {
    await secureFs.copyFile('/src.txt', '/dest/dest.txt')

    expect(validatePath).toHaveBeenCalledWith('/src.txt')
    expect(validatePath).toHaveBeenCalledWith('/dest/dest.txt')
    expect(fs.mkdir).toHaveBeenCalledWith('/validated/validated/dest', { recursive: true })
    expect(fs.copyFile).toHaveBeenCalledWith('/validated/src.txt', '/validated/dest/dest.txt')
  })
})

describe('rename', () => {
  it('validates both paths and ensures the destination directory exists first', async () => {
    await secureFs.rename('/old.txt', '/dest/new.txt')

    expect(validatePath).toHaveBeenCalledWith('/old.txt')
    expect(validatePath).toHaveBeenCalledWith('/dest/new.txt')
    expect(fs.mkdir).toHaveBeenCalledWith('/validated/validated/dest', { recursive: true })
    expect(fs.rename).toHaveBeenCalledWith('/validated/old.txt', '/validated/dest/new.txt')
  })
})

describe('writeFile', () => {
  it('writes a Buffer directly, ignoring the encoding option', async () => {
    await secureFs.writeFile('/dest/file.bin', Buffer.from([1, 2, 3]), 'ascii')

    expect(fs.writeFile).toHaveBeenCalledWith('/validated/dest/file.bin', Buffer.from([1, 2, 3]))
  })

  it('writes a string with the given encoding, defaulting to utf-8', async () => {
    await secureFs.writeFile('/dest/file.txt', 'hello')

    expect(fs.writeFile).toHaveBeenCalledWith('/validated/dest/file.txt', 'hello', {
      encoding: 'utf-8'
    })
  })

  it('ensures the parent directory exists before writing', async () => {
    await secureFs.writeFile('/dest/file.txt', 'hello')

    // ensureDir re-validates its (already-validated) input, hence the doubled prefix here -
    // see the copyFile/rename tests above for the same artifact.
    expect(fs.mkdir).toHaveBeenCalledWith('/validated/validated/dest', { recursive: true })
  })
})

describe('appendFile', () => {
  it('validates the path and ensures the parent directory exists before appending', async () => {
    await secureFs.appendFile('/dest/log.txt', 'more text')

    expect(validatePath).toHaveBeenCalledWith('/dest/log.txt')
    expect(fs.mkdir).toHaveBeenCalledWith('/validated/validated/dest', { recursive: true })
    expect(fs.appendFile).toHaveBeenCalledWith('/validated/dest/log.txt', 'more text')
  })
})
