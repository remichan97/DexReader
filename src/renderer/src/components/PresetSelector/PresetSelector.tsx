/**
 * PresetSelector Component
 *
 * Dropdown selector for saved search presets.
 * Allows users to quickly load saved search configurations.
 */

import type { JSX } from 'react'
import { Delete24Regular } from '@fluentui/react-icons'
import { Select, type SelectOption } from '@renderer/components/Select'
import { useSearchPresetsStore } from '@renderer/stores'
import './PresetSelector.css'

interface PresetSelectorProps {
  currentPresetId: number | null
  onSelect: (presetId: number | null) => void
  onDelete: (id: number, name: string) => void
}

export function PresetSelector({
  currentPresetId,
  onSelect,
  onDelete
}: PresetSelectorProps): JSX.Element {
  const { presets, loading } = useSearchPresetsStore()

  // Build options for Select component
  const options: SelectOption[] = [
    {
      value: '',
      label: loading ? 'Loading presets...' : 'No Preset'
    },
    ...presets.map((preset) => ({
      value: String(preset.id),
      label: preset.name
    }))
  ]

  const handleChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    if (val === '') {
      onSelect(null)
    } else {
      onSelect(Number(val))
    }
  }

  return (
    <div className="preset-selector">
      <Select
        label="Search Preset"
        value={currentPresetId ? String(currentPresetId) : ''}
        onChange={handleChange}
        options={options}
        placeholder="Select a preset"
        disabled={loading}
        aria-label="Select search preset"
      />

      {/* Delete button - shown when preset is selected */}
      {currentPresetId !== null && (
        <button
          type="button"
          className="preset-selector__delete"
          onClick={async () => {
            const preset = presets.find((p) => p.id === currentPresetId)
            if (preset) {
              // Confirm deletion
              const confirmed = await globalThis.api.showConfirmDialog(
                `Delete "${preset.name}"?`,
                "This can't be undone. Your current search will remain active.",
                'Yes, Delete',
                'Cancel'
              )
              if (confirmed.success && confirmed.data) {
                onDelete(currentPresetId, preset.name)
              }
            }
          }}
          title="Delete this preset"
          aria-label="Delete preset"
        >
          <Delete24Regular />
        </button>
      )}
    </div>
  )
}
