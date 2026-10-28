import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import {
  convertDbMangaToContract,
  convertDbChaptersToContract
} from '@renderer/utils/mangaDbConversion'
import {
  fetchChapterFeedPage,
  loadChapterFeed,
  type ChapterDirection,
  type ChapterFeedProgress,
  type FeedPage
} from '@renderer/utils/chapterFeedLoader'
import { sortChaptersAscending } from '@renderer/utils/chapterOrder'
import {
  DEFAULT_CHAPTER_SORT,
  getChapterSortPreference,
  setChapterSortPreference
} from '@renderer/utils/chapterSortPreference'
import { toError } from '@shared/utils/to-error.util'
import { rendererLog } from '@renderer/services/logging.service'
import type { MangaContract, ChapterContract } from '../../../../../preload/window.types'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract
type TFunction = ReturnType<typeof useTranslation>['t']

export type ChapterSortOrder = ChapterDirection

/**
 * @param filterLanguage - the language the feed is filtered to, or undefined for every language
 * @param selectedLanguage - the language the selector shows
 */
interface FeedLanguages {
  filterLanguage: string | undefined
  selectedLanguage: string
}

interface MangaDetailDataState {
  manga: MangaEntity | null
  /**
   * Always **oldest first**, whatever order the list is shown in. The Reader steps to the previous
   * and next chapter by index in this list, Start Reading takes its first entry and Download all
   * queues it as is. `chapterSort` only changes how the chapter list displays it.
   */
  chapters: ChapterEntity[]
  loading: boolean
  error: Error | null
  selectedLanguage: string
  chapterSort: ChapterSortOrder
  chaptersLoading: boolean
  chaptersError: Error | null
  usingCachedData: boolean // Flag to indicate we're showing database cache instead of live API data
  /** False while later pages of a long series are still arriving, or after one failed */
  chaptersComplete: boolean
  /** How many chapters the API says the series has in the shown language */
  chaptersTotal: number
  /** Which end of the series arrived first; the chapters still missing are at the other end */
  chaptersLoadedFrom: 'oldest' | 'newest' | undefined
  /** A later page failed, so the list shown is partial until the load is retried */
  chaptersLoadFailed: boolean
  /**
   * The language the feed is filtered to, or undefined when it holds every language (the last
   * resort of the cascade). Whoever finishes loading the list elsewhere needs the same filter.
   */
  chaptersFilterLanguage: string | undefined
}

export interface UseMangaDetailDataResult extends MangaDetailDataState {
  setChapterSort: (order: ChapterSortOrder) => void
  loadChaptersForLanguage: (language: string) => Promise<void>
  handleRetry: () => void
}

const INITIAL_STATE: MangaDetailDataState = {
  manga: null,
  chapters: [],
  loading: true,
  error: null,
  selectedLanguage: 'en',
  chapterSort: DEFAULT_CHAPTER_SORT,
  chaptersLoading: false,
  chaptersError: null,
  usingCachedData: false,
  chaptersComplete: true,
  chaptersTotal: 0,
  chaptersLoadedFrom: undefined,
  chaptersLoadFailed: false,
  chaptersFilterLanguage: undefined
}

/**
 * Map display language (locale) to content language (ISO 639-1)
 * en-GB / en-US → en
 * vi-VN → vi
 */
function mapDisplayToContentLanguage(displayLang: string): string {
  return displayLang.split('-')[0]
}

/**
 * Owns the manga-detail data pipeline: database-first load, background API
 * refresh, and the chapter language-priority cascade (synced display language
 * → manual priority list → English fallback → unfiltered). These stay in one
 * hook because the DB-first step primes the exact same `chapters`/
 * `selectedLanguage` state that the cascade subsequently overwrites once the
 * API responds - splitting them would mean threading that hand-off through
 * two hooks instead of one.
 *
 * Chapters load page by page (see chapterFeedLoader): the first page, from the end of the
 * series the list is sorted towards, replaces the skeleton at once and the rest arrives in the
 * background. Every load can be cancelled, so a language switch, a retry or leaving the page
 * never lets a slow load overwrite a newer one.
 */
