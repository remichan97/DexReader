import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { StorageChart } from '@renderer/components/StorageChart'
import { MangaStorageList } from '@renderer/components/MangaStorageList'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { formatBytes } from '@renderer/utils/formatBytes'
import type { StorageData } from '../../../../../preload/index.d'
import { rendererLog } from '@renderer/services/logging.service'

export function StorageManagementSettings(): JSX.Element {
  const { t } = useTranslation(['settings', 'common', 'errors'])
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMangaIds, setSelectedMangaIds] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'title' | 'storage'>('storage')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isDeleting, setIsDeleting] = useState(false)

  const showToast = useToastStore((state) => state.show)

  // Load storage data on mount
  useEffect(() => {
    async function loadStorageData(): Promise<void> {
      try {
        const response = await globalThis.downloads.getStorageInfo()
        if (response.success && response.data) {
          setStorageData(response.data)
        } else {
          showToast({
            variant: 'error',
            title: t('errors:storage.load_failed.title')
          })
        }
      } catch (error) {
        rendererLog.error('[StorageManagementSettings] Error loading storage data:', error)
        showToast({
          variant: 'error',
          title: t('errors:storage.load_failed.title'),
          message: error instanceof Error ? error.message : t('common:message.error.unknownError')
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStorageData()
  }, [showToast, t])

  // Handle manga selection toggle
  const handleToggleSelect = (mangaId: string): void => {
    setSelectedMangaIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(mangaId)) {
        newSet.delete(mangaId)
      } else {
        newSet.add(mangaId)
      }
      return newSet
    })
  }

  // Handle sort change
  const handleSortChange = (newSortBy: 'title' | 'storage', newDirection: 'asc' | 'desc'): void => {
    setSortBy(newSortBy)
    setSortDirection(newDirection)
  }

  // Handle deletion
  const handleDelete = async (): Promise<void> => {
    if (selectedMangaIds.size === 0) return

    const selectedManga = storageData?.mangaStorage.mangaStorageByTitle.filter((m) =>
      selectedMangaIds.has(m.mangaId)
    )
    if (!selectedManga) return

    // Calculate total size to delete
    const totalSize = selectedManga.reduce((sum, m) => sum + m.totalStorageSize, 0)

    // Build confirmation message
    const mangaList = selectedManga
      .map((m) => `• ${m.mangaTitle} (${formatBytes(m.totalStorageSize)})`)
      .join('\n')

    const confirmed = await globalThis.api.showConfirmDialog(
      t('settings:storage.deleteConfirm.title', { count: selectedMangaIds.size }),
      t('settings:storage.deleteConfirm.message', {
        count: selectedMangaIds.size,
        list: mangaList,
        size: formatBytes(totalSize)
      }),
      t('common:button.delete'),
      t('common:button.cancel')
    )

    if (confirmed.success && !confirmed.data) return

    setIsDeleting(true)

    try {
      const response = await globalThis.downloads.batchDeleteManga(Array.from(selectedMangaIds))

      if (response.success) {
        // Refresh storage data
        const refreshResponse = await globalThis.downloads.getStorageInfo()
        if (refreshResponse.success && refreshResponse.data) {
          setStorageData(refreshResponse.data)
        }

        setSelectedMangaIds(new Set())
        showToast({
          variant: 'success',
          title: t('settings:storage.deleteSuccess', { count: selectedMangaIds.size }),
          message: t('settings:storage.deletedSpace', { size: formatBytes(totalSize) })
        })
      } else {
        showToast({
          variant: 'error',
          title: t('errors:storage.delete_failed.title')
        })
      }
    } catch (error) {
      rendererLog.error('[StorageManagementSettings] Error deleting manga:', error)
      showToast({
        variant: 'error',
        title: t('errors:storage.delete_failed.title'),
        message: error instanceof Error ? error.message : t('common:message.error.unknownError')
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Sort manga list
  const sortedManga = storageData?.mangaStorage.mangaStorageByTitle
    ? [...storageData.mangaStorage.mangaStorageByTitle].sort((a, b) => {
        if (sortBy === 'title') {
          const comparison = a.mangaTitle.localeCompare(b.mangaTitle)
          return sortDirection === 'asc' ? comparison : -comparison
        } else {
          // Sort by storage
          const comparison = a.totalStorageSize - b.totalStorageSize
          return sortDirection === 'asc' ? comparison : -comparison
        }
      })
    : []

  if (isLoading) {
    return (
      <div className="py-4 flex flex-col gap-5">
        <div className="text-secondary">{t('settings:storage.loadingStorage')}</div>
      </div>
    )
  }

  if (!storageData) {
    return (
      <div className="py-4 flex flex-col gap-5">
        <div className="text-secondary">{t('errors:storage.load_failed.title')}</div>
      </div>
    )
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      {/* Disk Space Header */}
      <div>
        <h3 className="text-subtitle mb-2">
          {t('settings:storage.diskSpaceTitle', {
            total: (storageData.diskSpace.total / 1024 ** 3).toFixed(1)
          })}
        </h3>
        <p className="text-secondary text-caption">
          {t('settings:storage.diskSpaceUsage', {
            used: (storageData.diskSpace.used / 1024 ** 3).toFixed(1),
            free: (storageData.diskSpace.free / 1024 ** 3).toFixed(1)
          })}
        </p>
      </div>

      {/* Storage Chart */}
      <StorageChart
        diskSpace={storageData.diskSpace}
        dexReaderSize={storageData.mangaStorage.totalAppStorage}
      />

      {/* Manga Storage List */}
      <MangaStorageList
        items={sortedManga}
        totalSize={storageData.mangaStorage.totalAppStorage}
        selectedIds={selectedMangaIds}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onToggleSelect={handleToggleSelect}
        onSortChange={handleSortChange}
      />

      {/* Delete Button */}
      <div className="flex justify-end">
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={selectedMangaIds.size === 0 || isDeleting}
          loading={isDeleting}
        >
          {t('settings:storage.deleteSelectedButton', { count: selectedMangaIds.size })}
        </Button>
      </div>
    </div>
  )
}
