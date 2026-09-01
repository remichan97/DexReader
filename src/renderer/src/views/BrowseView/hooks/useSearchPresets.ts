import { useEffect, useState } from 'react'
import { useSearchStore, useSearchPresetsStore } from '@renderer/stores'
import {
  type SearchFilters,
  type IncludedTagsMode,
  type OrderOptions,
  type OrderDirection
} from '@renderer/stores/searchStore'
import { rendererLog } from '@renderer/services/logging.service'
import type { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'

type BackendFilters = SearchPresetQuery['filters']
type TFunction = (key: string, options?: Record<string, unknown>) => string

interface ToastOptions {
  title: string
  message: string
  variant: 'info' | 'success' | 'error'
  duration: number
}

export interface UseSearchPresetsResult {
  presets: SearchPresetQuery[]
  appliedPresetId: number | null
  setAppliedPresetId: (id: number | null) => void
  showSaveDialog: boolean
  setShowSaveDialog: (open: boolean) => void
  handlePresetSelect: (presetId: number | null) => void
  handleSavePreset: (name: string, setAsDefault: boolean) => Promise<void>
  handleDeletePreset: (id: number, name: string) => Promise<void>
}

// The `as unknown as` casts below bridge two independently-declared filter
// enum types (the frontend searchStore's and the backend search-preset
// contract's) that happen to share the same string values. Left as-is here -
// unifying them is tracked separately (Phase 7 cleanup), not part of this
// extraction.
function convertToFrontendFilters(backendFilters: BackendFilters): SearchFilters {
  return {
    contentRating: backendFilters.contentRating,
    publicationStatus: backendFilters.publicationStatus ? [backendFilters.publicationStatus] : [],
    publicationDemographic: backendFilters.publicationDemographic
      ? [backendFilters.publicationDemographic]
      : [],
    includedTags: backendFilters.includedTags || [],
    excludedTags: backendFilters.excludedTags || [],
    includedTagsMode: backendFilters.includedTagsMode as unknown as IncludedTagsMode,
    availableTranslatedLanguage: backendFilters.availableTranslatedLanguages,
    sortBy: backendFilters.sortBy as unknown as OrderOptions,
    sortDirection: backendFilters.sortDirection as unknown as OrderDirection
  }
}

function convertToBackendFilters(frontendFilters: SearchFilters, limit: number): BackendFilters {
  return {
    contentRating: frontendFilters.contentRating,
    publicationStatus: frontendFilters.publicationStatus[0], // Take first item or undefined
    publicationDemographic: frontendFilters.publicationDemographic[0] || undefined, // Take first or undefined
    includedTags: frontendFilters.includedTags,
    excludedTags: frontendFilters.excludedTags,
    includedTagsMode:
      frontendFilters.includedTagsMode as unknown as BackendFilters['includedTagsMode'],
    availableTranslatedLanguages: frontendFilters.availableTranslatedLanguage,
    resultPerPage: limit,
    sortBy: frontendFilters.sortBy as unknown as BackendFilters['sortBy'],
    sortDirection: frontendFilters.sortDirection as unknown as BackendFilters['sortDirection']
  }
}

/**
 * Owns saved search presets: loading them on mount, applying one to the
 * current search (query/filters/limit), and saving/deleting presets.
 */
export function useSearchPresets(
  t: TFunction,
  showToast: (options: ToastOptions) => void
): UseSearchPresetsResult {
  const query = useSearchStore((state) => state.query)
  const setQuery = useSearchStore((state) => state.setQuery)
  const filters = useSearchStore((state) => state.filters)
  const setFilters = useSearchStore((state) => state.setFilters)
  const limit = useSearchStore((state) => state.limit)
  const setLimit = useSearchStore((state) => state.setLimit)
  const search = useSearchStore((state) => state.search)

  const presets = useSearchPresetsStore((state) => state.presets)
  const loadPresets = useSearchPresetsStore((state) => state.loadPresets)
  const createPreset = useSearchPresetsStore((state) => state.createPreset)
  const deletePreset = useSearchPresetsStore((state) => state.deletePreset)
  const updateLastUsedAt = useSearchPresetsStore((state) => state.updateLastUsedAt)

  const [appliedPresetId, setAppliedPresetId] = useState<number | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Load presets on mount
  useEffect(() => {
    loadPresets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePresetSelect = (presetId: number | null): void => {
    if (presetId === null) {
      // Clear preset
      setAppliedPresetId(null)
      return
    }

    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return

    // Apply preset to search state - convert backend format to frontend format
    setQuery(preset.searchQuery || '')
    setFilters(convertToFrontendFilters(preset.filters))
    setLimit(preset.resultsPerPage)

    // Mark as applied and update last used
    setAppliedPresetId(preset.id)
    updateLastUsedAt(preset.id)

    // Trigger search
    search()

    showToast({
      title: t('browse:toasts.presetLoaded'),
      message: preset.name,
      variant: 'info',
      duration: 2000
    })
  }

  const handleSavePreset = async (name: string, setAsDefault: boolean): Promise<void> => {
    try {
      const backendFilters = convertToBackendFilters(filters, limit)
      const preset = await createPreset({
        name,
        searchQuery: query,
        filters: backendFilters,
        resultsPerPage: limit,
        setAsDefault
      })

      setAppliedPresetId(preset?.id ?? null)

      showToast({
        title: t('browse:toasts.presetSaved'),
        message: name,
        variant: 'success',
        duration: 2000
      })
    } catch (error) {
      rendererLog.error('[useSearchPresets] Error saving preset:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: error instanceof Error ? error.message : t('browse:toasts.failedToSave'),
        variant: 'error',
        duration: 4000
      })
      throw error // Re-throw to let dialog handle it
    }
  }

  const handleDeletePreset = async (id: number, name: string): Promise<void> => {
    try {
      await deletePreset(id)

      // Clear applied preset if it was deleted
      if (appliedPresetId === id) {
        setAppliedPresetId(null)
      }

      showToast({
        title: t('browse:toasts.presetDeleted'),
        message: name,
        variant: 'info',
        duration: 2000
      })
    } catch (error) {
      rendererLog.error('[useSearchPresets] Error deleting preset:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: t('browse:toasts.failedToDelete'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  return {
    presets,
    appliedPresetId,
    setAppliedPresetId,
    showSaveDialog,
    setShowSaveDialog,
    handlePresetSelect,
    handleSavePreset,
    handleDeletePreset
  }
}