export function useMangaDetailData(
  mangaId: string | undefined,
  isOnline: boolean,
  t: TFunction
): UseMangaDetailDataResult {
  const [state, setState] = useState<MangaDetailDataState>(INITIAL_STATE)
  const loadControllerRef = useRef<AbortController | undefined>(undefined)

  /** Cancel whatever is loading and start a new load, returning its signal */
  function beginLoad(): AbortSignal {
    loadControllerRef.current?.abort()
    loadControllerRef.current = new AbortController()
    return loadControllerRef.current.signal
  }

  function applyFeedProgress(
    progress: ChapterFeedProgress,
    languages: FeedLanguages,
    signal: AbortSignal
  ): void {
    if (signal.aborted) return

    setState((prev) => ({
      ...prev,
      chapters: progress.chapters,
      selectedLanguage: languages.selectedLanguage,
      chaptersFilterLanguage: languages.filterLanguage,
      chaptersLoading: false,
      chaptersError: null,
      usingCachedData: false,
      chaptersComplete: progress.complete,
      chaptersTotal: progress.total,
      chaptersLoadedFrom: progress.loadedFrom,
      chaptersLoadFailed: false
    }))
  }

  /** Show a feed whose first page is already in hand, and keep loading the rest in the background */
  async function streamChapters(
    id: string,
    firstPage: FeedPage,
    direction: ChapterDirection,
    languages: FeedLanguages,
    signal: AbortSignal
  ): Promise<void> {
    const result = await loadChapterFeed({
      mangaId: id,
      language: languages.filterLanguage,
      direction,
      firstPage,
      signal,
      onPage: (progress) => applyFeedProgress(progress, languages, signal)
    })

    if (result.status === 'partial' && !signal.aborted) {
      rendererLog.error(
        '[useMangaDetailData] Failed to load the rest of the chapters:',
        result.error
      )
      setState((prev) => ({ ...prev, chaptersLoadFailed: true }))
    }
  }

  function showNoChapters(signal: AbortSignal): void {
    if (signal.aborted) return

    // No chapters at all — treat as empty, not an error
    setState((prev) => ({
      ...prev,
      chapters: [],
      chaptersLoading: false,
      chaptersError: null,
      usingCachedData: false,
      chaptersComplete: true,
      chaptersTotal: 0,
      chaptersLoadedFrom: undefined,
      chaptersLoadFailed: false,
      chaptersFilterLanguage: undefined
    }))
  }

  function showChaptersError(error: unknown, signal: AbortSignal, message: string): void {
    if (signal.aborted) return

    rendererLog.error(message, error)
    setState((prev) => ({
      ...prev,
      chapters: [],
      chaptersLoading: false,
      chaptersError: toError(error),
      chaptersComplete: true,
      chaptersTotal: 0,
      chaptersLoadedFrom: undefined,
      chaptersLoadFailed: false,
      chaptersFilterLanguage: undefined
    }))
  }

  /**
   * Load chapters using priority cascade logic.
   * Tries each language in priority order until chapters are found.
   */
  async function loadChaptersWithPriority(
    id: string,
    direction: ChapterDirection,
    signal: AbortSignal
  ): Promise<void> {
    if (!isOnline) {
      setState((prev) => ({
        ...prev,
        chaptersLoading: false,
        chaptersError: new Error(t('mangaDetail:chapterError.offlineMessage'))
      }))
      return
    }

    setState((prev) => ({ ...prev, chaptersLoading: true, chaptersError: null }))

    try {
      // Load language settings
      const settingsResponse = await globalThis.settings.load()
      const languageSettings = settingsResponse.data?.language

      // Determine priority list based on sync setting
      let priorities: string[] = []

      if (languageSettings?.syncContentLanguage) {
        // Sync enabled: Use display language
        const displayLang = languageSettings.displayLanguage || 'en-GB'
        const contentLang = mapDisplayToContentLanguage(displayLang)
        priorities = [contentLang]
      } else {
        // Sync disabled: Use manual priority list
        priorities = languageSettings?.contentLanguage || []
      }

      // Build priority cascade: determined priorities → English (if not in list) → unfiltered
      const prioritiesWithFallback = [...priorities, ...(priorities.includes('en') ? [] : ['en'])]

      // Try each priority language sequentially. Whether a language has chapters is judged from
      // its first page, which is also the page that goes on screen.
      for (const lang of prioritiesWithFallback) {
        const firstPage = await fetchChapterFeedPage({
          mangaId: id,
          language: lang,
          direction,
          offset: 0
        })
        if (signal.aborted) return

        if (firstPage.chapters.length > 0) {
          await streamChapters(
            id,
            firstPage,
            direction,
            { filterLanguage: lang, selectedLanguage: lang },
            signal
          )
          return
        }
      }

      // Last resort: Query without language filter
      const unfilteredPage = await fetchChapterFeedPage({
        mangaId: id,
        direction,
        offset: 0
      })
      if (signal.aborted) return

      if (unfilteredPage.chapters.length > 0) {
        await streamChapters(
          id,
          unfilteredPage,
          direction,
          {
            filterLanguage: undefined,
            selectedLanguage: unfilteredPage.chapters[0].translatedLanguage
          },
          signal
        )
      } else {
        showNoChapters(signal)
      }
    } catch (error) {
      showChaptersError(error, signal, '[useMangaDetailData] Failed to load chapters:')
    }
  }

  /**
   * Fetch manga details from database first, then from API if online.
   * Database-first approach ensures offline functionality with cached data.
   */
  async function loadMangaDetails(id: string): Promise<void> {
    const signal = beginLoad()
    // The order this manga was last viewed in, which also decides which end of the series loads first
    const direction = getChapterSortPreference(id)

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      chapterSort: direction,
      chapters: [],
      chaptersComplete: true,
      chaptersTotal: 0,
      chaptersLoadedFrom: undefined,
      chaptersLoadFailed: false,
      chaptersFilterLanguage: undefined
    }))

    // Step 1: Always check database first (works offline and online)
    let foundInDb = false
    try {
      const [dbMangaResult, dbChaptersResult] = await Promise.all([
        globalThis.library.getMangaById(id),
        globalThis.library.getCachedChapters(id)
      ])
      if (signal.aborted) return

      if (dbMangaResult.success && dbMangaResult.data) {
        foundInDb = true
        const dbManga = dbMangaResult.data
        const dbChapters = dbChaptersResult.success ? dbChaptersResult.data || [] : []

        // Convert database data to display format
        const mangaEntity = convertDbMangaToContract(dbManga)
        const chapterEntities = convertDbChaptersToContract(dbChapters)

        // Determine language from cached chapters
        const languages = [...new Set(dbChapters.map((ch) => ch.language))].filter(
          (lang): lang is string => typeof lang === 'string'
        )
        const initialLanguage = languages.includes('en')
          ? 'en'
          : languages.length > 0
            ? languages[0]
            : 'en'

        // The cache holds every language it has seen; show the one chosen above, oldest first
        const inLanguage = chapterEntities.filter((ch) => ch.translatedLanguage === initialLanguage)

        // Update state with cached data
        setState((prev) => ({
          ...prev,
          manga: mangaEntity,
          chapters: sortChaptersAscending(inLanguage.length > 0 ? inLanguage : chapterEntities),
          selectedLanguage: initialLanguage,
          loading: false,
          usingCachedData: !isOnline, // Only show cached data indicator if offline
          chaptersLoading: false,
          chaptersError: null,
          // A cached list can't be completed from here, so nothing waits on it
          chaptersComplete: true
        }))
      }
    } catch {
      // Failed to load from database - will try API next
    }

    // Step 2: If online, fetch from API to update (works in background if we have DB data)
    if (isOnline) {
      try {
        const mangaResponse = await globalThis.mangadex.getManga(id, [
          'cover_art',
          'author',
          'artist'
        ])
        if (signal.aborted) return

        if (!mangaResponse.success || !mangaResponse.data) {
          throw new Error(mangaResponse.error?.message || 'Failed to fetch manga')
        }

        if (mangaResponse.data.result === 'error') {
          throw new Error('Failed to fetch manga from API')
        }

        const manga = mangaResponse.data.data

        // Cache to database for future offline use
        try {
          await cacheMangaMetadata(manga)
        } catch {
          // Failed to cache - continue with API data
        }
        if (signal.aborted) return

        // Update state with live API data
        setState((prev) => ({
          ...prev,
          manga,
          loading: false,
          usingCachedData: false
        }))

        // Fetch chapters using priority cascade
        await loadChaptersWithPriority(id, direction, signal)
      } catch (apiError) {
        if (signal.aborted) return

        // Only show API error if we don't have database data
        if (!foundInDb) {
          rendererLog.error('[useMangaDetailData] Failed to load manga from API:', apiError)
          setState((prev) => ({
            ...prev,
            error: apiError instanceof Error ? apiError : new Error(String(apiError)),
            loading: false
          }))
        }
      }
    } else if (!foundInDb) {
      // Offline and no database cache - show error
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(t('mangaDetail:offlineError.message'))
      }))
    }
  }

  /**
   * Load chapters for a specific language (used for manual language override).
   */
  async function loadChaptersForLanguage(language: string): Promise<void> {
    if (!mangaId) return

    if (!isOnline) {
      setState((prev) => ({
        ...prev,
        chaptersLoading: false,
        chaptersError: new Error(t('mangaDetail:chapterError.offlineMessage'))
      }))
      return
    }

    const signal = beginLoad()
    setState((prev) => ({ ...prev, chaptersLoading: true, chaptersError: null }))

    try {
      const firstPage = await fetchChapterFeedPage({
        mangaId,
        language,
        direction: state.chapterSort,
        offset: 0
      })
      if (signal.aborted) return

      if (firstPage.chapters.length === 0) {
        setState((prev) => ({ ...prev, selectedLanguage: language }))
        showNoChapters(signal)
        return
      }

      await streamChapters(
        mangaId,
        firstPage,
        state.chapterSort,
        { filterLanguage: language, selectedLanguage: language },
        signal
      )
    } catch (error) {
      showChaptersError(error, signal, '[useMangaDetailData] Failed to load chapters for language:')
    }
  }

  // Load manga details and chapters whenever the target manga changes
  useEffect(() => {
    if (mangaId) {
      loadMangaDetails(mangaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId])

  // Retry loading when coming back online if there was an offline error
  useEffect(() => {
    if (isOnline && state.error?.message.toLowerCase().includes('offline')) {
      if (mangaId) {
        loadMangaDetails(mangaId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, mangaId])

  // Stop loading when the page goes away
  useEffect(() => {
    return () => {
      loadControllerRef.current?.abort()
    }
  }, [])

  // Sorting only changes how the list is shown (and is remembered for this manga); it never reloads
  const setChapterSort = (order: ChapterSortOrder): void => {
    setState((prev) => ({ ...prev, chapterSort: order }))
    if (mangaId) {
      setChapterSortPreference(mangaId, order)
    }
  }

  const handleRetry = (): void => {
    if (mangaId) {
      loadMangaDetails(mangaId)
    }
  }

  return {
    ...state,
    setChapterSort,
    loadChaptersForLanguage,
    handleRetry
  }
}
