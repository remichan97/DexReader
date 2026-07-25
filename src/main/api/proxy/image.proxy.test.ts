import { net } from 'electron'
import { ImageProxy } from './image.proxy'
import { MangaDexClient } from '../mangadex-client'
import { atHomeGuardsUtil } from '../utils/at-home-guards.utl'

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
})
