import { useState, useMemo } from 'react'
import { Download, groupDownloadsByManga } from '@renderer/types/download.types'
import type { FilterOption, SortOption } from '../types'

export interface UseDownloadGroupsParams {
  downloads: Download[]
  searchQuery: string
  statusFilter: FilterOption
  sortOption: SortOption
}

export interface GroupedDownload {
  mangaId: string
  mangaTitle: string
  totalChapters: number
  activeChapters: number
  failedChapters: number
  totalStorageSize: number
  downloads: Download[]
  isExpanded: boolean
}

export interface UseDownloadGroupsReturn {
  groupedDownloads: GroupedDownload[]
  expandedGroups: Map<string, boolean>
  toggleGroup: (mangaId: string) => void
}

export function useDownloadGroups({
  downloads,
  searchQuery,
  statusFilter,
  sortOption
}: UseDownloadGroupsParams): UseDownloadGroupsReturn {
  // Track expansion state separately to avoid re-render loops
  const [expandedGroups, setExpandedGroups] = useState<Map<string, boolean>>(new Map())

  const toggleGroup = (mangaId: string): void => {
    setExpandedGroups((prev) => {
      const next = new Map(prev)
      const currentState = next.get(mangaId) ?? true
      next.set(mangaId, !currentState)
      return next
    })
  }

  // Filter downloads
  const filteredDownloads = useMemo(() => {
    let filtered = downloads

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((d) => d.status === 'downloading' || d.status === 'queued')
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((d) => d.status === 'completed')
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter((d) => d.status === 'failed')
    }

    // Apply search
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.mangaTitle.toLowerCase().includes(searchLower) ||
          d.chapterNumber.toLowerCase().includes(searchLower) ||
          d.chapterTitle?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [downloads, statusFilter, searchQuery])

  // Group and sort
  const groupedDownloads = useMemo(() => {
    const groups = groupDownloadsByManga(filteredDownloads)

    // Apply sort
    const sorted = [...groups].sort((a, b) => {
      switch (sortOption) {
        case 'recent': {
          const aRecent = Math.max(...a.downloads.map((d) => d.downloadedAt))
          const bRecent = Math.max(...b.downloads.map((d) => d.downloadedAt))
          return bRecent - aRecent
        }
        case 'largest':
          return b.totalStorageSize - a.totalStorageSize
        case 'smallest':
          return a.totalStorageSize - b.totalStorageSize
        case 'az':
          return a.mangaTitle.localeCompare(b.mangaTitle)
        case 'za':
          return b.mangaTitle.localeCompare(a.mangaTitle)
        default:
          return 0
      }
    })

    // Apply expansion state (default to expanded for new groups)
    return sorted.map((group) => ({
      ...group,
      isExpanded: expandedGroups.get(group.mangaId) ?? true
    }))
  }, [filteredDownloads, sortOption, expandedGroups])

  return {
    groupedDownloads,
    expandedGroups,
    toggleGroup
  }
}
