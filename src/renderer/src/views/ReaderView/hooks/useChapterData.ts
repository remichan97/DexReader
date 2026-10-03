import { useState, useEffect, useCallback, useMemo } from 'react'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import type { ImageUrlResponse, ChapterContract } from '../../../../../preload/window.types'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { rendererLog } from '@renderer/services/logging.service'
import { toError } from '@shared/utils/to-error.util'
import { ChapterIncludes, OrderDirection } from '@shared/enums/mangadex'

type ChapterEntity = ChapterContract

interface LocationState {
  chapterNumber?: string
  chapterTitle?: string
  mangaTitle?: string
  coverUrl?: string
  chapters?: ChapterEntity[]
  startAtLastPage?: boolean
  startPage?: number
}

interface ChapterData {
  // Chapter info
  chapterId: string | null
  mangaId: string | null
  chapterTitle: string
  chapterNumber: string | null
  mangaTitle: string

  // Images
  images: ImageUrlResponse[]
  totalPages: number
  imageLoadingStates: Map<number, 'loading' | 'loaded' | 'error'>

  // Chapters list
  chapters: ChapterEntity[]
  chaptersLoading: boolean
  previousChapter: ChapterEntity | null
  nextChapter: ChapterEntity | null

  // Loading state
  loading: boolean
  error: Error | null
}

/** Adjacent chapters are derived from the chapter list rather than stored */
type ChapterState = Omit<ChapterData, 'previousChapter' | 'nextChapter'>

interface UseChapterDataReturn extends ChapterData {
  loadChapterImages: (id: string) => Promise<void>
  setImageLoadingState: (pageIndex: number, state: 'loading' | 'loaded' | 'error') => void
  setCurrentPage: (page: number) => void
}

/**
 * Custom hook for managing chapter data loading and state
 * Handles fetching chapter images, chapter list, and related metadata
 */
