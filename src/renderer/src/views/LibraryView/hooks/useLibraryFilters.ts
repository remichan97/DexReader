import { useState, useEffect } from 'react'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'

interface MangaItem {
  mangaId: string
  coverUrl?: string
  title: string
  authors: string[]
  status: string
  lastChapter?: string
  hasNewChapters?: boolean
}

interface UseLibraryFiltersReturn {
  filterManga: (manga: MangaItem[]) => MangaItem[]
  downloadedMangaIds: Set<string>
}

export function useLibraryFilters(searchQuery: string): UseLibraryFiltersReturn {
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const [downloadedMangaIds, setDownloadedMangaIds] = useState<Set<string>>(new Set())

  // Load downloaded manga IDs when going offline
  useEffect(() => {
    const loadDownloadedManga = async (): Promise<void> => {
      if (!isOnline) {
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
    }

    void loadDownloadedManga()
  }, [isOnline])

  const filterManga = (manga: MangaItem[]): MangaItem[] => {
    let filtered = manga

    // Filter to downloaded-only when offline
    if (!isOnline) {
      filtered = filtered.filter((m) => downloadedMangaIds.has(m.mangaId))
    }

    // Apply search query if present
    if (searchQuery) {
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return filtered
  }

  return {
    filterManga,
    downloadedMangaIds
  }
}
