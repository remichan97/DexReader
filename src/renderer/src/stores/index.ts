/**
 * Zustand Stores - Central Export
 *
 * Single import point for all state management stores.
 * Usage: import { useAppStore, useToastStore } from '@renderer/stores'
 */

// Store hooks
export { useAppStore } from './appStore'
export { useToastStore, useToast } from './toastStore'
export { useUserPreferencesStore } from './userPreferencesStore'
export { useProgressStore } from './progressStore'
export { useLibraryStore } from './libraryStore'
export { useConnectivityStore } from './connectivityStore'
export {
  useSearchStore,
  DEFAULT_FILTERS,
  PublicationStatus,
  ContentRating,
  PublicationDemographic,
  IncludedTagsMode,
  OrderOptions,
  OrderDirection,
  MangaIncludes
} from './searchStore'

// Types - re-export from types.ts for convenience
export type {
  Theme,
  ThemeMode,
  ToastVariant,
  ToastItem,
  ReadingMode,
  ReadingDirection,
  ImageFit,
  ImageQuality,
  ReadingPreferences,
  DownloadPreferences,
  UIPreferences,
  NotificationPreferences,
  Collection
} from './types'
export type { SearchFilters } from './searchStore'
