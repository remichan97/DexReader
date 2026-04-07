import { useState, useEffect, useMemo } from 'react'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import {
  parseLibraryQuery,
  getActiveFilters,
  type ParsedLibraryQuery,
  type ActiveFilter
} from '@renderer/utils/librarySearchParser'
import type { MangaWithMetadata } from '../../../../../preload/index.d'

interface UseLibraryFiltersReturn {
  filterManga: (manga: MangaWithMetadata[]) => MangaWithMetadata[]
  downloadedMangaIds: Set<string>
  parsedQuery: ParsedLibraryQuery
  activeFilters: ActiveFilter[]
}

export function useLibraryFilters(searchQuery: string): UseLibraryFiltersReturn {
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const [downloadedMangaIds, setDownloadedMangaIds] = useState<Set<string>>(new Set())

  // Parse search query to extract filters
  const parsedQuery = useMemo(() => parseLibraryQuery(searchQuery), [searchQuery])

  // Get active filters for display
  const activeFilters = useMemo(() => getActiveFilters(parsedQuery), [parsedQuery])

  // Load downloaded manga IDs on mount and when going offline
  useEffect(() => {
    const loadDownloadedManga = async (): Promise<void> => {
      try {
        const response = await globalThis.library.getDownloadedManga()
        if (response.success && response.data) {
          const ids = new Set<string>(response.data.map((m) => m.mangaId))
          setDownloadedMangaIds(ids)
        } else {
          setDownloadedMangaIds(new Set())
        }
      } catch (error) {
        console.error('Failed to load downloaded manga:', error)
        setDownloadedMangaIds(new Set())
      }
    }

    void loadDownloadedManga()
  }, [isOnline])

  const filterManga = (manga: MangaWithMetadata[]): MangaWithMetadata[] => {
    let filtered = manga

    // Filter to downloaded-only when offline
    if (!isOnline) {
      filtered = filtered.filter((m) => downloadedMangaIds.has(m.mangaId))
    }

    // Apply text search if present
    if (parsedQuery.text) {
      const searchText = parsedQuery.text.toLowerCase()
      filtered = filtered.filter((m) => {
        return (
          m.title.toLowerCase().includes(searchText) ||
          m.authors.some((author) => author.toLowerCase().includes(searchText)) ||
          m.artists.some((artist) => artist.toLowerCase().includes(searchText))
        )
      })
    }

    // Apply status filter
    if (parsedQuery.status) {
      filtered = filtered.filter((m) => m.status.toLowerCase() === parsedQuery.status)
    }

    // Apply tag filter
    if (parsedQuery.tag) {
      const tagSearch = parsedQuery.tag.toLowerCase()
      filtered = filtered.filter((m) => m.tags.some((tag) => tag.toLowerCase().includes(tagSearch)))
    }

    // Apply downloaded filter
    if (parsedQuery.downloaded !== null) {
      if (parsedQuery.downloaded) {
        // Show only downloaded manga
        filtered = filtered.filter((m) => downloadedMangaIds.has(m.mangaId))
      } else {
        // Show only non-downloaded manga
        filtered = filtered.filter((m) => !downloadedMangaIds.has(m.mangaId))
      }
    }

    // Apply author filter
    if (parsedQuery.author) {
      const authorSearch = parsedQuery.author.toLowerCase()
      filtered = filtered.filter((m) =>
        m.authors.some((author) => author.toLowerCase().includes(authorSearch))
      )
    }

    // Apply artist filter
    if (parsedQuery.artist) {
      const artistSearch = parsedQuery.artist.toLowerCase()
      filtered = filtered.filter((m) =>
        m.artists.some((artist) => artist.toLowerCase().includes(artistSearch))
      )
    }

    // Apply year filter
    if (parsedQuery.year && parsedQuery.year.value) {
      const { op, value } = parsedQuery.year
      filtered = filtered.filter((m) => {
        if (!m.year) return false

        switch (op) {
          case '>':
            return m.year > value
          case '<':
            return m.year < value
          case '=':
          default:
            return m.year === value
        }
      })
    }

    return filtered
  }

  return {
    filterManga,
    downloadedMangaIds,
    parsedQuery,
    activeFilters
  }
}
