import { mainLog } from '../../services/logging/main-logging.service'

/**
 * Generic LRU (Least Recently Used) memory cache with size-based eviction
 */
export class LRUMemoryCache<T extends { buffer: Buffer; size: number; lastAccessed: number }> {
  private readonly cache: Map<string, T> = new Map()
  private currentSize = 0
  private maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  /**
   * Get an item from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (entry) {
      // Update last accessed time for LRU
      entry.lastAccessed = Date.now()
    }
    return entry
  }

  /**
   * Add an item to the cache, evicting LRU entries if necessary
   */
  set(key: string, value: T): void {
    // Evict least recently used entries if necessary
    while (this.currentSize + value.size > this.maxSize) {
      const lruKey = this.findLRUKey()
      if (!lruKey) break

      const lruEntry = this.cache.get(lruKey)
      if (!lruEntry) break
      this.cache.delete(lruKey)
      this.currentSize -= lruEntry.size
    }

    // Add the new entry
    this.cache.set(key, value)
    this.currentSize += value.size
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.currentSize -= entry.size
      return this.cache.delete(key)
    }
    return false
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }

  /**
   * Get all entries (for iteration/filtering)
   */
  entries(): IterableIterator<[string, T]> {
    return this.cache.entries()
  }

  /**
   * Get current cache size in bytes
   */
  getCurrentSize(): number {
    return this.currentSize
  }

  /**
   * Get maximum cache size in bytes
   */
  getMaxSize(): number {
    return this.maxSize
  }

  /**
   * Update maximum cache size and evict entries if necessary
   */
  updateMaxSize(newMaxSize: number): void {
    const oldSize = this.maxSize
    this.maxSize = newMaxSize

    // If shrinking, evict to fit
    if (newMaxSize < oldSize) {
      let evictedCount = 0
      while (this.currentSize > newMaxSize) {
        const lruKey = this.findLRUKey()
        if (!lruKey) break

        const lruEntry = this.cache.get(lruKey)
        if (!lruEntry) break
        this.cache.delete(lruKey)
        this.currentSize -= lruEntry.size
        evictedCount++
      }

      mainLog.info(
        `[LRUMemoryCache] Cache size updated: ${(newMaxSize / 1024 / 1024).toFixed(1)}MB (evicted ${evictedCount} entries)`
      )
    }
  }

  /**
   * Find the least recently used key
   */
  private findLRUKey(): string | undefined {
    let lruKey: string | undefined = undefined
    let lruTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }

    return lruKey
  }
}
