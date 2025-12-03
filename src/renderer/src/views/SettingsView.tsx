import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { useToastStore, useAppStore } from '@renderer/stores'

export function SettingsView(): JSX.Element {
  // Zustand stores
  const showToast = useToastStore((state) => state.show)

  // App state (theme)
  const { themeMode, setThemeMode } = useAppStore()

  // Local state for UI
  const [activeTab, setActiveTab] = useState('appearance')
  const [downloadsPath, setDownloadsPath] = useState<string>('')
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [isChangingPath, setIsChangingPath] = useState(false)
  const [accentColor, setAccentColor] = useState<string>('#0078d4')
  const [isUsingSystemColor, setIsUsingSystemColor] = useState<boolean>(true)
  const [systemAccentColor, setSystemAccentColor] = useState<string>('#0078d4')

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const paths = await globalThis.fileSystem.getAllowedPaths()
        setDownloadsPath(paths.downloads)

        // Get system accent color first
        const systemAccent = await globalThis.api.getSystemAccentColor()
        setSystemAccentColor(systemAccent)

        // Load accent color from settings, fallback to system color
        try {
          const settings = await globalThis.fileSystem.readFile(
            paths.appData + '/settings.json',
            'utf-8'
          )
          const parsed = JSON.parse(settings as string)
          if (parsed.accentColor) {
            // User has custom color - use it
            setAccentColor(parsed.accentColor)
            setIsUsingSystemColor(false)
            applyAccentColor(parsed.accentColor)
          } else {
            // No custom color - use system color
            setAccentColor(systemAccent)
            setIsUsingSystemColor(true)
            applyAccentColor(systemAccent)
          }
        } catch {
          // Settings file doesn't exist - use system color
          setAccentColor(systemAccent)
          setIsUsingSystemColor(true)
          applyAccentColor(systemAccent)
        }
      } catch {
        // Fallback to default if everything fails
        console.log('Using default settings')
        setAccentColor('#0078d4')
        applyAccentColor('#0078d4')
      } finally {
        setIsLoadingPath(false)
      }
    }
    loadSettings()
  }, [showToast])

  // Listen for system accent color changes
  useEffect(() => {
    const handleAccentColorChange = (newColor: string): void => {
      setSystemAccentColor(newColor)
      // If user is currently using system color, update the active color too
      if (isUsingSystemColor) {
        setAccentColor(newColor)
        applyAccentColor(newColor)
      }
    }

    globalThis.api.onAccentColorChanged(handleAccentColorChange)
  }, [isUsingSystemColor])

  // Apply accent color to CSS variables
  const applyAccentColor = (color: string): void => {
    const root = document.documentElement
    root.style.setProperty('--win-accent', color)

    // Calculate hover and active states (slightly darker/lighter)
    const rgb = Number.parseInt(color.slice(1), 16)
    const r = (rgb >> 16) & 255
    const g = (rgb >> 8) & 255
    const b = rgb & 255

    // Darker for hover (-10%)
    const hoverR = Math.max(0, Math.floor(r * 0.9))
    const hoverG = Math.max(0, Math.floor(g * 0.9))
    const hoverB = Math.max(0, Math.floor(b * 0.9))
    const hoverColor = `#${((hoverR << 16) | (hoverG << 8) | hoverB).toString(16).padStart(6, '0')}`

    // Even darker for active (-20%)
    const activeR = Math.max(0, Math.floor(r * 0.8))
    const activeG = Math.max(0, Math.floor(g * 0.8))
    const activeB = Math.max(0, Math.floor(b * 0.8))
    const activeColor = `#${((activeR << 16) | (activeG << 8) | activeB).toString(16).padStart(6, '0')}`

    root.style.setProperty('--win-accent-hover', hoverColor)
    root.style.setProperty('--win-accent-active', activeColor)
  }

  // Restore system accent color
  const handleUseSystemColor = async (): Promise<void> => {
    setAccentColor(systemAccentColor)
    setIsUsingSystemColor(true)
    applyAccentColor(systemAccentColor)

    try {
      // Remove custom color from settings
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      delete settings.accentColor
      await globalThis.fileSystem.writeFile(
        settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      )
    } catch (error) {
      // Silently fail - user can see the UI hasn't changed
      console.error('Failed to save system color preference:', error)
    }
  }

  // Handle accent color change
  const handleAccentColorChange = async (color: string): Promise<void> => {
    setAccentColor(color)
    setIsUsingSystemColor(false)
    applyAccentColor(color)

    try {
      // Save to settings.json
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      settings.accentColor = color
      await globalThis.fileSystem.writeFile(
        settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      )
    } catch (error) {
      // Silently fail - user can see the UI hasn't changed
      console.error('Failed to save accent color:', error)
    }
  }

  // Handle downloads folder selection
  const handleSelectDownloadsFolder = async (): Promise<void> => {
    setIsChangingPath(true)
    try {
      const result = await globalThis.fileSystem.selectDownloadsFolder()

      if (!result.cancelled && result.path) {
        setDownloadsPath(result.path)
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: "Couldn't change downloads folder",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsChangingPath(false)
    }
  }

  // Options for theme select
  const themeModeOptions: SelectOption[] = [
    { value: 'system', label: 'System Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 'min(1200px, 90%)', margin: '0 auto', width: '100%' }}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab value="appearance">Appearance</Tab>
          <Tab value="storage">Storage</Tab>
        </TabList>

        {/* Appearance Settings */}
        <TabPanel value="appearance">
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Theme</h4>
              <Select
                value={themeMode}
                onChange={(value) => setThemeMode(value as typeof themeMode)}
                options={themeModeOptions}
                label="App theme"
                helperText="Choose between light and dark mode, or follow your system settings"
              />
            </div>

            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                Accent Color
              </h4>
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
                    onChange={(e) => handleAccentColorChange(e.target.value)}
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
                    onChange={(value) => {
                      if (typeof value === 'string') {
                        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                          handleAccentColorChange(value)
                        } else {
                          setAccentColor(value)
                        }
                      }
                    }}
                    style={{ width: '120px', fontFamily: 'monospace' }}
                    placeholder="#0078d4"
                  />
                  <Button variant="secondary" onClick={handleUseSystemColor}>
                    Use System
                  </Button>
                </div>
                <p
                  style={{ fontSize: '13px', color: 'var(--win-text-secondary)', marginTop: '8px' }}
                >
                  {isUsingSystemColor
                    ? `Using system accent color (${systemAccentColor})`
                    : 'Using custom accent color. Click "Use System" to restore system color.'}
                </p>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Storage Settings */}
        <TabPanel value="storage">
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                Downloads Location
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--win-text-secondary)',
                  marginBottom: '12px'
                }}
              >
                Where should we save your downloaded chapters?
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  alignItems: 'start'
                }}
              >
                <Input
                  type="text"
                  value={isLoadingPath ? 'Loading...' : downloadsPath}
                  onChange={() => {}}
                  readOnly
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    cursor: 'default',
                    width: '100%'
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={handleSelectDownloadsFolder}
                  loading={isChangingPath}
                  disabled={isLoadingPath}
                >
                  Browse...
                </Button>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--win-text-tertiary)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Lightbulb16Regular style={{ flexShrink: 0 }} />
                <span>
                  Tip: Choose a location with plenty of free space for your manga collection.
                </span>
              </p>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}
