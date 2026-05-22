import React from 'react'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './AppearanceSettings.css'

interface AppearanceSettingsProps {
  readonly themeMode: 'light' | 'dark' | 'system'
  readonly onThemeModeChange: (mode: 'light' | 'dark' | 'system') => void
  readonly accentColor: string
  readonly onAccentColorChange: (color: string) => void
  readonly isUsingSystemColor: boolean
  readonly systemAccentColor: string
  readonly onUseSystemColor: () => void
  readonly startupPage: 'library' | 'browse' | 'downloads'
  readonly onStartupPageChange: (page: 'library' | 'browse' | 'downloads') => void
}

export function AppearanceSettings({
  themeMode,
  onThemeModeChange,
  accentColor,
  onAccentColorChange,
  isUsingSystemColor,
  systemAccentColor,
  onUseSystemColor,
  startupPage,
  onStartupPageChange
}: AppearanceSettingsProps): React.JSX.Element {
  const { t } = useTranslation('settings')

  const themeModeOptions: SelectOption[] = [
    { value: 'system', label: t('appearance.themeOptions.system') },
    { value: 'light', label: t('appearance.themeOptions.light') },
    { value: 'dark', label: t('appearance.themeOptions.dark') }
  ]

  const startupPageOptions: SelectOption[] = [
    { value: 'browse', label: t('appearance.startupOptions.browse') },
    { value: 'library', label: t('appearance.startupOptions.library') },
    { value: 'downloads', label: t('appearance.startupOptions.downloads') }
  ]

  const handleColorInputChange = (value: string | string[]): void => {
    const colorValue = typeof value === 'string' ? value : value[0]
    if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
      onAccentColorChange(colorValue)
    }
  }

  const handleOpenDateSettings = async (): Promise<void> => {
    const result = await globalThis.settings.openSystemDateSettings()
    if (!result.success || !result.data) {
      // Fallback message if platform not supported or failed
      globalThis.api.showDialog({
        message: t('appearance.configureDateFallback', {
          defaultValue:
            'Unable to open system settings automatically. Please open your system date/time settings manually:\n\n' +
            'Windows: Settings → Time & Language → Region\n' +
            'macOS: System Preferences → Language & Region\n' +
            'Linux: Check your desktop environment settings'
        }),
        type: 'error',
        buttons: [t('common:button.ok')],
        label: t('appearance.configureDateFallbackTitle', {
          defaultValue: 'Unable to Open system settings'
        })
      })
    }
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      <div>
        <h4 className="appearance-settings__section-title mb-3">{t('appearance.sectionTitle')}</h4>
        <Select
          value={themeMode}
          onChange={(value) => onThemeModeChange(value as typeof themeMode)}
          options={themeModeOptions}
          label={t('appearance.themeLabel')}
          helperText={t('appearance.themeHelper')}
        />
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">
          {t('appearance.startupSection')}
        </h4>
        <Select
          value={startupPage}
          onChange={(value) => onStartupPageChange(value as typeof startupPage)}
          options={startupPageOptions}
          label={t('appearance.startupLabel')}
          helperText={t('appearance.startupHelper')}
        />
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">{t('appearance.accentSection')}</h4>
        <div className="mb-3">
          <div className="appearance-settings__label">{t('appearance.accentLabel')}</div>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onAccentColorChange(e.target.value)}
              className="appearance-settings__color-picker"
            />
            <Input
              type="text"
              value={accentColor}
              onChange={handleColorInputChange}
              className="appearance-settings__hex-input"
              placeholder="#0078d4"
            />
            <Button variant="secondary" onClick={onUseSystemColor}>
              {t('appearance.useSystemButton')}
            </Button>
          </div>
          <p className="text-secondary appearance-settings__helper-text mt-2">
            {isUsingSystemColor
              ? t('appearance.usingSystem', { color: systemAccentColor })
              : t('appearance.usingCustom')}
          </p>
        </div>
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">
          {t('appearance.dateTimeSection')}
        </h4>
        <p className="text-secondary appearance-settings__description mb-3">
          {t('appearance.dateTimeDescription')}
        </p>
        <Button variant="secondary" onClick={handleOpenDateSettings}>
          {t('appearance.configureDateButton')}
        </Button>
        <p className="text-secondary appearance-settings__helper-text mt-2">
          {t('appearance.configureDateHelper')}
        </p>
      </div>
    </div>
  )
}
