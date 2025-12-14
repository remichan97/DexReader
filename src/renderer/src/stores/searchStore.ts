/**
 * Search Store - Manga search and filter state management
 *
 * Manages search query, filters, pagination, and results for the Browse view.
 * Connects to MangaDex API client for fetching manga data.
 *
 * Features:
 * - Text search with debouncing (handled by SearchBar component)
 * - Multi-filter support (content rating, status, demographic, tags, sort)
 * - Infinite scroll with offset-based pagination
 * - Loading states (initial load vs loading more)
 * - Error handling with recovery
 * - 10,000 result limit enforcement (MangaDex API constraint)
 */

import { create } from 'zustand'

// Re-export enum values for convenience
export enum ContentRating {
  Safe = 'safe',
  Suggestive = 'suggestive',
  Erotica = 'erotica',
  Pornographic = 'pornographic'
}

export enum PublicationStatus {
  Ongoing = 'ongoing',
  Completed = 'completed',
  Hiatus = 'hiatus',
  Cancelled = 'cancelled'
}

export enum PublicationDemographic {
  Shounen = 'shounen',
  Shoujo = 'shoujo',
  Josei = 'josei',
  Seinen = 'seinen',
  None = 'none'
}

export enum IncludedTagsMode {
  And = 'AND',
  Or = 'OR'
}

