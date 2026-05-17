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
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation(['common', 'dialogs'])
  const { presets, loading } = useSearchPresetsStore()

  // Build options for Select component
  const options: SelectOption[] = [
    {
      value: '',
      label: loading ? t('common:preset.loading') : t('common:preset.noPreset')
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
    <div className="gap-2 flex">
      <Select
        value={currentPresetId ? String(currentPresetId) : ''}
        onChange={handleChange}
        options={options}
        placeholder={t('common:preset.selectPlaceholder')}
        disabled={loading}
        aria-label={t('common:preset.selectAriaLabel')}
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
                t('dialogs:preset.deleteTitle', { name: preset.name }),
                t('dialogs:preset.deleteMessage'),
                t('dialogs:preset.confirmDelete'),
                'Cancel'
              )
              if (confirmed.success && confirmed.data) {
                onDelete(currentPresetId, preset.name)
              }
            }
          }}
          title={t('common:preset.deleteTitle')}
          aria-label={t('common:preset.deleteAriaLabel')}
        >
          <Delete24Regular />
        </button>
      )}
    </div>
  )
}
