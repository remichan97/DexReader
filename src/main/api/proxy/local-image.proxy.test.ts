import path from 'node:path'
import { protocol } from 'electron'
import { LocalImageProxy } from './local-image.proxy'
import { chapterDownloadsRepo } from '../../database/repositories/chapter-downloads.repo'
import { secureFs } from '../../filesystem/secure-fs'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'

vi.mock('electron', () => ({
  protocol: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: { getDownload: vi.fn() }
}))

vi.mock('../../filesystem/secure-fs', () => ({
  secureFs: { readFile: vi.fn() }
}))

function download(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Completed,
    downloadedAt: 0,
    downloadsBasePath: '/downloads',
    filePath: 'manga-1/chapter-1',
    totalPages: 10,
    storageSize: 1024,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    title: 'Berserk',
    chapterNumber: '1',
    ...overrides
  }
}

function fakeRequest(url: string): Request {
  return { url } as Request
}

describe('LocalImageProxy', () => {
  let localImageProxy: LocalImageProxy

  beforeEach(() => {
    vi.clearAllMocks()
    localImageProxy = new LocalImageProxy()
    localImageProxy.registerProtocol()
  })

  function getRegisteredHandler(): (request: Request) => Promise<Response> {
    const call = vi.mocked(protocol.handle).mock.calls.find(([scheme]) => scheme === 'local-manga')
    if (!call) {
      throw new Error('local-manga protocol handler was not registered')
    }
    return call[1] as (request: Request) => Promise<Response>
  }

  it('registers the local-manga protocol', () => {
    expect(protocol.handle).toHaveBeenCalledWith('local-manga', expect.any(Function))
  })

  it('serves the page file, converting 0-indexed page to 1-based, zero-padded filename', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    const body = Buffer.from([1, 2, 3, 4])
    vi.mocked(secureFs.readFile).mockResolvedValue(body)

    const response = await getRegisteredHandler()(
      fakeRequest('local-manga://chapter/chapter-1/page/0')
    )

    expect(response.status).toBe(200)
    expect(secureFs.readFile).toHaveBeenCalledWith(
      path.join('/downloads', 'manga-1/chapter-1', 'pages', '001.jpg')
    )
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(body))
  })

  it('zero-pads multi-digit page numbers to 3 digits', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    vi.mocked(secureFs.readFile).mockResolvedValue(Buffer.from([1]))

    await getRegisteredHandler()(fakeRequest('local-manga://chapter/chapter-1/page/41'))

    expect(secureFs.readFile).toHaveBeenCalledWith(
      path.join('/downloads', 'manga-1/chapter-1', 'pages', '042.jpg')
    )
  })

  it.each([
    ['001.png', 'image/png'],
    ['001.webp', 'image/webp'],
    ['001.jpg', 'image/jpeg']
  ])(
    'sets Content-Type %s -> %s based on the stored imageFormat',
    async (fileName, contentType) => {
      const ext = path.extname(fileName)
      vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download({ imageFormat: ext }))
      vi.mocked(secureFs.readFile).mockResolvedValue(Buffer.from([1]))

      const response = await getRegisteredHandler()(
        fakeRequest('local-manga://chapter/chapter-1/page/0')
      )

      expect(response.headers.get('Content-Type')).toBe(contentType)
    }
  )

  it('returns 404 when there is no download record for the chapter', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)

    const response = await getRegisteredHandler()(
      fakeRequest('local-manga://chapter/missing-chapter/page/0')
    )

    expect(response.status).toBe(404)
    expect(secureFs.readFile).not.toHaveBeenCalled()
  })

  it('returns 500 for a malformed local-manga URL', async () => {
    const response = await getRegisteredHandler()(fakeRequest('local-manga://not-a-valid-url'))

    expect(response.status).toBe(500)
    expect(chapterDownloadsRepo.getDownload).not.toHaveBeenCalled()
  })

  it('returns 500 when reading the page file fails', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    vi.mocked(secureFs.readFile).mockRejectedValue(new Error('ENOENT'))

    const response = await getRegisteredHandler()(
      fakeRequest('local-manga://chapter/chapter-1/page/0')
    )

    expect(response.status).toBe(500)
  })

  it('converts a string result from secureFs.readFile into a Buffer before responding', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    vi.mocked(secureFs.readFile).mockResolvedValue('not actually binary, but exercises the branch')

    const response = await getRegisteredHandler()(
      fakeRequest('local-manga://chapter/chapter-1/page/0')
    )

    expect(response.status).toBe(200)
  })
})
