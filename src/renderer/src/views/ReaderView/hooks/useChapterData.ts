import { useState, useEffect, useCallback } from 'react'
import { ImageQuality } from '../../../../../main/api/enums/image-quality.enum'
import type { ImageUrlResponse } from '../../../../../preload/index.d'

type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

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

interface UseChapterDataReturn extends ChapterData {
  loadChapterImages: (id: string, startAtLastPage?: boolean) => Promise<void>
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
  const [data, setData] = useState<ChapterData>({
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
    previousChapter: null,
    nextChapter: null,
    loading: true,
    error: null
  })

  /**
   * Load chapter images from API
   */
  const loadChapterImages = useCallback(
    async (id: string, _startAtLastPage = false): Promise<void> => {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // Fetch image URLs from at-home server (wrapped in IpcResponse)
        const response = await globalThis.window.mangadex.getChapterImages(id, imageQuality)

        // Check IPC response wrapper
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || "Couldn't load the chapter pages")
        }

        const imageUrls = response.data

        // Validate response data
        if (!imageUrls || imageUrls.length === 0) {
          throw new Error("This chapter doesn't have any pages. It might be empty or unavailable.")
        }

        // Convert URLs to proxy protocol (mangadex://)
        const images = imageUrls.map((img) => ({
          ...img,
          url: img.url.replace('https://', 'mangadex://')
        }))

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
        console.error('Failed to load chapter images:', error)
        setData((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false
        }))
      }
    },
    [imageQuality, mangaId, locationState?.startPage]
  )

  /**
   * Load chapter list for navigation
   */
  const loadChapterList = useCallback(
    async (mangaIdParam: string, currentChapterId: string): Promise<void> => {
      if (!mangaIdParam) return

      // If we already have chapters from navigation state, just determine adjacent chapters
      if (data.chapters.length > 0) {
        const currentIndex = data.chapters.findIndex((ch) => ch.id === currentChapterId)
        const previousChapter = currentIndex > 0 ? data.chapters[currentIndex - 1] : null
        const nextChapter =
          currentIndex < data.chapters.length - 1 ? data.chapters[currentIndex + 1] : null

        setData((prev) => ({
          ...prev,
          previousChapter,
          nextChapter
        }))
        return
      }

      // Fallback: Fetch chapters if not provided (shouldn't happen normally)
      setData((prev) => ({ ...prev, chaptersLoading: true }))

      try {
        const chaptersResponse = await globalThis.mangadex.getMangaFeed(mangaIdParam, {
          limit: 500,
          offset: 0,
          translatedLanguage: ['en'], // Fallback to English
          order: { chapter: 'asc' },
          includes: ['scanlation_group']
        })

        if (!chaptersResponse.success || !chaptersResponse.data) {
          console.warn('Failed to load chapter list for navigation')
          setData((prev) => ({ ...prev, chaptersLoading: false }))
          return
        }

        const chapters = chaptersResponse.data.data

        // Find current chapter index
        const currentIndex = chapters.findIndex((ch) => ch.id === currentChapterId)

        // Determine previous and next chapters
        const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
        const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

        setData((prev) => ({
          ...prev,
          chapters,
          chaptersLoading: false,
          previousChapter,
          nextChapter
        }))
      } catch (error) {
        console.error('Failed to load chapter list:', error)
        setData((prev) => ({ ...prev, chaptersLoading: false }))
      }
    },
    [data.chapters]
  )

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

  // Load chapter images and list when chapterId changes
  useEffect(() => {
    if (chapterId && mangaId) {
      const startAtLastPage = locationState?.startAtLastPage || false
      loadChapterImages(chapterId, startAtLastPage).then(() => {
        loadChapterList(mangaId, chapterId)
      })
    }
  }, [chapterId, mangaId, loadChapterImages, loadChapterList, locationState?.startAtLastPage])

  return {
    ...data,
    loadChapterImages,
    setImageLoadingState,
    setCurrentPage
  }
}
