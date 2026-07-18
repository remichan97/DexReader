import { net, protocol } from 'electron'
import { ApiConfig } from '../constants/api-config.constant'
import { diskCacheUtil } from '../utils/disk-cache.util'
import { LRUMemoryCache } from '../utils/lru-memory-cache.util'
import { memoryCacheUtil } from '../utils/memory-cache.util'
import { mainLog } from '../../services/logging/main-logging.service'
import { atHomeGuardsUtil } from '../utils/at-home-guards.utl'

interface CacheEntry {
  buffer: Buffer
  timestamp: number
  size: number
  lastAccessed: number
}

export class ImageProxy {
  private chapterCache!: LRUMemoryCache<CacheEntry>
  private coverCache!: LRUMemoryCache<CacheEntry>

  private readonly MAX_COVER_CACHE = 20 * 1024 * 1024 // 20 MB
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Run cleanup every 5 minutes

  private cleanupTimer?: NodeJS.Timeout
  private isInitialized = false

  /**
   * Initialize cache with dynamic sizes from settings
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Get current cache tier from settings
      const maxChapterCache = await memoryCacheUtil.getMemoryLimit()

      // Initialize caches
      this.chapterCache = new LRUMemoryCache<CacheEntry>(maxChapterCache)
      this.coverCache = new LRUMemoryCache<CacheEntry>(this.MAX_COVER_CACHE)

      this.isInitialized = true
      mainLog.info(
        `[ImageProxy] Initialized with chapter cache: ${(maxChapterCache / 1024 / 1024).toFixed(1)}MB, cover cache: ${(this.MAX_COVER_CACHE / 1024 / 1024).toFixed(1)}MB`
      )
    } catch (error) {
      mainLog.error('[ImageProxy] Failed to initialize cache:', error)
      // Fallback to default size (200MB)
      this.chapterCache = new LRUMemoryCache<CacheEntry>(200 * 1024 * 1024)
      this.coverCache = new LRUMemoryCache<CacheEntry>(this.MAX_COVER_CACHE)
      this.isInitialized = true
    }
  }

  /**
   * Update chapter cache size dynamically (e.g., when settings change)
   */
  async updateChapterCacheSize(): Promise<void> {
    if (!this.isInitialized) return

    try {
      const newMaxSize = await memoryCacheUtil.getMemoryLimit()
      this.chapterCache.updateMaxSize(newMaxSize)
    } catch (error) {
      mainLog.error('[ImageProxy] Failed to update cache size:', error)
    }
  }

  async registerProtocol(): Promise<void> {
    // Initialize caches with dynamic sizes
    await this.initialize()

    protocol.handle('mangadex', async (request) => {
      const url = request.url.replace('mangadex://', 'https://')
      const isCover = url.includes('/covers/')

      const cache = isCover ? this.coverCache : this.chapterCache
      const cached = cache.get(url)

      if (cached) {
        // Check expiry only for chapter images, covers never expire
        const isExpired = !isCover && this.isExpired(cached)
        if (isExpired) {
          // Expired entry - this is NOT a hit, will fetch from network
          if (isCover) {
            this.coverCache.delete(url)
          } else {
            this.chapterCache.delete(url)
          }
          // Don't return here, fall through to network fetch
        } else {
          // Valid cache hit - LRU update is handled automatically by the cache
          const cachedBuffer = Buffer.from(cached.buffer)
          return new Response(cachedBuffer.buffer, {
            headers: { 'Content-Type': this.getContentType(url), 'Cache-Control': 'no-store' }
          })
        }
      }

      // If this is a cover image, check disk cache before network
      if (isCover) {
        const diskCachedBuffer = await diskCacheUtil.loadCoverFromDisk(url)
        if (diskCachedBuffer) {
          // Disk cache hit - add to in-memory cache for faster subsequent access
          const now = Date.now()
          this.coverCache.set(url, {
            buffer: diskCachedBuffer,
            timestamp: now,
            size: diskCachedBuffer.length,
            lastAccessed: now
          })
          return new Response(diskCachedBuffer.buffer as ArrayBuffer, {
            headers: { 'Content-Type': this.getContentType(url), 'Cache-Control': 'no-store' }
          })
        }
      }

      // Validate the URL against allowed domains for at-home proxying
      const hashMatch = new RegExp(/\/data\/([^/]+)\//).exec(url)
      const hash = hashMatch ? hashMatch[1] : undefined

      if (!atHomeGuardsUtil.isUrlAllowed(url, hash)) {
        mainLog.warn('[ImageProxy] Refused to proxy for URL:', url)
        return new Response('Access denied', { status: 403 })
      }

      // Fetch from network
      try {
        const response = await net.fetch(url, {
          headers: { 'User-Agent': ApiConfig.REQUEST_USER_AGENT }
        })

        if (!response.ok) {
          throw new Error(`Unable to fetch image: ${response.status}, ${response.statusText}`)
        }

        const buffer = Buffer.from(await response.arrayBuffer())

        // Cache the image
        const now = Date.now()
        if (isCover) {
          this.coverCache.set(url, {
            buffer,
            timestamp: now,
            size: buffer.length,
            lastAccessed: now
          })
          await diskCacheUtil.saveCoverToDisk(url, buffer) // Save cover to disk cache as well
        } else if (buffer.length < 5 * 1024 * 1024) {
          // Only cache chapter images < 5MB
          this.chapterCache.set(url, {
            buffer,
            timestamp: now,
            size: buffer.length,
            lastAccessed: now
          })
        }

        return new Response(buffer.buffer, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'no-store'
          }
        })
      } catch (error) {
        mainLog.error('[ImageProxy] Failed to fetch image:', url, error)
        return new Response('Failed to fetch image', { status: 502 })
      }
    })

    // Start background cleanup timer
    this.startCleanupTimer()
  }

  /**
   * Start periodic cleanup of expired chapter cache entries
   * Runs every 5 minutes to proactively remove expired entries (15min TTL)
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Proactively clean up expired chapter cache entries
   * Only chapter images have TTL (15 minutes), covers never expire
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    let cleanedCount = 0
    let freedBytes = 0

    for (const [url, entry] of this.chapterCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.chapterCache.delete(url)
        cleanedCount++
        freedBytes += entry.size
      }
    }

    if (cleanedCount > 0) {
      const freedMB = (freedBytes / (1024 * 1024)).toFixed(2)
      mainLog.info(
        `[ImageProxy] Cleaned ${cleanedCount} expired chapter images (freed ${freedMB} MB)`
      )
    }
  }

  /**
   * Clean up resources on app shutdown
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
      mainLog.info('[ImageProxy] Cleanup timer stopped')
    }
  }
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_TTL
  }

  private getContentType(url: string): string {
    if (url.endsWith('.png')) return 'image/png'
    if (url.endsWith('.webp')) return 'image/webp'
    return 'image/jpeg'
  }

  // Clears the chapter cache completely
  clearChapterCache(): void {
    if (this.chapterCache) {
      this.chapterCache.clear()
    }
  }

  getCacheStats(): { chapterCacheSize: number; coverCacheSize: number } {
    return {
      chapterCacheSize: this.chapterCache?.getCurrentSize() || 0,
      coverCacheSize: this.coverCache?.getCurrentSize() || 0
    }
  }
}
