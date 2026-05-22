import { ChapterCacheTier } from '../../settings/enums/chapter-cache-tier.enum'
import os from 'node:os'
import { settingsManager } from '../../settings/settings-manager'

/**
 * Utility class for managing dynamic memory cache tiers
 */
export class MemoryCacheUtil {
  private memoryTier: Record<ChapterCacheTier, number> = {
    [ChapterCacheTier.Low]: 0, // will be calculated later
    [ChapterCacheTier.Normal]: 0, // will be calculated later
    [ChapterCacheTier.High]: 0, // will be calculated later
    [ChapterCacheTier.Custom]: 0 // Intentionally set to 0, as custom tier will be managed by user settings
  }

  constructor() {
    this.calculateDynamicTiers()
  }

  private calculateDynamicTiers(): void {
    const systemMemory = os.totalmem()

    // 1.5% of total system memory for Low, or 75 MB, whichever is smaller
    this.memoryTier[ChapterCacheTier.Low] = Math.min(
      Math.floor(systemMemory * 0.015),
      75 * 1024 * 1024
    )

    // 3.5% of total system memory for Normal, or 200 MB, whichever is smaller
    this.memoryTier[ChapterCacheTier.Normal] = Math.min(
      Math.floor(systemMemory * 0.035),
      200 * 1024 * 1024
    )

    // 5% of total system memory for High, or 350 MB, whichever is smaller
    this.memoryTier[ChapterCacheTier.High] = Math.min(
      Math.floor(systemMemory * 0.05),
      350 * 1024 * 1024
    )
  }

  /**
   * Get memory limit for the current tier (in bytes)
   */
  async getMemoryLimit(): Promise<number> {
    const tier = await this.getCurrentCacheTier()

    if (tier === ChapterCacheTier.Custom) {
      // For custom tier, query the user-defined size from settings
      const customSize = settingsManager.getByPath('reader', 'performance.customCacheSize')
      // customCacheSize is stored in bytes, return as-is
      return typeof customSize === 'number' ? customSize : 200 * 1024 * 1024 // Fallback to Normal (200MB)
    }
    return this.memoryTier[tier]
  }

  // Expose the tier values for Settings manager
  getDynamicTiers(): Record<ChapterCacheTier, number> {
    return this.memoryTier
  }

  /**
   * Get the current cache tier from settings
   */
  private async getCurrentCacheTier(): Promise<ChapterCacheTier> {
    const tier = settingsManager.getByPath('reader', 'performance.cacheTier')
    return typeof tier === 'string' &&
      Object.values(ChapterCacheTier).includes(tier as ChapterCacheTier)
      ? (tier as ChapterCacheTier)
      : ChapterCacheTier.Normal // Fallback to Normal
  }
}
export const memoryCacheUtil = new MemoryCacheUtil()
