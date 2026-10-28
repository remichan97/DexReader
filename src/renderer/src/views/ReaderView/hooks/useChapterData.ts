import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import type { ImageUrlResponse, ChapterContract } from '../../../../../preload/window.types'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { rendererLog } from '@renderer/services/logging.service'
import { toError } from '@shared/utils/to-error.util'
import { loadChapterFeed } from '@renderer/utils/chapterFeedLoader'

type ChapterEntity = ChapterContract

interface LocationState {
  chapterNumber?: string
  chapterTitle?: string
  mangaTitle?: string
  coverUrl?: string
  chapters?: ChapterEntity[]
  /** False when the manga's page handed over a list that was still loading (see below) */
  chaptersComplete?: boolean
  /** The language the handed-over list is filtered to; undefined when it holds every language */
  chapterLanguage?: string
  startAtLastPage?: boolean
  startPage?: number
}

/** The language of the chapter list when the reader has to load one itself (no list was passed) */
const FALLBACK_CHAPTER_LANGUAGE = 'en'

/**
 * Which list wins when navigation hands the reader one. The reader passes its own list along each
 * time it moves between chapters, and a list that finished loading in the meantime must not be
 * replaced by the shorter one that was current when the user clicked.
 */
function pickChapterList(
  current: ChapterEntity[],
  incoming: ChapterEntity[] | undefined
): ChapterEntity[] {
  if (!incoming) return current
  return incoming.length >= current.length ? incoming : current
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
  // False while the manga page's list is still loading its later pages; finished here, in the background
  const [chaptersComplete, setChaptersComplete] = useState(
    locationState?.chaptersComplete !== false
  )
  // Fixed by the first navigation: a list loaded here must be filtered like the one handed over
  const feedLanguageRef = useRef<string | undefined>(
    locationState?.chapters?.length ? locationState.chapterLanguage : FALLBACK_CHAPTER_LANGUAGE
  )

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
        chapters: pickChapterList(prev.chapters, locationState.chapters)
      }))
    }
  }, [chapterId, locationKey, locationState])

  // Load chapter images when the chapter changes
  useEffect(() => {
    if (chapterId && mangaId) {
      void loadChapterImages(chapterId)
    }
  }, [chapterId, mangaId, loadChapterImages])

  // Load the chapter list when navigation didn't supply one (opened from History or Downloads), and
  // finish it when the manga page handed over a list that was still loading. Keyed on whether a list
  // is still needed rather than on the list itself, so an empty result cannot retrigger the fetch
  // and the pages after the first aren't cancelled by the list appearing.
  const needsChapterList = !hasChapters || !chaptersComplete
  // Not the id itself: moving to another chapter mid-load shouldn't restart the load
  const hasChapterId = Boolean(chapterId)
  useEffect(() => {
    if (!hasChapterId || !mangaId || !needsChapterList) return

    const controller = new AbortController()

    const loadChapterList = async (): Promise<void> => {
      setData((prev) => ({ ...prev, chaptersLoading: true }))

      try {
        // Check if online before fetching chapter list
        if (!useConnectivityStore.getState().isOnline) return

        await loadChapterFeed({
          mangaId,
          language: feedLanguageRef.current,
          direction: 'asc',
          signal: controller.signal,
          onPage: (progress) => {
            if (controller.signal.aborted) return
            setData((prev) => ({ ...prev, chapters: progress.chapters }))
            setChaptersComplete(progress.complete)
          }
        })
      } catch (error) {
        rendererLog.error('[useChapterData] Failed to load chapter list:', error)
      } finally {
        if (!controller.signal.aborted) {
          setData((prev) => ({ ...prev, chaptersLoading: false }))
        }
      }
    }

    void loadChapterList()

    return () => {
      controller.abort()
    }
  }, [hasChapterId, mangaId, needsChapterList])

  return {
    ...data,
    previousChapter,
    nextChapter,
    loadChapterImages,
    setImageLoadingState,
    setCurrentPage
  }
}
