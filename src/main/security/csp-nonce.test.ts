import {
  buildContentSecurityPolicy,
  DEV_CONTENT_SECURITY_POLICY,
  generateCspNonce,
  getCspNonce
} from './csp-nonce'

describe('csp-nonce', () => {
  describe('getCspNonce', () => {
    it('throws when called before a nonce has been generated', async () => {
      vi.resetModules()
      const fresh = await import('./csp-nonce')
      expect(() => fresh.getCspNonce()).toThrow(/has not been generated yet/)
    })

    it('returns the value generateCspNonce() produced', () => {
      const nonce = generateCspNonce()
      expect(getCspNonce()).toBe(nonce)
    })
  })

  describe('generateCspNonce', () => {
    it('produces a non-empty, URL-safe base64 string that changes on each call', () => {
      const first = generateCspNonce()
      const second = generateCspNonce()

      expect(first).toMatch(/^[A-Za-z0-9+/]+=*$/)
      expect(first).not.toBe(second)
    })
  })

  describe('buildContentSecurityPolicy', () => {
    it('embeds the nonce into style-src and leaves the other directives unchanged', () => {
      const policy = buildContentSecurityPolicy('test-nonce')

      expect(policy).toBe(
        "default-src 'self'; script-src 'self'; style-src 'self' 'nonce-test-nonce'; img-src 'self' data: mangadex: local-manga:;"
      )
    })
  })

  describe('DEV_CONTENT_SECURITY_POLICY', () => {
    it('allows unsafe-inline scripts and styles and carries no nonce', () => {
      expect(DEV_CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'unsafe-inline'")
      expect(DEV_CONTENT_SECURITY_POLICY).toContain("style-src 'self' 'unsafe-inline'")
      expect(DEV_CONTENT_SECURITY_POLICY).not.toContain('nonce-')
    })
  })
})
