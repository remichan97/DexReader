import React from 'react'
import { Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Select, type SelectOption } from '@renderer/components/Select'
import type { ReaderSettings } from '../../../../../preload/index.d'

interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  settings: ReaderSettings
}

interface ReaderSettingsSectionProps {
  isLoading: boolean
  forceDarkMode: boolean
  onForceDarkModeChange: (enabled: boolean) => void
  imageQuality: 'data' | 'data-saver'
  onImageQualityChange: (quality: string | string[]) => void
  globalReaderSettings: ReaderSettings
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
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Reader Display Settings
        </h4>

        {isLoading ? (
          <p style={{ fontSize: '14px', color: 'var(--win-text-secondary)' }}>
            Loading settings...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <input
                type="checkbox"
                checked={forceDarkMode}
                onChange={(e) => onForceDarkModeChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />{' '}
              <div>
                <div style={{ fontWeight: 500 }}>Force dark mode in reader</div>
                <div style={{ fontSize: '13px', color: 'var(--win-text-secondary)' }}>
                  Always use dark background when reading, regardless of app theme
                </div>
              </div>
            </label>

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

      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Global Reader Settings
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--win-text-secondary)',
            marginBottom: '16px'
          }}
        >
          These settings apply to all manga by default. You can override them per-manga in the
          reader.
        </p>

        {isLoading ? (
          <p style={{ fontSize: '14px', color: 'var(--win-text-secondary)' }}>
            Loading settings...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              value={globalReaderSettings.readingMode}
              onChange={onReadingModeChange}
              options={readingModeOptions}
              label="Default reading mode"
              helperText="How pages are displayed when reading manga"
            />

            {globalReaderSettings.readingMode === 'double' && (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--win-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                  Double Page Mode Options
                </h5>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={globalReaderSettings.doublePageMode?.skipCoverPages ?? true}
                    onChange={(e) => onDoublePageSettingChange('skipCoverPages', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />{' '}
                  Skip cover pages (show first page alone)
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={globalReaderSettings.doublePageMode?.readRightToLeft ?? true}
                    onChange={(e) => onDoublePageSettingChange('readRightToLeft', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />{' '}
                  Read right-to-left (manga style)
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}
        >
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Per-Manga Overrides</h4>
          {perMangaOverrides.length > 0 && (
            <Button onClick={onClearAllOverrides} variant="secondary">
              Clear All
            </Button>
          )}
        </div>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--win-text-secondary)',
            marginBottom: '16px'
          }}
        >
          Manga with custom reading mode settings. Reset them to use global defaults.
        </p>

        {isLoading ? (
          <p style={{ fontSize: '14px', color: 'var(--win-text-secondary)' }}>
            Loading overrides...
          </p>
        ) : null}

        {!isLoading && perMangaOverrides.length === 0 ? (
          <div
            style={{
              padding: '24px',
              background: 'var(--win-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '14px', color: 'var(--win-text-secondary)', margin: 0 }}>
              No custom settings yet. Change reading modes while reading to create overrides.
            </p>
          </div>
        ) : null}

        {!isLoading && perMangaOverrides.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {perMangaOverrides.map((override) => (
              <div
                key={override.mangaId}
                style={{
                  padding: '12px 16px',
                  background: 'var(--win-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    {override.mangaTitle}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--win-text-secondary)' }}>
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
