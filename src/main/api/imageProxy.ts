import { net, protocol } from 'electron'
import { ApiConfig } from './constants/api-config.constant'

interface CacheEntry {
  buffer: Buffer
  timestamp: number
  size: number
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

      if (cached && !this.isExpired(cached)) {
        const cachedBuffer = Buffer.from(cached.buffer)
        return new Response(cachedBuffer.buffer, {
          headers: { 'Content-Type': this.getContentType(url), 'Cache-Control': 'no-store' }
        })
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
    // Evict old entries if necessary
    while (this.currentChapterCacheSize + buffer.length > this.MAX_CHAPTER_CACHE) {
      const oldestKey = this.chapterCache.keys().next().value
      if (!oldestKey) break
      const oldestEntry = this.chapterCache.get(oldestKey)
      this.chapterCache.delete(oldestKey)
      this.currentChapterCacheSize -= oldestEntry!.size
    }

    this.chapterCache.set(url, {
      buffer,
      timestamp: Date.now(),
      size: buffer.length
    })
    this.currentChapterCacheSize += buffer.length
  }

  private addToCoverCache(url: string, buffer: Buffer): void {
    // Evict old entries if necessary
    while (this.currentCoverCacheSize + buffer.length > this.MAX_COVER_CACHE) {
      const oldestKey = this.coverCache.keys().next().value
      if (!oldestKey) break
      const oldestEntry = this.coverCache.get(oldestKey)
      this.coverCache.delete(oldestKey)
      this.currentCoverCacheSize -= oldestEntry!.size
    }

    this.coverCache.set(url, {
      buffer,
      timestamp: Date.now(),
      size: buffer.length
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
