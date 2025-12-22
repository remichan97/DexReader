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

  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Theme</h4>
        <Select
          value={themeMode}
          onChange={(value) => onThemeModeChange(value as typeof themeMode)}
          options={themeModeOptions}
          label="App theme"
          helperText="Choose between light and dark mode, or follow your system settings"
        />
      </div>

      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Accent Color</h4>
        <div style={{ marginBottom: '12px' }}>
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
          <p style={{ fontSize: '13px', color: 'var(--win-text-secondary)', marginTop: '8px' }}>
            {isUsingSystemColor
              ? `Using system accent color (${systemAccentColor})`
              : 'Using custom accent color. Click "Use System" to restore system color.'}
          </p>
        </div>
      </div>
    </div>
  )
}
