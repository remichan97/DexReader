import { useEffect, useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import {
  convertDbMangaToContract,
  convertDbChaptersToContract
} from '@renderer/utils/mangaDbConversion'
import { toError } from '@shared/utils/to-error.util'
import { rendererLog } from '@renderer/services/logging.service'
import type { MangaContract, ChapterContract } from '../../../../../preload/window.types'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract
type TFunction = ReturnType<typeof useTranslation>['t']

export type ChapterSortOrder = 'asc' | 'desc'

interface MangaDetailDataState {
  manga: MangaEntity | null
  chapters: ChapterEntity[]
  loading: boolean
  error: Error | null
  selectedLanguage: string
  chapterSort: ChapterSortOrder
  chaptersLoading: boolean
  chaptersError: Error | null
  usingCachedData: boolean // Flag to indicate we're showing database cache instead of live API data
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
  chapterSort: 'asc',
  chaptersLoading: false,
  chaptersError: null,
  usingCachedData: false
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
 */
export function useMangaDetailData(
  mangaId: string | undefined,
  isOnline: boolean,
  t: TFunction
): UseMangaDetailDataResult {
  const [state, setState] = useState<MangaDetailDataState>(INITIAL_STATE)

  /**
   * Load chapters using priority cascade logic.
   * Tries each language in priority order until chapters are found.
   */
  async function loadChaptersWithPriority(
    id: string,
    chapterSort: ChapterSortOrder
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

      // Try each priority language sequentially
      for (const lang of prioritiesWithFallback) {
        const response = await globalThis.mangadex.getMangaFeed(id, {
          limit: 100,
          offset: 0,
          translatedLanguage: [lang],
          order: { chapter: chapterSort },
          includes: ['scanlation_group']
        })

        if (response.success && response.data?.data.length > 0) {
          // Found chapters in this language!
          setState((prev) => ({
            ...prev,
            chapters: response.data.data,
            selectedLanguage: lang,
            chaptersLoading: false,
            chaptersError: null,
            usingCachedData: false
          }))
          return
        }
      }

      // Last resort: Query without language filter
      const unfilteredResponse = await globalThis.mangadex.getMangaFeed(id, {
        limit: 100,
        offset: 0,
        order: { chapter: chapterSort },
        includes: ['scanlation_group']
        // No translatedLanguage filter
      })

      if (unfilteredResponse.success && unfilteredResponse.data?.data.length > 0) {
        const firstChapterLang = unfilteredResponse.data.data[0].translatedLanguage
        setState((prev) => ({
          ...prev,
          chapters: unfilteredResponse.data.data,
          selectedLanguage: firstChapterLang,
          chaptersLoading: false,
          chaptersError: null,
          usingCachedData: false
        }))
      } else {
        // No chapters at all — treat as empty, not an error
        setState((prev) => ({
          ...prev,
          chapters: [],
          chaptersLoading: false,
          chaptersError: null,
          usingCachedData: false
        }))
      }
    } catch (error) {
      rendererLog.error('[useMangaDetailData] Failed to load chapters:', error)
      setState((prev) => ({
        ...prev,
        chapters: [],
        chaptersLoading: false,
        chaptersError: toError(error)
      }))
    }
  }

  /**
   * Fetch manga details from database first, then from API if online.
   * Database-first approach ensures offline functionality with cached data.
   */
  async function loadMangaDetails(id: string): Promise<void> {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Step 1: Always check database first (works offline and online)
    let foundInDb = false
    try {
      const [dbMangaResult, dbChaptersResult] = await Promise.all([
        globalThis.library.getMangaById(id),
        globalThis.library.getCachedChapters(id)
      ])

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

        // Update state with cached data
        setState((prev) => ({
          ...prev,
          manga: mangaEntity,
          chapters: chapterEntities,
          selectedLanguage: initialLanguage,
          loading: false,
          usingCachedData: !isOnline, // Only show cached data indicator if offline
          chaptersLoading: false,
          chaptersError: null
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

        // Update state with live API data
        setState((prev) => ({
          ...prev,
          manga,
          loading: false,
          usingCachedData: false
        }))

        // Fetch chapters using priority cascade
        await loadChaptersWithPriority(id, state.chapterSort)
      } catch (apiError) {
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

    setState((prev) => ({ ...prev, chaptersLoading: true, chaptersError: null }))

    try {
      const chaptersResponse = await globalThis.mangadex.getMangaFeed(mangaId, {
        limit: 100,
        offset: 0,
        translatedLanguage: [language],
        order: { chapter: state.chapterSort },
        includes: ['scanlation_group']
      })

      // Check IPC success
      if (!chaptersResponse.success || !chaptersResponse.data) {
        throw new Error(chaptersResponse.error?.message || 'Failed to fetch chapters')
      }

      // Check API result
      if (chaptersResponse.data.result === 'error') {
        throw new Error('Failed to fetch chapters from API')
      }

      setState((prev) => ({
        ...prev,
        chapters: chaptersResponse.data.data,
        selectedLanguage: language,
        chaptersLoading: false,
        chaptersError: null,
        usingCachedData: false // Clear cached data flag when getting fresh data
      }))
    } catch (error) {
      rendererLog.error('[useMangaDetailData] Failed to load chapters for language:', error)
      setState((prev) => ({
        ...prev,
        chapters: [],
        chaptersLoading: false,
        chaptersError: toError(error)
      }))
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

  const setChapterSort = (order: ChapterSortOrder): void => {
    setState((prev) => ({ ...prev, chapterSort: order }))
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
