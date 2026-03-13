import React from 'react'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'

interface AppearanceSettingsProps {
  themeMode: 'light' | 'dark' | 'system'
  onThemeModeChange: (mode: 'light' | 'dark' | 'system') => void
  accentColor: string
  onAccentColorChange: (color: string) => void
  isUsingSystemColor: boolean
  systemAccentColor: string
  onUseSystemColor: () => void
}

const themeModeOptions: SelectOption[] = [
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' }
]

export function AppearanceSettings({
  themeMode,
  onThemeModeChange,
  accentColor,
  onAccentColorChange,
  isUsingSystemColor,
  systemAccentColor,
  onUseSystemColor
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
        <h4 className="mb-3" style={{ fontSize: '16px', fontWeight: 600 }}>
          Theme
        </h4>
        <Select
          value={themeMode}
          onChange={(value) => onThemeModeChange(value as typeof themeMode)}
          options={themeModeOptions}
          label="App theme"
          helperText="Choose between light and dark mode, or follow your system settings"
        />
      </div>

      <div>
        <h4 className="mb-3" style={{ fontSize: '16px', fontWeight: 600 }}>
          Accent Color
        </h4>
        <div className="mb-3">
          <div
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}
          >
            Primary accent color
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onAccentColorChange(e.target.value)}
              style={{
                width: '60px',
                height: '40px',
                border: '1px solid var(--win-border-default)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            />
            <Input
              type="text"
              value={accentColor}
              onChange={handleColorInputChange}
              style={{ width: '120px', fontFamily: 'monospace' }}
              placeholder="#0078d4"
            />
            <Button variant="secondary" onClick={onUseSystemColor}>
              Use System
            </Button>
          </div>
          <p className="text-secondary mt-2" style={{ fontSize: '13px' }}>
            {isUsingSystemColor
              ? `Using system accent color (${systemAccentColor})`
              : 'Using custom accent color. Click "Use System" to restore system color.'}
          </p>
        </div>
      </div>

      <div>
        <h4 className="mb-3" style={{ fontSize: '16px', fontWeight: 600 }}>
          Date & Time Format
        </h4>
        <p className="text-secondary mb-3" style={{ fontSize: '14px' }}>
          DexReader uses your system&lsquo;s date and time format settings. Dates are displayed in
          chapter lists, reading history, and error logs.
        </p>
        <Button variant="secondary" onClick={handleOpenDateSettings}>
          Configure Date Format in System Settings
        </Button>
        <p className="text-secondary mt-2" style={{ fontSize: '13px' }}>
          This will open your operating system&apos;s regional settings where you can customize date
          and time formats.
        </p>
      </div>
    </div>
  )
}
