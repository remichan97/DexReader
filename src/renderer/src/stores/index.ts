/**
 * Zustand Stores - Central Export
 *
 * Single import point for all state management stores.
 * Usage: import { useAppStore, useToastStore } from '@renderer/stores'
 */

// Store hooks
export { useAppStore } from './appStore'
export { useToastStore, useToast } from './toastStore'
export { useProgressStore } from './progressStore'
export { useLibraryStore } from './libraryStore'
export { useCollectionsStore } from './collectionsStore'
export { useConnectivityStore } from './connectivityStore'
export { useSearchPresetsStore } from './searchPresetsStore'
export { useSidebarStore } from './sidebarStore'
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
export type { Theme, ThemeMode, ToastVariant, ToastItem } from './types'
export type { SearchFilters } from './searchStore'
export type { SidebarDisplayMode } from './sidebarStore'
