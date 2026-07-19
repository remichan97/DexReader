import { MangaDexClient } from './mangadex-client'
import { ApiConfig } from './constants/api-config.constant'

vi.mock('./utils/at-home-guards.utl', () => ({
  atHomeGuardsUtil: { recordAtHomeRequest: vi.fn() }
}))

vi.mock('../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

describe('MangaDexClient.reportAtHomeNetworkStatus', () => {
  let client: MangaDexClient
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new MangaDexClient()
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to the @Home network report host, not the main api.mangadex.org host', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

    await client.reportAtHomeNetworkStatus(
      'https://node.mangadex.network/data/hash/page1.png',
      true,
      false,
      123,
      456
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url] = fetchSpy.mock.calls[0]
    expect(url).toBe(ApiConfig.NETWORK_REPORT_URL)
    expect(url).not.toContain(ApiConfig.BASE_API_URL)
  })

  it('sends the report body using the exact field names the spec expects: url, success, bytes, duration, cached', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

    await client.reportAtHomeNetworkStatus(
      'https://node.mangadex.network/data/hash/page1.png',
      true,
      true,
      250,
      102400
    )

    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      url: 'https://node.mangadex.network/data/hash/page1.png',
      success: true,
      cached: true,
      duration: 250,
      bytes: 102400
    })
  })

  it('does not throw when the report request itself rejects (e.g. connection failure)', async () => {
    fetchSpy.mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))

    await expect(
      client.reportAtHomeNetworkStatus(
        'https://node.mangadex.network/data/hash/page1.png',
        false,
        false,
        50,
        0
      )
    ).resolves.toBeUndefined()
  })

  it('does not throw when the report endpoint responds with a non-OK status', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 500 }))

    await expect(
      client.reportAtHomeNetworkStatus(
        'https://node.mangadex.network/data/hash/page1.png',
        true,
        false,
        100,
        1
      )
    ).resolves.toBeUndefined()
  })
})
