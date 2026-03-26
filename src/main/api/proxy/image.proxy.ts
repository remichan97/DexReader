import { net, protocol } from 'electron'
import { ApiConfig } from '../constants/api-config.constant'
import { diskCacheUtil } from '../utils/disk-cache.util'

interface CacheEntry {
  buffer: Buffer
  timestamp: number
  size: number
  lastAccessed: number
}

interface CacheMetrics {
  memoryHit: number // In-memory cache hits
  diskHit: number // Disk cache hits (covers only)
  miss: number // Network fetches
  lruEviction: number // Evictions due to size limit
  expiryCleanup: number // Entries removed by TTL cleanup
  totalRequests: number // Total image requests
  currentSize: number
  maxSize: number
  // Calculated fields
  hitRate?: number // (memoryHit + diskHit) / totalRequests
  memoryHitRate?: number // memoryHit / totalRequests
  diskHitRate?: number // diskHit / totalRequests
}

export class ImageProxy {
  private readonly chapterCache: Map<string, CacheEntry> = new Map()
  private readonly coverCache: Map<string, CacheEntry> = new Map()

  private readonly MAX_CHAPTER_CACHE = 30 * 1024 * 1024 // 30 MB
  private readonly MAX_COVER_CACHE = 20 * 1024 * 1024 // 20 MB
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Run cleanup every 5 minutes

  private currentChapterCacheSize = 0
  private currentCoverCacheSize = 0
  private cleanupTimer?: NodeJS.Timeout

  // TODO: Metrics tracking for cache performance monitoring
  // Delete once we finished optimisation work
  private readonly chapterCacheMetrics: CacheMetrics = {
    memoryHit: 0,
    diskHit: 0,
    miss: 0,
    lruEviction: 0,
    expiryCleanup: 0,
    totalRequests: 0,
    currentSize: 0,
    maxSize: this.MAX_CHAPTER_CACHE
  }

  private readonly coverCacheMetrics: CacheMetrics = {
    memoryHit: 0,
    diskHit: 0,
    miss: 0,
    lruEviction: 0,
    expiryCleanup: 0,
    totalRequests: 0,
    currentSize: 0,
    maxSize: this.MAX_COVER_CACHE
  }

  collectMetrics(): { chapterCache: CacheMetrics; coverCache: CacheMetrics } {
    // Calculate hit rates
    const calcHitRates = (metrics: CacheMetrics): CacheMetrics => {
      const total = metrics.totalRequests || 1 // Avoid division by zero
      return {
        ...metrics,
        hitRate: ((metrics.memoryHit + metrics.diskHit) / total) * 100,
        memoryHitRate: (metrics.memoryHit / total) * 100,
        diskHitRate: (metrics.diskHit / total) * 100
      }
    }

    return {
      chapterCache: calcHitRates({
        ...this.chapterCacheMetrics,
        currentSize: this.currentChapterCacheSize
      }),
      coverCache: calcHitRates({
        ...this.coverCacheMetrics,
        currentSize: this.currentCoverCacheSize
      })
    }
  }

  registerProtocol(): void {
    protocol.handle('mangadex', async (request) => {
      const url = request.url.replace('mangadex://', 'https://')
      const isCover = url.includes('/covers/')

      // Track total requests
      if (isCover) {
        this.coverCacheMetrics.totalRequests++
      } else {
        this.chapterCacheMetrics.totalRequests++
      }

      const cache = isCover ? this.coverCache : this.chapterCache
      const cached = cache.get(url)

      if (cached) {
        // Check expiry only for chapter images, covers never expire
        const isExpired = !isCover && this.isExpired(cached)
        if (isExpired) {
          // Expired entry - this is NOT a hit, will fetch from network
          cache.delete(url)
          this.currentChapterCacheSize -= cached.size
          // Don't return here, fall through to network fetch
        } else {
          // Valid cache hit
          if (isCover) {
            this.coverCacheMetrics.memoryHit++
          } else {
            this.chapterCacheMetrics.memoryHit++
          }
          // Update last accessed time for LRU
          cached.lastAccessed = Date.now()
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
          // Disk cache hit
          this.coverCacheMetrics.diskHit++
          // Add to in-memory cache for faster subsequent access
          this.addToCoverCache(url, diskCachedBuffer)
          return new Response(diskCachedBuffer.buffer as ArrayBuffer, {
            headers: { 'Content-Type': this.getContentType(url), 'Cache-Control': 'no-store' }
          })
        }
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
        if (isCover) {
          this.coverCacheMetrics.miss++
          this.addToCoverCache(url, buffer)
          await diskCacheUtil.saveCoverToDisk(url, buffer) // Save cover to disk cache as well
        } else if (buffer.length < 5 * 1024 * 1024) {
          // Only cache chapter images < 5MB
          this.addToChapterCache(url, buffer)
          this.chapterCacheMetrics.miss++
        }

        return new Response(buffer.buffer, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'no-store'
          }
        })
      } catch (error) {
        console.error('[ImageProxy] Failed to fetch image:', url, error)
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
        this.currentChapterCacheSize -= entry.size
        this.chapterCacheMetrics.expiryCleanup++
        cleanedCount++
        freedBytes += entry.size
      }
    }

    if (cleanedCount > 0) {
      const freedMB = (freedBytes / (1024 * 1024)).toFixed(2)
      console.log(
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
      console.log('[ImageProxy] Cleanup timer stopped')
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

  private addToChapterCache(url: string, buffer: Buffer): void {
    // Evict least recently used entries if necessary
    while (this.currentChapterCacheSize + buffer.length > this.MAX_CHAPTER_CACHE) {
      let lruKey: string | undefined = undefined
      let lruTime = Infinity

      // Find least recently used entry
      for (const [key, entry] of this.chapterCache.entries()) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed
          lruKey = key
        }
      }

      if (!lruKey) break
      const lruEntry = this.chapterCache.get(lruKey)!
      this.chapterCache.delete(lruKey)
      this.currentChapterCacheSize -= lruEntry.size
      this.chapterCacheMetrics.lruEviction++
    }

    const now = Date.now()
    this.chapterCache.set(url, {
      buffer,
      timestamp: now,
      size: buffer.length,
      lastAccessed: now
    })
    this.currentChapterCacheSize += buffer.length
  }

  private addToCoverCache(url: string, buffer: Buffer): void {
    // Evict least recently used entries if necessary
    while (this.currentCoverCacheSize + buffer.length > this.MAX_COVER_CACHE) {
      let lruKey: string | undefined = undefined
      let lruTime = Infinity

      // Find least recently used entry
      for (const [key, entry] of this.coverCache.entries()) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed
          lruKey = key
        }
      }

      if (!lruKey) break
      const lruEntry = this.coverCache.get(lruKey)!
      this.coverCache.delete(lruKey)
      this.currentCoverCacheSize -= lruEntry.size
      this.coverCacheMetrics.lruEviction++
    }

    const now = Date.now()
    this.coverCache.set(url, {
      buffer,
      timestamp: now,
      size: buffer.length,
      lastAccessed: now
    })
    this.currentCoverCacheSize += buffer.length
  }

  // Clears the chapter cache completely
  clearChapterCache(): void {
    this.chapterCache.clear()
    this.currentChapterCacheSize = 0
  }

  getCacheStats(): { chapterCacheSize: number; coverCacheSize: number } {
    return {
      chapterCacheSize: this.currentChapterCacheSize,
      coverCacheSize: this.currentCoverCacheSize
    }
  }
}
