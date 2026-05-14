import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Button } from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores'
import { formatBytes } from '@renderer/utils/formatBytes'
import type { MangaCacheStatsQuery } from '../../../../../preload/index.d'
import './CacheManagementSettings.css'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'

interface CacheManagementSettingsProps {
  readonly coverCacheLimit: number // in MB, 0 = unlimited
  readonly onCoverCacheLimitChange: (limitMB: number) => void
}

export function CacheManagementSettings({
  coverCacheLimit,
  onCoverCacheLimitChange
}: CacheManagementSettingsProps): JSX.Element {
  const { t } = useTranslation(['settings', 'dialogs', 'common', 'errors'])
  const [cacheStats, setCacheStats] = useState<MangaCacheStatsQuery | null>(null)
  const [coverCacheSize, setCoverCacheSize] = useState<number>(0)
  const [coverCacheCount, setCoverCacheCount] = useState<number>(0)
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

        // Load cover cache path
        const pathsResponse = await globalThis.fileSystem.getAllowedPaths()
        if (pathsResponse.success && pathsResponse.data) {
          // Cover cache is at appData/cached/covers
          const basePath = pathsResponse.data.appData
          const fullPath = [basePath, 'cached', 'covers'].join('\\')
          setCoverCachePath(fullPath)
        }
      } catch (error) {
        rendererLog.error('[CacheManagementSettings] Error loading cache data:', error)
        showToast({
          variant: 'error',
          title: t('errors:cache.load_failed.title'),
          message: error instanceof Error ? error.message : t('common:error.unknownError')
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCacheData()
  }, [showToast])

  // Handle cover cache limit change (local only, no auto-apply)
  const handleCoverLimitChange = (value: string | string[]): void => {
    const limitMB =
      typeof value === 'string' ? Number.parseInt(value, 10) : Number.parseInt(value[0], 10)
    onCoverCacheLimitChange(limitMB)
  }

  // Handle clear all covers
  const handleClearCovers = async (): Promise<void> => {
    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.clearCoverCache.title'),
      t('dialogs:confirmations.clearCoverCache.message', {
        count: coverCacheCount,
        size: formatBytes(coverCacheSize)
      }),
      t('common:button.delete'),
      t('common:button.cancel')
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
          title: t('settings:cacheManagement.clearCoversSuccess'),
          message: t('settings:cacheManagement.clearedCovers', {
            count: freedCount,
            size: formatBytes(freedSpace)
          })
        })
      } else {
        showToast({
          variant: 'error',
          title: t('errors:cache.clear_cover_failed.title')
        })
      }
    } catch (error) {
      rendererLog.error('[CacheManagementSettings] Error clearing cover cache:', error)
      showToast({
        variant: 'error',
        title: t('errors:cache.clear_cover_failed.title'),
        message: error instanceof Error ? error.message : t('common:error.unknownError')
      })
    } finally {
      setIsClearingCovers(false)
    }
  }

  // Handle clean up metadata (90-day rule)
  const handleCleanMetadata = async (): Promise<void> => {
    if (!cacheStats) return

    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.cleanMetadataCache.title'),
      t('dialogs:confirmations.cleanMetadataCache.message', { count: cacheStats.oldCache }),
      t('settings:cacheManagement.cleanMetadataButton'),
      t('common:button.cancel')
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
          title: t('settings:cacheManagement.cleanMetadataSuccess'),
          message: t('settings:cacheManagement.cleanedMetadata', { count: deletedCount })
        })
      } else {
        showToast({
          variant: 'error',
          title: t('errors:cache.clean_metadata_failed.title')
        })
      }
    } catch (error) {
      rendererLog.error('[CacheManagementSettings] Error cleaning metadata cache:', error)
      showToast({
        variant: 'error',
        title: t('errors:cache.clean_metadata_failed.title'),
        message: error instanceof Error ? error.message : t('common:error.unknownError')
      })
    } finally {
      setIsCleaningMetadata(false)
    }
  }

  // Handle clear all metadata
  const handleClearAllMetadata = async (): Promise<void> => {
    if (!cacheStats) return

    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.clearAllMetadata.title'),
      t('dialogs:confirmations.clearAllMetadata.message', { count: cacheStats.browsingCache }),
      t('common:button.delete'),
      t('common:button.cancel')
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
          title: t('settings:cacheManagement.clearAllMetadataSuccess'),
          message: t('settings:cacheManagement.cleanedMetadata', { count: deletedCount })
        })
      } else {
        showToast({
          variant: 'error',
          title: t('errors:cache.clear_metadata_failed.title')
        })
      }
    } catch (error) {
      rendererLog.error('[CacheManagementSettings] Error clearing metadata cache:', error)
      showToast({
        variant: 'error',
        title: t('errors:cache.clear_metadata_failed.title'),
        message: error instanceof Error ? error.message : t('common:error.unknownError')
      })
    } finally {
      setIsClearingAllMetadata(false)
    }
  }

  // Cover cache limit options
  const coverLimitOptions: SelectOption[] = [
    { value: '10', label: t('settings:cacheManagement.coverCacheLimitOptions.10') },
    { value: '25', label: t('settings:cacheManagement.coverCacheLimitOptions.25') },
    { value: '50', label: t('settings:cacheManagement.coverCacheLimitOptions.50') },
    { value: '100', label: t('settings:cacheManagement.coverCacheLimitOptions.100') },
    { value: '250', label: t('settings:cacheManagement.coverCacheLimitOptions.250') },
    { value: '500', label: t('settings:cacheManagement.coverCacheLimitOptions.500') },
    { value: '0', label: t('settings:cacheManagement.coverCacheLimitOptions.unlimited') }
  ]

  if (isLoading) {
    return (
      <div className="cache-settings__loading flex flex-col gap-5">
        <div className="text-secondary">
          {t('settings:cacheManagement.loadingCacheData', {
            defaultValue: 'Loading cache data...'
          })}
        </div>
      </div>
    )
  }

  const coverUsagePercent =
    coverCacheLimit === 0 ? 0 : Math.round((coverCacheSize / (coverCacheLimit * 1024 * 1024)) * 100)

  return (
    <div className="cache-settings__container flex flex-col gap-6">
      {/* Cover Image Cache Section */}
      <div>
        <h4 className="cache-settings__heading">
          {t('settings:cacheManagement.coverCacheSection')}
        </h4>
        <p className="cache-settings__description">
          {t('settings:cacheManagement.coverCacheDescription')}
        </p>

        <Select
          value={String(coverCacheLimit)}
          onChange={handleCoverLimitChange}
          options={coverLimitOptions}
          label={t('settings:cacheManagement.coverCacheLimitLabel')}
          helperText={
            coverCacheLimit === 0
              ? t('settings:cacheManagement.coverCacheLimitHelper.unlimited')
              : t('settings:cacheManagement.coverCacheLimitHelper.limited')
          }
        />

        <div className="cache-settings__info-box">
          <div className="cache-settings__info-row">
            <strong>{t('settings:cacheManagement.currentUsage')}</strong>{' '}
            {coverCacheLimit === 0
              ? t('settings:cacheManagement.usageUnlimited', { size: formatBytes(coverCacheSize) })
              : t('settings:cacheManagement.usageLimited', {
                  size: formatBytes(coverCacheSize),
                  limit: formatBytes(coverCacheLimit * 1024 * 1024),
                  percent: coverUsagePercent
                })}
          </div>
          <div className="cache-settings__info-row">
            {t('settings:cacheManagement.cachedCovers', { count: coverCacheCount })}
          </div>
          {coverCachePath && (
            <div className="cache-settings__cache-path">
              {t('settings:cacheManagement.cacheLocation', { path: coverCachePath })}
            </div>
          )}
        </div>

        <div className="cache-settings__actions">
          <Button
            variant="secondary"
            onClick={handleClearCovers}
            loading={isClearingCovers}
            disabled={coverCacheCount === 0}
          >
            {t('settings:cacheManagement.clearAllCoversButton')}
          </Button>
        </div>
      </div>

      {/* Manga Metadata Cache Section */}
      <div className="cache-settings__divider">
        <h4 className="cache-settings__heading">
          {t('settings:cacheManagement.metadataCacheSection')}
        </h4>
        <p className="cache-settings__description">
          {t('settings:cacheManagement.metadataCacheDescription')}
        </p>

        {cacheStats && (
          <div className="cache-settings__stats-box">
            <div className="cache-settings__info-row">
              {t('settings:cacheManagement.totalCached', {
                count: cacheStats.totalManga,
                defaultValue: 'Total Cached: {{count}} manga'
              })}
            </div>
            <div className="cache-settings__stats-breakdown">
              <div className="text-secondary cache-settings__info-row">
                {t('settings:cacheManagement.inLibrary', {
                  count: cacheStats.totalFavouriteManga,
                  defaultValue: '• In Library: {{count}} manga (protected)'
                })}
              </div>
              <div className="text-secondary cache-settings__info-row">
                {t('settings:cacheManagement.downloaded', {
                  count: cacheStats.downloadedManga,
                  defaultValue: '• Downloaded: {{count}} manga (protected)'
                })}
              </div>
              <div className="text-secondary">
                {t('settings:cacheManagement.browsingCache', {
                  count: cacheStats.browsingCache,
                  defaultValue: '• Browsing Cache: {{count}} manga'
                })}
              </div>
            </div>

            <div className="cache-settings__stats-note">
              <div className="cache-settings__note-text">
                {t('settings:cacheManagement.autoManageNote', {
                  defaultValue:
                    "DexReader automatically manages this cache by removing non-library manga that haven't been accessed in 90 days."
                })}
              </div>
              {cacheStats.oldCache > 0 && (
                <div className="cache-settings__ready-to-clean">
                  {t('settings:cacheManagement.readyToClean', {
                    count: cacheStats.oldCache,
                    defaultValue: 'Ready to clean: {{count}} manga'
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="cache-settings__actions--multiple flex gap-3">
          <Button
            variant="secondary"
            onClick={handleCleanMetadata}
            loading={isCleaningMetadata}
            disabled={!cacheStats || cacheStats.oldCache === 0}
          >
            {t('settings:cacheManagement.cleanUpNowButton', { defaultValue: 'Clean Up Now' })}
          </Button>
          <Button
            variant="danger"
            onClick={handleClearAllMetadata}
            loading={isClearingAllMetadata}
            disabled={!cacheStats || cacheStats.browsingCache === 0}
          >
            {t('settings:cacheManagement.clearAllCacheButton', { defaultValue: 'Clear All Cache' })}
          </Button>
        </div>
      </div>
    </div>
  )
}
