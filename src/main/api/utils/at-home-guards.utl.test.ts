import { AtHomeGuardsUtil } from './at-home-guards.utl'

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

describe('AtHomeGuardsUtil', () => {
  const hash = 'abc123hash'
  const baseUrl = 'https://example-node.mangadex.network'
  const chapterUrl = `${baseUrl}/data/${hash}/page1.png`

  let guard: AtHomeGuardsUtil

  beforeEach(() => {
    vi.useFakeTimers()
    guard = new AtHomeGuardsUtil()
  })

  afterEach(() => {
    guard.destroy()
    vi.useRealTimers()
  })

  describe('cover URLs', () => {
    it('allows an uploads.mangadex.org cover URL without a hash', () => {
      expect(guard.isUrlAllowed('https://uploads.mangadex.org/covers/manga-id/cover.jpg')).toBe(
        true
      )
    })

    it('rejects a non-MangaDex host even if the path looks like a cover', () => {
      expect(guard.isUrlAllowed('https://evil.example/covers/manga-id/cover.jpg')).toBe(false)
    })
  })

  describe('chapter (at-home) URLs', () => {
    it('rejects a chapter URL when no hash is provided', () => {
      expect(guard.isUrlAllowed(chapterUrl)).toBe(false)
    })

    it('rejects a chapter URL whose hash was never recorded', () => {
      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(false)
    })

    it('allows a chapter URL whose origin matches the recorded baseUrl for that hash', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(true)
    })

    it('rejects a chapter URL whose origin does not match the recorded baseUrl for that hash', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      const spoofedUrl = `https://attacker.example/data/${hash}/page1.png`
      expect(guard.isUrlAllowed(spoofedUrl, hash)).toBe(false)
    })

    it('re-recording a hash replaces the previously allowed origin', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      guard.recordAtHomeRequest(hash, 'https://different-node.mangadex.network')

      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(false)
      expect(
        guard.isUrlAllowed(`https://different-node.mangadex.network/data/${hash}/page1.png`, hash)
      ).toBe(true)
    })

    it('rejects an unparsable URL instead of throwing', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      expect(guard.isUrlAllowed('not a url', hash)).toBe(false)
    })
  })

  describe('expiration', () => {
    it('rejects a chapter URL once its recorded entry has expired', () => {
      guard.recordAtHomeRequest(hash, baseUrl)

      // Just past the 15-minute TTL, but before the next 60s sweep tick would fire -
      // isolates the lazy expiry check inside isUrlAllowed from the periodic sweep below.
      vi.advanceTimersByTime(15 * 60 * 1000 + 1)

      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(false)
    })

    it('allows a fresh recording for the same hash after the previous one expired', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      vi.advanceTimersByTime(15 * 60 * 1000 + 1)
      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(false)

      guard.recordAtHomeRequest(hash, baseUrl)
      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(true)
    })

    it('evicts expired entries via the periodic cleanup sweep, without any lookup ever occurring', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      expect(guard.getRecordedHashCount()).toBe(1)

      // Past the TTL and past the next 60s sweep tick - never call isUrlAllowed,
      // so only the interval sweep (not the lazy check) can be responsible for eviction.
      // This is the regression test for the original memory-leak concern: entries must
      // not sit in the map forever just because nobody ever looks them up again.
      vi.advanceTimersByTime(16 * 60 * 1000)

      expect(guard.getRecordedHashCount()).toBe(0)
    })
  })

  describe('destroy', () => {
    it('stops the cleanup interval and forgets all recorded hashes', () => {
      guard.recordAtHomeRequest(hash, baseUrl)
      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(true)

      guard.destroy()

      expect(guard.isUrlAllowed(chapterUrl, hash)).toBe(false)
      expect(guard.getRecordedHashCount()).toBe(0)
    })

    it('does not throw when called on an instance with no recorded hashes', () => {
      expect(() => guard.destroy()).not.toThrow()
    })
  })
})
