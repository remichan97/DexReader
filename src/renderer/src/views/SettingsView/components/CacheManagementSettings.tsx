import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Button } from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores'
import { formatBytes } from '@renderer/utils/formatBytes'
import type { MangaCacheStatsQuery } from '../../../../../preload/index.d'
import './CacheManagementSettings.css'

export function CacheManagementSettings(): JSX.Element {
  const [cacheStats, setCacheStats] = useState<MangaCacheStatsQuery | null>(null)
  const [coverCacheSize, setCoverCacheSize] = useState<number>(0)
  const [coverCacheCount, setCoverCacheCount] = useState<number>(0)
  const [coverCacheLimit, setCoverCacheLimit] = useState<number>(50) // in MB
  const [coverCachePath, setCoverCachePath] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isClearingCovers, setIsClearingCovers] = useState(false)
  const [isCleaningMetadata, setIsCleaningMetadata] = useState(false)
  const [isClearingAllMetadata, setIsClearingAllMetadata] = useState(false)

  const showToast = useToastStore((state) => state.show)

  // Load cache data on mount
  useEffect(() => {
    async function loadCacheData(): Promise<void> {
      setIsLoading(true)
      try {
        // Load metadata cache stats
        const statsResponse = await globalThis.storage.statsMangaTable()
        if (statsResponse.success && statsResponse.data) {
          setCacheStats(statsResponse.data)
        }

        // Load cover cache info from storage data
        const storageResponse = await globalThis.downloads.getStorageInfo()
        if (storageResponse.success && storageResponse.data) {
          setCoverCacheSize(storageResponse.data.cacheSize.cacheSize)
          setCoverCacheCount(storageResponse.data.cacheSize.fileCount)
        }

        // Load current cover cache limit from settings
        const settingsResponse = await globalThis.settings.load()
        if (settingsResponse.success && settingsResponse.data) {
          const limitInBytes = settingsResponse.data.downloads.maxDiskCacheSize
          setCoverCacheLimit(limitInBytes === 0 ? 0 : limitInBytes / (1024 * 1024))
        }

        // Load cover cache path
        const pathsResponse = await globalThis.fileSystem.getAllowedPaths()
        if (pathsResponse.success && pathsResponse.data) {
          // Cover cache is at appData/cached/covers
          const basePath = pathsResponse.data.appData
          const fullPath = [basePath, 'cached', 'covers'].join('\\')
          setCoverCachePath(fullPath)
        }
      } catch (error) {
        console.error('Error loading cache data:', error)
        showToast({
          variant: 'error',
          title: 'Failed to load cache data',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCacheData()
  }, [showToast])

  // Handle cover cache limit change
  const handleCoverLimitChange = async (value: string | string[]): Promise<void> => {
    const limitMB =
      typeof value === 'string' ? Number.parseInt(value, 10) : Number.parseInt(value[0], 10)

    try {
      const response = await globalThis.storage.setCoverCacheLimit(limitMB)
      if (response.success) {
        setCoverCacheLimit(limitMB)
        showToast({
          variant: 'success',
          title: 'Cover cache limit updated',
          message: limitMB === 0 ? 'Cache is now unlimited' : `Set to ${limitMB} MB`
        })
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to update cache limit'
        })
      }
    } catch (error) {
      console.error('Error updating cover cache limit:', error)
      showToast({
        variant: 'error',
        title: 'Failed to update cache limit',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle clear all covers
  const handleClearCovers = async (): Promise<void> => {
    const confirmed = await globalThis.api.showConfirmDialog(
      'Clear all cached covers?',
      `This will delete ${coverCacheCount} cached images (${formatBytes(coverCacheSize)}).\n\nCover images will be re-downloaded as needed when browsing. This may temporarily slow down performance.`,
      'Clear All',
      'Cancel'
    )

    if (!confirmed.success || !confirmed.data) return

    setIsClearingCovers(true)
    try {
      const response = await globalThis.downloads.clearCoverCache()
      if (response.success) {
        const freedSpace = coverCacheSize
        const freedCount = coverCacheCount

        // Refresh cache data
        const storageResponse = await globalThis.downloads.getStorageInfo()
        if (storageResponse.success && storageResponse.data) {
          setCoverCacheSize(storageResponse.data.cacheSize.cacheSize)
          setCoverCacheCount(storageResponse.data.cacheSize.fileCount)
        }

        showToast({
          variant: 'success',
          title: 'Cover cache cleared',
          message: `Deleted ${freedCount} images, freed ${formatBytes(freedSpace)}`
        })
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to clear cover cache'
        })
      }
    } catch (error) {
      console.error('Error clearing cover cache:', error)
      showToast({
        variant: 'error',
        title: 'Failed to clear cover cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsClearingCovers(false)
    }
  }

  // Handle clean up metadata (90-day rule)
  const handleCleanMetadata = async (): Promise<void> => {
    if (!cacheStats) return

    const confirmed = await globalThis.api.showConfirmDialog(
      'Clean up metadata cache?',
      `This will remove browsing cache older than 90 days.\n\nFavourited manga and manga with downloads will not be affected.\n\nEstimated to remove: ${cacheStats.oldCache} manga`,
      'Clean Up',
      'Cancel'
    )

    if (!confirmed.success || !confirmed.data) return

    setIsCleaningMetadata(true)
    try {
      const response = await globalThis.storage.clearMangaCache(false)
      if (response.success) {
        const deletedCount = response.data ?? 0

        // Refresh stats
        const statsResponse = await globalThis.storage.statsMangaTable()
        if (statsResponse.success && statsResponse.data) {
          setCacheStats(statsResponse.data)
        }

        showToast({
          variant: 'success',
          title: 'Metadata cache cleaned',
          message: `Removed ${deletedCount} cached manga`
        })
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to clean metadata cache'
        })
      }
    } catch (error) {
      console.error('Error cleaning metadata cache:', error)
      showToast({
        variant: 'error',
        title: 'Failed to clean metadata cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsCleaningMetadata(false)
    }
  }

  // Handle clear all metadata
  const handleClearAllMetadata = async (): Promise<void> => {
    if (!cacheStats) return

    const confirmed = await globalThis.api.showConfirmDialog(
      'Clear all metadata cache?',
      `This will remove ALL browsing cache (${cacheStats.browsingCache} manga).\n\nOnly favourited manga and manga with downloads will be kept.\n\nThis action cannot be undone.`,
      'Clear All',
      'Cancel'
    )

    if (!confirmed.success || !confirmed.data) return

    setIsClearingAllMetadata(true)
    try {
      const response = await globalThis.storage.clearMangaCache(true)
      if (response.success) {
        const deletedCount = response.data ?? 0

        // Refresh stats
        const statsResponse = await globalThis.storage.statsMangaTable()
        if (statsResponse.success && statsResponse.data) {
          setCacheStats(statsResponse.data)
        }

        showToast({
          variant: 'success',
          title: 'Metadata cache cleared',
          message: `Removed ${deletedCount} cached manga`
        })
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to clear metadata cache'
        })
      }
    } catch (error) {
      console.error('Error clearing metadata cache:', error)
      showToast({
        variant: 'error',
        title: 'Failed to clear metadata cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsClearingAllMetadata(false)
    }
  }

  // Cover cache limit options
  const coverLimitOptions: SelectOption[] = [
    { value: '10', label: '10 MB' },
    { value: '25', label: '25 MB' },
    { value: '50', label: '50 MB' },
    { value: '100', label: '100 MB' },
    { value: '250', label: '250 MB' },
    { value: '500', label: '500 MB' },
    { value: '0', label: 'Unlimited' }
  ]

  if (isLoading) {
    return (
      <div className="cache-settings__loading">
        <div className="text-secondary">Loading cache data...</div>
      </div>
    )
  }

  const coverUsagePercent =
    coverCacheLimit === 0 ? 0 : Math.round((coverCacheSize / (coverCacheLimit * 1024 * 1024)) * 100)

  return (
    <div className="cache-settings__container">
      {/* Cover Image Cache Section */}
      <div>
        <h4 className="cache-settings__heading">Cover Image Cache</h4>
        <p className="cache-settings__description">
          Manage temporary cover image storage to improve browsing performance.
        </p>

        <Select
          value={String(coverCacheLimit)}
          onChange={handleCoverLimitChange}
          options={coverLimitOptions}
          label="Cache Size Limit"
          helperText={
            coverCacheLimit === 0
              ? 'Cache all covers without limits. Older covers are automatically removed when needed.'
              : 'Older covers are automatically removed when the limit is reached.'
          }
        />

        <div className="cache-settings__info-box">
          <div className="cache-settings__info-row">
            <strong>Current Usage:</strong>{' '}
            {coverCacheLimit === 0
              ? `${formatBytes(coverCacheSize)} (Unlimited)`
              : `${formatBytes(coverCacheSize)} / ${formatBytes(coverCacheLimit * 1024 * 1024)} (${coverUsagePercent}%)`}
          </div>
          <div className="cache-settings__info-row">
            <strong>Cached Covers:</strong> {coverCacheCount.toLocaleString()} images
          </div>
          {coverCachePath && (
            <div className="cache-settings__cache-path">Cache Location: {coverCachePath}</div>
          )}
        </div>

        <div className="cache-settings__actions">
          <Button
            variant="secondary"
            onClick={handleClearCovers}
            loading={isClearingCovers}
            disabled={coverCacheCount === 0}
          >
            Clear All Covers
          </Button>
        </div>
      </div>

      {/* Manga Metadata Cache Section */}
      <div className="cache-settings__divider">
        <h4 className="cache-settings__heading">Manga Metadata Cache</h4>
        <p className="cache-settings__description">
          Manage cached manga information for offline access.
        </p>

        {cacheStats && (
          <div className="cache-settings__stats-box">
            <div className="cache-settings__info-row">
              <strong>Total Cached:</strong> {cacheStats.totalManga.toLocaleString()} manga
            </div>
            <div className="cache-settings__stats-breakdown">
              <div className="text-secondary cache-settings__info-row">
                • In Library: {cacheStats.totalFavouriteManga.toLocaleString()} manga (protected)
              </div>
              <div className="text-secondary cache-settings__info-row">
                • Downloaded: {cacheStats.downloadedManga.toLocaleString()} manga (protected)
              </div>
              <div className="text-secondary">
                • Browsing Cache: {cacheStats.browsingCache.toLocaleString()} manga
              </div>
            </div>

            <div className="cache-settings__stats-note">
              <div className="cache-settings__note-text">
                DexReader automatically manages this cache by removing non-library manga that
                haven&rsquo;t been accessed in 90 days.
              </div>
              {cacheStats.oldCache > 0 && (
                <div className="cache-settings__ready-to-clean">
                  Ready to clean: {cacheStats.oldCache.toLocaleString()} manga
                </div>
              )}
            </div>
          </div>
        )}

        <div className="cache-settings__actions--multiple">
          <Button
            variant="secondary"
            onClick={handleCleanMetadata}
            loading={isCleaningMetadata}
            disabled={!cacheStats || cacheStats.oldCache === 0}
          >
            Clean Up Now
          </Button>
          <Button
            variant="danger"
            onClick={handleClearAllMetadata}
            loading={isClearingAllMetadata}
            disabled={!cacheStats || cacheStats.browsingCache === 0}
          >
            Clear All Cache
          </Button>
        </div>
      </div>
    </div>
  )
}