export enum OrderOptions {
  Title = 'title',
  Year = 'year',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  LatestUploadedChapter = 'latestUploadedChapter',
  FollowedCount = 'followedCount',
  Relevance = 'relevance',
  Rating = 'rating'
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum MangaIncludes {
  Manga = 'manga',
  CoverArt = 'cover_art',
  Author = 'author',
  Artist = 'artist',
  Tag = 'tag'
}

// Type extracted from global Window interface
type MangaEntity = Window['mangadex'] extends {
  searchManga: (...args: unknown[]) => Promise<infer R>
}
  ? R extends { data: (infer T)[] }
    ? T
    : never
  : never

export interface SearchFilters {
  contentRating: ContentRating[]
  publicationStatus: PublicationStatus[]
  publicationDemographic: PublicationDemographic[]
  includedTags: string[]
  excludedTags: string[]
  includedTagsMode: IncludedTagsMode
  availableTranslatedLanguage: string[]
  sortBy: OrderOptions
  sortDirection: OrderDirection
}

export const DEFAULT_FILTERS: SearchFilters = {
  contentRating: [ContentRating.Safe, ContentRating.Suggestive],
  publicationStatus: [],
  publicationDemographic: [],
  includedTags: [],
  excludedTags: [],
  includedTagsMode: IncludedTagsMode.And,
  availableTranslatedLanguage: ['en'],
  sortBy: OrderOptions.Relevance,
  sortDirection: OrderDirection.Desc
}

interface SearchState {
  query: string
  filters: SearchFilters
  results: MangaEntity[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  error: Error | null
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  setLimit: (limit: number) => void
  search: () => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

const MAX_RESULTS_LIMIT = 10000
const DEFAULT_LIMIT = 20

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  filters: DEFAULT_FILTERS,
  results: [],
  total: 0,
  offset: 0,
  limit: DEFAULT_LIMIT,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,

  setQuery: (query: string) => {
    set({ query })
  },

  setFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }))
  },

  setLimit: (limit: number) => {
    const clampedLimit = Math.min(Math.max(limit, 5), 100)
    set({ limit: clampedLimit })
  },

  search: async () => {
    const state = get()

    if (state.loading) {
      return
    }

    try {
      set({
        loading: true,
        error: null,
        offset: 0,
        results: []
      })

      // Build search params - only include non-empty values
      const searchParams: Record<string, unknown> = {
        contentRating: state.filters.contentRating,
        includes: [MangaIncludes.CoverArt, MangaIncludes.Author, MangaIncludes.Artist],
        limit: state.limit,
        offset: 0
      }

      // Only add title if there's an actual search query
      if (state.query?.trim()) {
        searchParams.title = state.query.trim()
      }

      // Add filters if they have values
      if (state.filters.publicationStatus.length > 0) {
        searchParams.status = state.filters.publicationStatus
      }
      if (state.filters.publicationDemographic.length > 0) {
        searchParams.publicationDemographic = state.filters.publicationDemographic
      }
      if (state.filters.includedTags.length > 0) {
        searchParams.includedTags = state.filters.includedTags
        searchParams.includedTagsMode = state.filters.includedTagsMode
      }
      if (state.filters.excludedTags.length > 0) {
        searchParams.excludedTags = state.filters.excludedTags
        searchParams.excludedTagsMode = state.filters.includedTagsMode
      }
      if (state.filters.availableTranslatedLanguage.length > 0) {
        searchParams.availableTranslatedLanguage = state.filters.availableTranslatedLanguage
      }

      // Set order: use relevance only if there's a search query, otherwise use updatedAt
      const orderBy = state.query?.trim() ? state.filters.sortBy : OrderOptions.UpdatedAt
      searchParams.order = { [orderBy]: state.filters.sortDirection }

      const response = await globalThis.mangadex.searchManga(searchParams)

      // Check IPC wrapper success
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to search manga')
      }

      // Check API result
      if (response.data.result === 'error') {
        throw new Error('Failed to search manga from API')
      }

      // Extract data array and total from CollectionResponse (wrapped in IPC handler)
      const mangaData = response.data.data
      const totalResults = response.data.total

      set({
        results: mangaData,
        total: totalResults,
        offset: 0,
        hasMore: mangaData.length >= state.limit && state.limit < MAX_RESULTS_LIMIT,
        loading: false
      })
    } catch (error) {
      console.error('Search error:', error)
      set({
        error: error instanceof Error ? error : new Error(String(error)),
        loading: false
      })
    }
  },

  loadMore: async () => {
    const state = get()

    if (state.loadingMore || !state.hasMore) {
      return
    }

    const nextOffset = state.offset + state.limit
    if (nextOffset >= MAX_RESULTS_LIMIT) {
      set({ hasMore: false })
      return
    }

    try {
      set({ loadingMore: true, error: null })

      // Build search params - only include non-empty values (same as search())
      const searchParams: Record<string, unknown> = {
        contentRating: state.filters.contentRating,
        includes: [MangaIncludes.CoverArt, MangaIncludes.Author, MangaIncludes.Artist],
        limit: state.limit,
        offset: nextOffset
      }

      // Only add title if there's an actual search query
      if (state.query?.trim()) {
        searchParams.title = state.query.trim()
      }

      // Add filters if they have values
      if (state.filters.publicationStatus.length > 0) {
        searchParams.status = state.filters.publicationStatus
      }
      if (state.filters.publicationDemographic.length > 0) {
        searchParams.publicationDemographic = state.filters.publicationDemographic
      }
      if (state.filters.includedTags.length > 0) {
        searchParams.includedTags = state.filters.includedTags
        searchParams.includedTagsMode = state.filters.includedTagsMode
      }
      if (state.filters.excludedTags.length > 0) {
        searchParams.excludedTags = state.filters.excludedTags
        searchParams.excludedTagsMode = state.filters.includedTagsMode
      }
      if (state.filters.availableTranslatedLanguage.length > 0) {
        searchParams.availableTranslatedLanguage = state.filters.availableTranslatedLanguage
      }

      // Set order: use relevance only if there's a search query, otherwise use updatedAt
      const orderBy = state.query?.trim() ? state.filters.sortBy : OrderOptions.UpdatedAt
      searchParams.order = { [orderBy]: state.filters.sortDirection }

      const response = await globalThis.mangadex.searchManga(searchParams)

      // Check IPC wrapper success
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load more manga')
      }

      // Check API result
      if (response.data.result === 'error') {
        throw new Error('Failed to load more manga from API')
      }

      // Extract data array from CollectionResponse (wrapped in IPC handler)
      const mangaData = response.data.data
      const newTotal = response.data.total

      set((prevState) => ({
        results: [...prevState.results, ...mangaData],
        offset: nextOffset,
        total: newTotal, // Update total from response
        hasMore:
          mangaData.length >= state.limit &&
          nextOffset + mangaData.length < newTotal &&
          nextOffset + state.limit < MAX_RESULTS_LIMIT,
        loadingMore: false
      }))
    } catch (error) {
      console.error('Load more error:', error)
      set({
        error: error instanceof Error ? error : new Error(String(error)),
        loadingMore: false
      })
    }
  },

  reset: () => {
    set({
      query: '',
      filters: DEFAULT_FILTERS,
      results: [],
      total: 0,
      offset: 0,
      limit: DEFAULT_LIMIT,
      hasMore: true,
      loading: false,
      loadingMore: false,
      error: null
    })
  }
}))
