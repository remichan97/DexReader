import React from 'react'
import { Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Switch } from '@renderer/components/Switch'
import type { MangaReadingSettings } from '../../../../../preload/index.d'
import './ReaderSettingsSection.css'

interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  settings: MangaReadingSettings
}

interface ReaderSettingsSectionProps {
  isLoading: boolean
  forceDarkMode: boolean
  onForceDarkModeChange: (enabled: boolean) => void
  imageQuality: 'data' | 'data-saver'
  onImageQualityChange: (quality: string | string[]) => void
  globalReaderSettings: MangaReadingSettings
  onReadingModeChange: (mode: string | string[]) => void
  onDoublePageSettingChange: (key: 'skipCoverPages' | 'readRightToLeft', value: boolean) => void
  perMangaOverrides: PerMangaOverride[]
  onResetMangaOverride: (mangaId: string) => void
  onClearAllOverrides: () => void
}

const readingModeOptions: SelectOption[] = [
  { value: 'single', label: 'Single Page' },
  { value: 'double', label: 'Double Page' },
  { value: 'vertical', label: 'Vertical Scroll' }
]

const imageQualityOptions: SelectOption[] = [
  { value: 'data', label: 'High Quality' },
  { value: 'data-saver', label: 'Data Saver' }
]

export function ReaderSettingsSection({
  isLoading,
  forceDarkMode,
  onForceDarkModeChange,
  imageQuality,
  onImageQualityChange,
  globalReaderSettings,
  onReadingModeChange,
  onDoublePageSettingChange,
  perMangaOverrides,
  onResetMangaOverride,
  onClearAllOverrides
}: ReaderSettingsSectionProps): React.JSX.Element {
  const getModeName = (mode: string): string => {
    if (mode === 'single') return 'Single Page'
    if (mode === 'double') return 'Double Page'
    return 'Vertical Scroll'
  }

  return (
    <div className="reader-settings__container flex flex-col gap-5">
      <div>
        <h4 className="reader-settings__heading">Reader Display Settings</h4>

        {isLoading ? (
          <p className="text-body text-secondary">Loading settings...</p>
        ) : (
          <div className="reader-settings__controls flex flex-col gap-4">
            <Switch
              checked={forceDarkMode}
              onChange={onForceDarkModeChange}
              label="Force dark mode in reader"
              description="Always use dark background when reading, regardless of app theme"
            />

            <Select
              value={imageQuality}
              onChange={onImageQualityChange}
              options={imageQualityOptions}
              label="Image quality"
              helperText="High quality uses more bandwidth but looks better"
            />
          </div>
        )}
      </div>

      <div className="reader-settings__divider">
        <h4 className="reader-settings__heading">Global Reader Settings</h4>
        <p className="reader-settings__description">
          These settings apply to all manga by default. You can override them per-manga in the
          reader.
        </p>

        {isLoading ? (
          <p className="text-body text-secondary">Loading settings...</p>
        ) : (
          <div className="reader-settings__controls flex flex-col gap-4">
            <Select
              value={globalReaderSettings.readingMode}
              onChange={onReadingModeChange}
              options={readingModeOptions}
              label="Default reading mode"
              helperText="How pages are displayed when reading manga"
            />

            {globalReaderSettings.readingMode === 'double' && (
              <div className="reader-settings__double-page-box flex flex-col gap-3">
                <h5 className="reader-settings__subheading">Double Page Mode Options</h5>
                <Switch
                  checked={globalReaderSettings.doublePageMode?.skipCoverPages ?? true}
                  onChange={(checked) => onDoublePageSettingChange('skipCoverPages', checked)}
                  label="Skip cover pages (show first page alone)"
                />
                <Switch
                  checked={globalReaderSettings.doublePageMode?.readRightToLeft ?? true}
                  onChange={(checked) => onDoublePageSettingChange('readRightToLeft', checked)}
                  label="Read right-to-left (manga style)"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="reader-settings__divider">
        <div className="reader-settings__overrides-header flex justify-between items-center">
          <h4 className="reader-settings__heading-no-margin">Per-Manga Overrides</h4>
          {perMangaOverrides.length > 0 && (
            <Button
              onClick={async () => {
                const confirmed = await globalThis.api.showConfirmDialog(
                  'Clear all custom reading settings?',
                  `You have custom settings for ${perMangaOverrides.length} manga. They'll all be reset to your global defaults. You can't undo this!`,
                  'Clear All',
                  'Cancel'
                )
                if (confirmed.data) {
                  onClearAllOverrides()
                }
              }}
              variant="danger"
            >
              Clear All
            </Button>
          )}
        </div>
        <p className="reader-settings__description">
          Manga with custom reading mode settings. Reset them to use global defaults.
        </p>

        {isLoading ? <p className="text-body text-secondary">Loading overrides...</p> : null}

        {!isLoading && perMangaOverrides.length === 0 ? (
          <div className="reader-settings__empty-state">
            <p className="reader-settings__empty-text">
              No custom settings yet. Change reading modes while reading to create overrides.
            </p>
          </div>
        ) : null}

        {!isLoading && perMangaOverrides.length > 0 ? (
          <div className="reader-settings__overrides-list flex flex-col gap-2">
            {perMangaOverrides.map((override) => (
              <div
                key={override.mangaId}
                className="reader-settings__override-item flex justify-between items-center gap-3"
              >
                {override.coverUrl && (
                  <img
                    src={override.coverUrl.replace('https://', 'mangadex://')}
                    alt={`${override.mangaTitle} cover`}
                    className="reader-settings__override-cover"
                  />
                )}
                <div className="reader-settings__override-info">
                  <div className="reader-settings__override-title">{override.mangaTitle}</div>
                  <div className="reader-settings__override-mode">
                    Mode: {getModeName(override.settings.readingMode)}
                    {override.settings.readingMode === 'double' &&
                      override.settings.doublePageMode && (
                        <>
                          {' • '}
                          {override.settings.doublePageMode.readRightToLeft ? 'RTL' : 'LTR'}
                          {override.settings.doublePageMode.skipCoverPages && ' • Skip covers'}
                        </>
                      )}
                  </div>
                </div>
                <Button
                  onClick={() => onResetMangaOverride(override.mangaId)}
                  variant="secondary"
                  icon={<Delete24Regular />}
                >
                  Reset
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
