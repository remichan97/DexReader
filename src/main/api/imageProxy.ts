import { net, protocol } from 'electron'
import { ApiConfig } from './constants/api-config.constant'

interface CacheEntry {
  buffer: Buffer
  timestamp: number
  size: number
  lastAccessed: number
}

export class ImageProxy {
  private readonly chapterCache: Map<string, CacheEntry> = new Map()
  private readonly coverCache: Map<string, CacheEntry> = new Map()

  private readonly MAX_CHAPTER_CACHE = 30 * 1024 * 1024 // 30 MB
  private readonly MAX_COVER_CACHE = 20 * 1024 * 1024 // 20 MB
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  private currentChapterCacheSize = 0
  private currentCoverCacheSize = 0

  registerProtocol(): void {
    protocol.handle('mangadex', async (request) => {
      const url = request.url.replace('mangadex://', 'https://')
      const isCover = url.includes('/covers/')

      const cache = isCover ? this.coverCache : this.chapterCache
      const cached = cache.get(url)

      if (cached) {
        // Check expiry only for chapter images, covers never expire
        const isExpired = !isCover && this.isExpired(cached)
        if (isExpired) {
          // Remove expired entry
          cache.delete(url)
          this.currentChapterCacheSize -= cached.size
        } else {
          // Update last accessed time for LRU
          cached.lastAccessed = Date.now()
          const cachedBuffer = Buffer.from(cached.buffer)
          return new Response(cachedBuffer.buffer, {
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
          this.addToCoverCache(url, buffer)
        } else if (buffer.length < 5 * 1024 * 1024) {
          // Only cache chapter images < 5MB
          this.addToChapterCache(url, buffer)
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
      let lruKey: string | null = null
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
      let lruKey: string | null = null
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
