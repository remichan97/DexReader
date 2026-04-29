import React from 'react'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'
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

const themeModeOptions: SelectOption[] = [
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' }
]

const startupPageOptions: SelectOption[] = [
  { value: 'browse', label: 'Browse' },
  { value: 'library', label: 'Library' },
  { value: 'downloads', label: 'Downloads' }
]

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
      alert(
        'Unable to open system settings automatically. Please open your system date/time settings manually:\n\n' +
          'Windows: Settings → Time & Language → Region\n' +
          'macOS: System Preferences → Language & Region\n' +
          'Linux: Check your desktop environment settings'
      )
    }
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      <div>
        <h4 className="appearance-settings__section-title mb-3">Theme</h4>
        <Select
          value={themeMode}
          onChange={(value) => onThemeModeChange(value as typeof themeMode)}
          options={themeModeOptions}
          label="App theme"
          helperText="Choose between light and dark mode, or follow your system settings"
        />
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">Startup</h4>
        <Select
          value={startupPage}
          onChange={(value) => onStartupPageChange(value as typeof startupPage)}
          options={startupPageOptions}
          label="Startup page"
          helperText="Choose which page appears when the app launches"
        />
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">Accent Colour</h4>
        <div className="mb-3">
          <div className="appearance-settings__label">Primary accent colour</div>
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
              Use System
            </Button>
          </div>
          <p className="text-secondary appearance-settings__helper-text mt-2">
            {isUsingSystemColor
              ? `Using system accent colour (${systemAccentColor})`
              : 'You\'re using a custom accent. Click "Use System" to go back to your system colour.'}
          </p>
        </div>
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">Date & Time Format</h4>
        <p className="text-secondary appearance-settings__description mb-3">
          DexReader uses your system&lsquo;s date and time format settings. Dates are displayed in
          chapter lists, reading history, and error logs.
        </p>
        <Button variant="secondary" onClick={handleOpenDateSettings}>
          Configure Date Format in System Settings
        </Button>
        <p className="text-secondary appearance-settings__helper-text mt-2">
          This will open your operating system&apos;s regional settings where you can customise date
          and time formats.
        </p>
      </div>
    </div>
  )
}
