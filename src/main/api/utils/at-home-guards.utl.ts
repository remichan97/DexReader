/**
 * Utility class for at-home endpoint guards.
 * This util class is used to validate the incoming proxy request are for MangaDex covers or chapter images.
 * It ensures that the request is only for allowed domains and paths, preventing misuse of the proxy.
 *
 * Allowed domains:
 * upload.mangadex.org
 * Any URL returned from the /at-home/server endpoint for chapter images
 */

import { mainLog } from '../../services/logging/main-logging.service'

interface IAllowedDomains {
  url: string
  expiredAt: number
}

export class AtHomeGuardsUtil {
  // Allowed domains for at-home proxying, keyed by hash, and the baseUrl returned from the /at-home/server endpoint.
  // This is used to validate that the request is for a given chapter.
  private readonly allowedDomains: Record<string, IAllowedDomains> = {}
  private cleanupInterval?: NodeJS.Timeout
  private readonly CLEANUP_INTERVAL = 60 * 1000 // Cleanup every 60 seconds
  private readonly ALLOWED_DOMAIN_EXPIRATION = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.startCleanupInterval()
  }

  /**
   * Check if the given URL is allowed for proxying.
   * @param url The URL to check.
   * @returns True if the URL is allowed, false otherwise.
   */
  public isUrlAllowed(url: string, hash?: string): boolean {
    try {
      const parsedUrl = new URL(url)
      const hostname = parsedUrl.hostname

      // Allow MangaDex upload domain for covers
      if (hostname === 'uploads.mangadex.org' && parsedUrl.pathname.startsWith('/covers/')) {
        return true
      }

      // Not a cover, but no hash provided, early return false
      if (!hash) {
        mainLog.warn('[AtHomeGuardsUtil] No hash provided for non-cover URL:', url)
        return false
      }

      // Bogus hash, early return false
      if (!this.allowedDomains[hash]) {
        mainLog.warn(`[AtHomeGuardsUtil] No allowed domain recorded for hash: ${hash}`)
        return false
      }

      if (Date.now() > this.allowedDomains[hash]?.expiredAt) {
        delete this.allowedDomains[hash]
        mainLog.warn(`[AtHomeGuardsUtil] Expired allowed domain for hash: ${hash}`)
        return false
      }

      // Allow any URL returned from the /at-home/server endpoint for chapter images
      if (parsedUrl.origin === this.allowedDomains[hash]?.url) {
        return true
      }

      return false
    } catch (error) {
      mainLog.error('[AtHomeGuardsUtil] Invalid URL:', url, error)
      return false
    }
  }

  /**
   * Number of hashes currently recorded as allowed (expired or not).
   * Exposed for observability/testing rather than security checks.
   */
  public getRecordedHashCount(): number {
    return Object.keys(this.allowedDomains).length
  }

  public recordAtHomeRequest(hash: string, baseUrl: string): void {
    this.allowedDomains[hash] = {
      url: baseUrl,
      expiredAt: Date.now() + this.ALLOWED_DOMAIN_EXPIRATION
    } // 15 minute expiration
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const hash in this.allowedDomains) {
        if (now > this.allowedDomains[hash].expiredAt) {
          delete this.allowedDomains[hash]
          mainLog.warn(`[AtHomeGuardsUtil] Allowed domain expired for hash: ${hash}`)
        }
      }
    }, this.CLEANUP_INTERVAL) // Cleanup every 60 seconds
  }

  public destroy(): void {
    // Destroy interval and clear allowed domains
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    for (const hash in this.allowedDomains) {
      delete this.allowedDomains[hash]
    }
    mainLog.warn('[AtHomeGuardsUtil] Cleanup complete, all allowed domains cleared')
  }
}

export const atHomeGuardsUtil = new AtHomeGuardsUtil()
