import React from 'react'
import { Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Select, type SelectOption } from '@renderer/components/Select'
import { RadioGroup, Radio } from '@renderer/components/Radio'
import { Switch } from '@renderer/components/Switch'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  onImageQualityChange: (quality: string) => void
  globalReaderSettings: MangaReadingSettings
  onReadingModeChange: (mode: string | string[]) => void
  onDoublePageSettingChange: (key: 'skipCoverPages' | 'readRightToLeft', value: boolean) => void
  perMangaOverrides: PerMangaOverride[]
  onResetMangaOverride: (mangaId: string) => void
  onClearAllOverrides: () => void
}

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
}: Readonly<ReaderSettingsSectionProps>): React.JSX.Element {
  const { t } = useTranslation(['settings', 'common', 'dialogs'])

  const readingModeOptions: SelectOption[] = [
    { value: 'single', label: t('common:readingMode.singlePage') },
    { value: 'double', label: t('common:readingMode.doublePage') },
    { value: 'vertical', label: t('common:readingMode.verticalScroll') }
  ]

  const getModeName = (mode: string): string => {
    if (mode === 'single') return t('common:readingMode.singlePage')
    if (mode === 'double') return t('common:readingMode.doublePage')
    return t('common:readingMode.verticalScroll')
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

            <RadioGroup
              value={imageQuality}
              onChange={(value) => onImageQualityChange(value as 'data' | 'data-saver')}
              name="image-quality"
              label="Image quality"
            >
              <Radio
                value="data"
                label={t('common:quality.highQuality')}
                description={t('common:form.helperText.highQuality')}
              />
              <Radio
                value="data-saver"
                label={t('common:quality.dataSaver')}
                description={t('common:form.helperText.dataSaver')}
              />
            </RadioGroup>
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
                  t('dialogs:confirmations.clearAllOverrides.title'),
                  t('dialogs:confirmations.clearAllOverrides.message', {
                    count: perMangaOverrides.length
                  }),
                  t('settings:reader.clearAllButton'),
                  t('common:button.cancel')
                )
                if (confirmed.data) {
                  onClearAllOverrides()
                }
              }}
              variant="danger"
            >
              {t('settings:reader.clearAllButton')}
            </Button>
          )}
        </div>
        <p className="reader-settings__description">{t('settings:reader.overridesDescription')}</p>

        {isLoading ? (
          <p className="text-body text-secondary">{t('settings:reader.loadingOverrides')}</p>
        ) : null}

        {!isLoading && perMangaOverrides.length === 0 ? (
          <div className="reader-settings__empty-state">
            <p className="reader-settings__empty-text">{t('settings:reader.emptyOverrides')}</p>
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
                    {t('settings:reader.overrideMode', {
                      mode: getModeName(override.settings.readingMode)
                    })}
                    {override.settings.readingMode === 'double' &&
                      override.settings.doublePageMode && (
                        <>
                          {' • '}
                          {t('settings:reader.overrideDetails', {
                            rtl: override.settings.doublePageMode.readRightToLeft ? 'RTL' : 'LTR'
                          })}
                        </>
                      )}
                  </div>
                </div>
                <Button
                  onClick={() => onResetMangaOverride(override.mangaId)}
                  variant="secondary"
                  icon={<Delete24Regular />}
                >
                  {t('settings:reader.resetButton')}
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