export function useChapterData(
  mangaId: string | undefined,
  chapterId: string | undefined,
  locationState: LocationState | null,
  locationKey: string,
  imageQuality: ImageQuality
): UseChapterDataReturn {
  const [data, setData] = useState<ChapterState>({
    chapterId: null,
    mangaId: null,
    chapterTitle: 'Loading chapter...',
    mangaTitle: locationState?.mangaTitle || 'Manga',
    chapterNumber: locationState?.chapterNumber || null,
    images: [],
    totalPages: 0,
    imageLoadingStates: new Map(),
    chapters: locationState?.chapters || [],
    chaptersLoading: false,
    loading: true,
    error: null
  })

  /**
   * Load chapter images from API or local storage
   */
  const loadChapterImages = useCallback(
    async (id: string): Promise<void> => {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // First, check if chapter is downloaded
        const downloadCheck = await globalThis.downloads.isDownloaded(id)
        const isDownloaded = downloadCheck.success && downloadCheck.data

        let images: ImageUrlResponse[]

        if (isDownloaded && downloadCheck.data) {
          // Chapter is downloaded - build local image URLs
          const download = downloadCheck.data
          const totalPages = download.totalPages

          // Build local URLs for each page using the local-manga:// protocol
          images = Array.from({ length: totalPages }, (_, index) => ({
            url: `local-manga://chapter/${id}/page/${index}`,
            filename: `${String(index).padStart(3, '0')}.jpg`,
            quality: imageQuality
          }))
        } else {
          // Chapter not downloaded - check if online before fetching from MangaDex API
          const isOnline = useConnectivityStore.getState().isOnline

          if (!isOnline) {
            throw new Error("This chapter isn't downloaded. You need to be online to read it.")
          }

          // Fetch from MangaDex API
          const response = await globalThis.window.mangadex.getChapterImages(id, imageQuality)

          // Check IPC response wrapper
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || "Couldn't load the chapter pages")
          }

          const imageUrls = response.data

          // Validate response data
          if (!imageUrls || imageUrls.length === 0) {
            throw new Error(
              "This chapter doesn't have any pages. It might be empty or unavailable."
            )
          }

          // Convert URLs to proxy protocol (mangadex://)
          images = imageUrls.map((img) => ({
            ...img,
            url: img.url.replace('https://', 'mangadex://')
          }))
        }

        setData((prev) => {
          // Initialize loading states for all images, preserving any existing loaded/error states
          const loadingStates = new Map<number, 'loading' | 'loaded' | 'error'>()
          images.forEach((_, index) => {
            const existingState = prev.imageLoadingStates.get(index)
            // Keep existing state if it's loaded or error, otherwise set to loading
            loadingStates.set(index, existingState || 'loading')
          })

          return {
            ...prev,
            images,
            totalPages: images.length,
            imageLoadingStates: loadingStates,
            loading: false,
            chapterId: id,
            mangaId: mangaId || null
          }
        })
      } catch (error) {
        rendererLog.error('[useChapterData] Failed to load chapter images:', error)
        setData((prev) => ({
          ...prev,
          error: toError(error),
          loading: false
        }))
      }
    },
    [imageQuality, mangaId]
  )

  const hasChapters = data.chapters.length > 0

  // Adjacent chapters are derived from the list, so a list update never re-triggers a load
  const { previousChapter, nextChapter } = useMemo(() => {
    const currentIndex = chapterId ? data.chapters.findIndex((ch) => ch.id === chapterId) : -1

    if (currentIndex === -1) {
      return { previousChapter: null, nextChapter: null }
    }

    return {
      previousChapter: currentIndex > 0 ? data.chapters[currentIndex - 1] : null,
      nextChapter: currentIndex < data.chapters.length - 1 ? data.chapters[currentIndex + 1] : null
    }
  }, [data.chapters, chapterId])

  /**
   * Update image loading state for a specific page
   */
  const setImageLoadingState = useCallback(
    (pageIndex: number, state: 'loading' | 'loaded' | 'error'): void => {
      setData((prev) => {
        const newStates = new Map(prev.imageLoadingStates)
        newStates.set(pageIndex, state)
        return { ...prev, imageLoadingStates: newStates }
      })
    },
    []
  )

  /**
   * Set current page (used by vertical scroll mode)
   */
  const setCurrentPage = useCallback((page: number): void => {
    setData((prev) => ({ ...prev, currentPage: page }))
  }, [])

  // Update state when chapterId or location changes (update from location state)
  useEffect(() => {
    if (chapterId && locationState) {
      // Construct proper chapter title from location state
      let chapterTitle = 'Loading chapter...'
      const chapterNum = locationState.chapterNumber
      const title = locationState.chapterTitle

      if (chapterNum && title?.trim()) {
        chapterTitle = `Chapter ${chapterNum}: ${title}`
      } else if (chapterNum) {
        chapterTitle = `Chapter ${chapterNum}`
      } else if (title?.trim()) {
        chapterTitle = title
      }

      setData((prev) => ({
        ...prev,
        chapterTitle: chapterTitle,
        chapterNumber: locationState.chapterNumber || prev.chapterNumber,
        mangaTitle: locationState.mangaTitle || prev.mangaTitle,
        chapters: locationState.chapters || prev.chapters
      }))
    }
  }, [chapterId, locationKey, locationState])

  // Load chapter images when the chapter changes
  useEffect(() => {
    if (chapterId && mangaId) {
      void loadChapterImages(chapterId)
    }
  }, [chapterId, mangaId, loadChapterImages])

  // Fetch the chapter list when navigation state didn't supply one (e.g. from History or Downloads).
  // Keyed on hasChapters rather than the list itself so an empty result cannot retrigger the fetch.
  useEffect(() => {
    if (!chapterId || !mangaId || hasChapters) return

    let cancelled = false

    const loadFallbackChapterList = async (): Promise<void> => {
      setData((prev) => ({ ...prev, chaptersLoading: true }))

      try {
        // Check if online before fetching chapter list
        if (!useConnectivityStore.getState().isOnline) return

        const chaptersResponse = await globalThis.mangadex.getMangaFeed(mangaId, {
          limit: 500,
          offset: 0,
          translatedLanguage: ['en'], // Fallback to English
          order: { chapter: OrderDirection.Asc },
          includes: [ChapterIncludes.SCANLATION_GROUP]
        })

        if (cancelled || !chaptersResponse.success || !chaptersResponse.data) return

        const chapters = chaptersResponse.data.data
        setData((prev) => ({ ...prev, chapters }))
      } catch (error) {
        rendererLog.error('[useChapterData] Failed to load chapter list:', error)
      } finally {
        setData((prev) => ({ ...prev, chaptersLoading: false }))
      }
    }

    void loadFallbackChapterList()

    return () => {
      cancelled = true
    }
  }, [chapterId, mangaId, hasChapters])

  return {
    ...data,
    previousChapter,
    nextChapter,
    loadChapterImages,
    setImageLoadingState,
    setCurrentPage
  }
}
