import { useEffect, useState } from 'react'
import { useSearchPresetsStore } from '@renderer/stores'
import { DEFAULT_FILTERS, DEFAULT_LIMIT, type SearchFilters } from '@renderer/stores/searchStore'
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

/**
 * The Filter modal's in-progress edit state (query/filters/limit), distinct from the
 * committed state in useSearchStore. Presets load into and save from this draft rather
 * than the committed store directly, so picking a preset (or Save Preset) only affects
 * what's shown in the modal until Apply Filters commits it - see BrowseView.
 */
export interface SearchDraft {
  query: string
  filters: SearchFilters
  limit: number
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  setLimit: (limit: number) => void
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

function convertToFrontendFilters(backendFilters: BackendFilters): SearchFilters {
  return {
    contentRating: backendFilters.contentRating,
    publicationStatus: backendFilters.publicationStatus ? [backendFilters.publicationStatus] : [],
    publicationDemographic: backendFilters.publicationDemographic
      ? [backendFilters.publicationDemographic]
      : [],
    includedTags: backendFilters.includedTags || [],
    excludedTags: backendFilters.excludedTags || [],
    includedTagsMode: backendFilters.includedTagsMode,
    availableTranslatedLanguage: backendFilters.availableTranslatedLanguages,
    sortBy: backendFilters.sortBy,
    sortDirection: backendFilters.sortDirection
  }
}

function convertToBackendFilters(frontendFilters: SearchFilters, limit: number): BackendFilters {
  return {
    contentRating: frontendFilters.contentRating,
    publicationStatus: frontendFilters.publicationStatus[0], // Take first item or undefined
    publicationDemographic: frontendFilters.publicationDemographic[0] || undefined, // Take first or undefined
    includedTags: frontendFilters.includedTags,
    excludedTags: frontendFilters.excludedTags,
    includedTagsMode: frontendFilters.includedTagsMode,
    availableTranslatedLanguages: frontendFilters.availableTranslatedLanguage,
    resultPerPage: limit,
    sortBy: frontendFilters.sortBy,
    sortDirection: frontendFilters.sortDirection
  }
}

/**
 * Owns saved search presets: loading them on mount, loading one into the Filter
 * modal's draft, and saving/deleting presets from that same draft.
 */
export function useSearchPresets(
  t: TFunction,
  showToast: (options: ToastOptions) => void,
  draft: SearchDraft
): UseSearchPresetsResult {
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

  // Loads a preset's (or the default) filters into the draft only - it does not search.
  // The Filter modal commits via its own Apply button, same as any other in-panel edit;
  // searching immediately here would commit a change the user hasn't confirmed yet.
  const handlePresetSelect = (presetId: number | null): void => {
    if (presetId === null) {
      // "No Preset" - revert the draft to the default filters, same as Clear Filters
      draft.setFilters(DEFAULT_FILTERS)
      draft.setLimit(DEFAULT_LIMIT)
      setAppliedPresetId(null)
      return
    }

    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return

    // Load preset into the draft - convert backend format to frontend format
    draft.setQuery(preset.searchQuery || '')
    draft.setFilters(convertToFrontendFilters(preset.filters))
    draft.setLimit(preset.resultsPerPage)

    // Mark as applied and update last used
    setAppliedPresetId(preset.id)
    updateLastUsedAt(preset.id)

    showToast({
      title: t('browse:toasts.presetLoaded'),
      message: preset.name,
      variant: 'info',
      duration: 2000
    })
  }

  const handleSavePreset = async (name: string, setAsDefault: boolean): Promise<void> => {
    try {
      const backendFilters = convertToBackendFilters(draft.filters, draft.limit)
      const preset = await createPreset({
        name,
        searchQuery: draft.query,
        filters: backendFilters,
        resultsPerPage: draft.limit,
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
