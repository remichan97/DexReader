import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { StorageChart } from '@renderer/components/StorageChart'
import { MangaStorageList } from '@renderer/components/MangaStorageList'
import { Button } from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores'
import type { StorageData } from '../../../../../preload/index.d'

export function StorageManagementSettings(): JSX.Element {
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
            title: 'Failed to load storage data'
          })
        }
      } catch (error) {
        console.error('Error loading storage data:', error)
        showToast({
          variant: 'error',
          title: 'Failed to load storage data',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStorageData()
  }, [showToast])

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
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
    }

    // Build confirmation message
    const mangaList = selectedManga
      .map((m) => `• ${m.mangaTitle} (${formatBytes(m.totalStorageSize)})`)
      .join('\n')
    const message = `You are about to permanently delete:\n${mangaList}\n\nTotal: ${formatBytes(totalSize)} will be freed\n\nThis action cannot be undone.`

    const confirmed = await globalThis.api.showConfirmDialog(
      `Delete ${selectedMangaIds.size} manga?`,
      message,
      'Delete',
      'Cancel'
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
          title: `Successfully deleted ${selectedMangaIds.size} manga`,
          message: `${formatBytes(totalSize)} freed`
        })
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to delete manga'
        })
      }
    } catch (error) {
      console.error('Error deleting manga:', error)
      showToast({
        variant: 'error',
        title: 'Failed to delete manga',
        message: error instanceof Error ? error.message : 'Unknown error'
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

  // Prepare chart data
  const topManga = sortedManga
    .slice()
    .sort((a, b) => b.totalStorageSize - a.totalStorageSize)
    .slice(0, 5)
    .map((m) => ({
      mangaId: m.mangaId,
      title: m.mangaTitle,
      size: m.totalStorageSize
    }))

  const topMangaSize = topManga.reduce((sum, m) => sum + m.size, 0)
  const othersSize = (storageData?.mangaStorage.totalAppStorage ?? 0) - topMangaSize

  if (isLoading) {
    return (
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'var(--win-text-secondary)' }}>Loading storage data...</div>
      </div>
    )
  }

  if (!storageData) {
    return (
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'var(--win-text-secondary)' }}>Failed to load storage data</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Disk Space Header */}
      <div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--win-text-primary)'
          }}
        >
          Total Disk Space: {(storageData.diskSpace.total / 1024 ** 3).toFixed(1)} GB
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--win-text-secondary)' }}>
          Used: {(storageData.diskSpace.used / 1024 ** 3).toFixed(1)} GB • Free:{' '}
          {(storageData.diskSpace.free / 1024 ** 3).toFixed(1)} GB
        </p>
      </div>

      {/* Storage Chart */}
      <StorageChart
        diskSpace={storageData.diskSpace}
        dexReaderSize={storageData.mangaStorage.totalAppStorage}
        topManga={topManga}
        othersSize={othersSize}
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={selectedMangaIds.size === 0 || isDeleting}
          loading={isDeleting}
        >
          Delete Selected ({selectedMangaIds.size})
        </Button>
      </div>
    </div>
  )
}
