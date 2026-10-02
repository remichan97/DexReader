import { net } from 'electron'
import { ImageProxy } from './image.proxy'
import { MangaDexClient } from '../mangadex-client'
import { atHomeGuardsUtil } from '../utils/at-home-guards.utl'
import { diskCacheUtil } from '../utils/disk-cache.util'

vi.mock('electron', () => ({
  net: { fetch: vi.fn() },
  protocol: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../utils/disk-cache.util', () => ({
  diskCacheUtil: {
    loadCoverFromDisk: vi.fn().mockResolvedValue(undefined),
    saveCoverToDisk: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../utils/memory-cache.util', () => ({
  memoryCacheUtil: {
    getMemoryLimit: vi.fn().mockResolvedValue(200 * 1024 * 1024)
  }
}))

vi.mock('../utils/at-home-guards.utl', () => ({
  atHomeGuardsUtil: {
    isUrlAllowed: vi.fn().mockReturnValue(true)
  }
}))

const CHAPTER_URL = 'https://example-node.mangadex.network/data/abc123hash/page1.png'
const COVER_URL = 'https://uploads.mangadex.org/covers/manga-id/cover-file.jpg'

function fakeNetworkResponse(init: {
  ok: boolean
  status?: number
  body?: ArrayBuffer
  headers?: Record<string, string>
}): Response {
  return new Response(init.body, {
    status: init.status ?? (init.ok ? 200 : 500),
    headers: init.headers
  })
}

describe('ImageProxy', () => {
  let reportAtHomeNetworkStatus: ReturnType<typeof vi.fn>
  let mangaDexClient: MangaDexClient
  let imageProxy: ImageProxy

  beforeEach(async () => {
    vi.clearAllMocks()
    reportAtHomeNetworkStatus = vi.fn().mockResolvedValue(undefined)
    mangaDexClient = { reportAtHomeNetworkStatus } as unknown as MangaDexClient
    imageProxy = new ImageProxy(mangaDexClient)
    await imageProxy.initialize()
  })

  afterEach(() => {
    imageProxy.destroy()
  })

  describe('successful network fetch', () => {
    it('reports success with the real body size and a measured duration', async () => {
      const body = new Uint8Array([1, 2, 3, 4]).buffer
      vi.mocked(net.fetch).mockResolvedValue(
        fakeNetworkResponse({ ok: true, body, headers: { 'Content-Type': 'image/png' } })
      )

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(200)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(1)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledWith(
        CHAPTER_URL,
        true,
        false,
        expect.any(Number),
        4
      )
    })

    it('reports cached: true when the node returns an X-Cache HIT header', async () => {
      const body = new Uint8Array([1]).buffer
      vi.mocked(net.fetch).mockResolvedValue(
        fakeNetworkResponse({ ok: true, body, headers: { 'X-Cache': 'HIT' } })
      )

      await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(reportAtHomeNetworkStatus).toHaveBeenCalledWith(
        CHAPTER_URL,
        true,
        true,
        expect.any(Number),
        1
      )
    })
  })

  describe('non-OK network response', () => {
    it('reports failure with the real received body size, and reports exactly once', async () => {
      const body = new Uint8Array([1, 2, 3]).buffer // e.g. an error page body
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: false, status: 403, body }))

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(502)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(1)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledWith(
        CHAPTER_URL,
        false,
        false,
        expect.any(Number),
        3
      )
    })
  })

  describe('connection failure (net.fetch itself throws)', () => {
    it('reports 0 bytes but a real measured duration, and reports exactly once', async () => {
      vi.mocked(net.fetch).mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(502)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(1)
      const [, success, cached, duration, bytes] = reportAtHomeNetworkStatus.mock.calls[0]
      expect(success).toBe(false)
      expect(cached).toBe(false)
      expect(bytes).toBe(0)
      expect(duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cover images (isCover: true)', () => {
    it('never reports to @Home on a successful cover fetch - covers are not on the @Home network', async () => {
      const body = new Uint8Array([1, 2, 3, 4]).buffer
      vi.mocked(net.fetch).mockResolvedValue(
        fakeNetworkResponse({ ok: true, body, headers: { 'Content-Type': 'image/jpeg' } })
      )

      const response = await imageProxy.handleImageRequest(COVER_URL, true)

      expect(response.status).toBe(200)
      expect(reportAtHomeNetworkStatus).not.toHaveBeenCalled()
    })

    it('never reports to @Home on a failed cover fetch (non-OK response)', async () => {
      const body = new Uint8Array([1, 2, 3]).buffer
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: false, status: 404, body }))

      const response = await imageProxy.handleImageRequest(COVER_URL, true)

      expect(response.status).toBe(502)
      expect(reportAtHomeNetworkStatus).not.toHaveBeenCalled()
    })

    it('never reports to @Home when the cover fetch throws (connection failure)', async () => {
      vi.mocked(net.fetch).mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))

      const response = await imageProxy.handleImageRequest(COVER_URL, true)

      expect(response.status).toBe(502)
      expect(reportAtHomeNetworkStatus).not.toHaveBeenCalled()
    })
  })

  describe('in-memory cache hit', () => {
    it('serves the exact cached bytes without re-fetching, even for a small (pool-allocated) buffer', async () => {
      // A buffer this small is allocated from Node's shared buffer pool, which is
      // exactly the scenario that exposed the .buffer-vs-Buffer bug this test guards.
      const body = new Uint8Array([1, 2, 3]).buffer
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: true, body }))
      await imageProxy.handleImageRequest(CHAPTER_URL, false)
      vi.mocked(net.fetch).mockClear()

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(net.fetch).not.toHaveBeenCalled()
      const responseBytes = new Uint8Array(await response.arrayBuffer())
      expect(responseBytes).toEqual(new Uint8Array(body))
      expect(responseBytes.byteLength).toBe(3)
    })
  })

  describe('disk cache hit (cover)', () => {
    it('serves the exact disk-cached bytes without hitting the network', async () => {
      const diskBuffer = Buffer.from([9, 9, 9])
      vi.mocked(diskCacheUtil.loadCoverFromDisk).mockResolvedValue(diskBuffer)

      const response = await imageProxy.handleImageRequest(COVER_URL, true)

      expect(net.fetch).not.toHaveBeenCalled()
      const responseBytes = new Uint8Array(await response.arrayBuffer())
      expect(responseBytes).toEqual(new Uint8Array(diskBuffer))
      expect(responseBytes.byteLength).toBe(3)
    })
  })

  describe('domain allowlist', () => {
    it('fetches when the URL passes the allowlist check', async () => {
      const body = new Uint8Array([1, 2, 3]).buffer
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: true, body }))

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(net.fetch).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
    })

    it('returns 403 and never calls net.fetch when the URL fails the allowlist check', async () => {
      // mockReturnValueOnce so the other tests' factory-level mockReturnValue(true)
      // (never reset by clearAllMocks) is restored for the very next call.
      vi.mocked(atHomeGuardsUtil.isUrlAllowed).mockReturnValueOnce(false)

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(403)
      expect(net.fetch).not.toHaveBeenCalled()
      // Nothing was ever attempted against an at-home baseUrl, so there's nothing to
      // report - a locally-refused URL must not generate a spurious @Home report.
      expect(reportAtHomeNetworkStatus).not.toHaveBeenCalled()
    })
  })

  describe('reporting failures must not affect the image response', () => {
    it('still returns the fetched image if reportAtHomeNetworkStatus rejects', async () => {
      const body = new Uint8Array([1, 2, 3, 4]).buffer
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: true, body }))
      reportAtHomeNetworkStatus.mockRejectedValue(new Error('report endpoint unreachable'))

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(200)
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(body))
    })

    it('still returns the 502 if reportAtHomeNetworkStatus rejects on a failed fetch', async () => {
      vi.mocked(net.fetch).mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))
      reportAtHomeNetworkStatus.mockRejectedValue(new Error('report endpoint unreachable'))

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(502)
    })
  })

  describe('reporting runs in the background', () => {
    const NEVER_RESOLVES = new Promise<void>(() => {})

    it('returns the image without waiting for a report that never resolves', async () => {
      const body = new Uint8Array([1, 2, 3, 4]).buffer
      vi.mocked(net.fetch).mockResolvedValue(fakeNetworkResponse({ ok: true, body }))
      reportAtHomeNetworkStatus.mockReturnValue(NEVER_RESOLVES)

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(200)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(1)
    })

    it('returns the 502 without waiting for a report that never resolves', async () => {
      vi.mocked(net.fetch).mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))
      reportAtHomeNetworkStatus.mockReturnValue(NEVER_RESOLVES)

      const response = await imageProxy.handleImageRequest(CHAPTER_URL, false)

      expect(response.status).toBe(502)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(1)
    })

    it('drops reports beyond the pending cap while still serving every image', async () => {
      vi.mocked(net.fetch).mockImplementation(async () =>
        fakeNetworkResponse({ ok: true, body: new Uint8Array([1, 2, 3, 4]).buffer })
      )
      reportAtHomeNetworkStatus.mockReturnValue(NEVER_RESOLVES)

      const statuses: number[] = []
      for (let page = 0; page < 105; page++) {
        const response = await imageProxy.handleImageRequest(`${CHAPTER_URL}?page=${page}`, false)
        statuses.push(response.status)
      }

      expect(statuses.every((status) => status === 200)).toBe(true)
      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(100)
    })

    it('frees a pending slot once its report settles', async () => {
      vi.mocked(net.fetch).mockImplementation(async () =>
        fakeNetworkResponse({ ok: true, body: new Uint8Array([1, 2, 3, 4]).buffer })
      )
      reportAtHomeNetworkStatus.mockResolvedValue(undefined)

      for (let page = 0; page < 150; page++) {
        await imageProxy.handleImageRequest(`${CHAPTER_URL}?page=${page}`, false)
        await Promise.resolve() // let the settled report release its slot
        await Promise.resolve()
      }

      expect(reportAtHomeNetworkStatus).toHaveBeenCalledTimes(150)
    })
  })
})
