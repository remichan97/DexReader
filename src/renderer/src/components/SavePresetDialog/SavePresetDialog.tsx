/**
 * SavePresetDialog Component
 *
 * Modal dialog for saving current search configuration as a preset.
 * Supports creating new presets or updating existing ones (upsert).
 */

import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Input } from '@renderer/components/Input'
import { Checkbox } from '@renderer/components/Checkbox'
import { Button } from '@renderer/components/Button'
import { getTagKeyById, getTagDisplayName } from '@renderer/utils/tagHelpers'
import { LanguageList } from '@renderer/constants/language-list.constant'
import './SavePresetDialog.css'

interface SavePresetDialogProps {
  isOpen: boolean
  onClose: () => void
  initialName?: string
  currentSearchState: {
    searchQuery: string
    filters: {
      contentRating: string[]
      publicationStatus: string[]
      publicationDemographic: string[]
      includedTags?: string[]
      excludedTags?: string[]
      availableTranslatedLanguage?: string[]
      sortBy: string
      sortDirection: string
    }
    resultsPerPage: number
  }
  onSave: (name: string, setAsDefault: boolean) => Promise<void>
}

export function SavePresetDialog({
  isOpen,
  onClose,
  initialName = '',
  currentSearchState,
  onSave
}: Readonly<SavePresetDialogProps>): JSX.Element {
  const [name, setName] = useState(initialName)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setSetAsDefault(false)
      setIsSaving(false)
    }
  }, [isOpen, initialName])

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await onSave(name.trim(), setAsDefault)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCopy = async (): Promise<void> => {
    // Truncate name to fit within 50 char limit with " (Copy)" suffix
    const maxBaseLength = 50 - 7 // 7 chars for " (Copy)"
    const baseName = name.length > maxBaseLength ? name.slice(0, maxBaseLength) : name
    const copyName = `${baseName} (Copy)`
    setIsSaving(true)
    try {
      await onSave(copyName, setAsDefault)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = (): void => {
    if (!isSaving) {
      onClose()
    }
  }

  // Build filter preview
  const { filters, searchQuery, resultsPerPage } = currentSearchState
  const filterSummary: string[] = []

  if (searchQuery) {
    filterSummary.push(`Search: "${searchQuery}"`)
  }

  if (filters.contentRating && filters.contentRating.length > 0) {
    filterSummary.push(`Content Rating: ${filters.contentRating.join(', ')}`)
  }

  if (filters.publicationStatus && filters.publicationStatus.length > 0) {
    filterSummary.push(`Status: ${filters.publicationStatus.join(', ')}`)
  }

  if (filters.publicationDemographic && filters.publicationDemographic.length > 0) {
    filterSummary.push(`Demographic: ${filters.publicationDemographic.join(', ')}`)
  }

  if (filters.includedTags && filters.includedTags.length > 0) {
    const tagNames = filters.includedTags
      .map((id) => {
        const key = getTagKeyById(id)
        return key ? getTagDisplayName(key) : id
      })
      .join(', ')
    filterSummary.push(`Included Tags: ${tagNames}`)
  }

  if (filters.excludedTags && filters.excludedTags.length > 0) {
    const tagNames = filters.excludedTags
      .map((id) => {
        const key = getTagKeyById(id)
        return key ? getTagDisplayName(key) : id
      })
      .join(', ')
    filterSummary.push(`Excluded Tags: ${tagNames}`)
  }

  if (filters.availableTranslatedLanguage && filters.availableTranslatedLanguage.length > 0) {
    const languageNames = filters.availableTranslatedLanguage
      .map((code) => {
        const lang = LanguageList.find((l) => l.code === code)
        return lang ? lang.name : code
      })
      .join(', ')
    filterSummary.push(`Languages: ${languageNames}`)
  }

  filterSummary.push(`Sort: ${filters.sortBy} (${filters.sortDirection})`)
  filterSummary.push(`Results per page: ${resultsPerPage}`)

  const footer = (
    <div className="save-preset-dialog__footer">
      <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button variant="secondary" onClick={handleSaveCopy} disabled={isSaving || !name.trim()}>
        Save a Copy
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={isSaving || !name.trim()}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Save Preset"
      footer={footer}
      size="medium"
      closeOnOverlayClick={!isSaving}
      closeOnEscape={!isSaving}
    >
      <div className="save-preset-dialog__content">
        <Input
          label="Preset Name"
          value={name}
          onChange={setName}
          placeholder="e.g., Ongoing Action"
          maxLength={50}
          helperText={`${name.length}/50 characters`}
          disabled={isSaving}
          autoFocus
        />

        <Checkbox
          label="Set as default"
          checked={setAsDefault}
          onChange={setSetAsDefault}
          disabled={isSaving}
        />

        {filterSummary.length > 0 && (
          <div className="save-preset-dialog__preview">
            <h4 className="save-preset-dialog__preview-title">Preview: Current Filters</h4>
            <ul className="save-preset-dialog__preview-list">
              {filterSummary.map((item) => (
                <li key={item} className="save-preset-dialog__preview-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
