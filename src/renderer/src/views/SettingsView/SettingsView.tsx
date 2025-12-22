import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { useToastStore, useAppStore } from '@renderer/stores'
import type { ReaderSettings } from '../../../../preload/index.d'
import { AppearanceSettings } from './components/AppearanceSettings'
import { ReaderSettingsSection } from './components/ReaderSettingsSection'
import { StorageSettings } from './components/StorageSettings'
import { AdvancedSettings } from './components/AdvancedSettings'

interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  settings: ReaderSettings
}

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

  // Reader settings state
  const [globalReaderSettings, setGlobalReaderSettings] = useState<ReaderSettings>({
    readingMode: 'single' as ReaderSettings['readingMode']
  })
  const [forceDarkMode, setForceDarkMode] = useState<boolean>(true)
  const [imageQuality, setImageQuality] = useState<'data' | 'data-saver'>('data')
  const [perMangaOverrides, setPerMangaOverrides] = useState<PerMangaOverride[]>([])
  const [isLoadingReaderSettings, setIsLoadingReaderSettings] = useState(true)

  // Helper function to load per-manga overrides
  const loadPerMangaOverrides = async (
    mangaSettings: Record<string, unknown>
  ): Promise<PerMangaOverride[]> => {
    const overrides: PerMangaOverride[] = []
    for (const [mangaId, settings] of Object.entries(mangaSettings)) {
      // Try to get manga title from cache or use ID
      let mangaTitle = mangaId
      try {
        const mangaData = await globalThis.api.getManga(mangaId)
        mangaTitle = mangaData.attributes.title.en || mangaData.attributes.title['ja-ro'] || mangaId
      } catch {
        // Failed to get manga title, use ID
      }

      overrides.push({
        mangaId,
        mangaTitle,
        settings: settings as ReaderSettings
      })
    }
    return overrides
  }

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const paths = await globalThis.fileSystem.getAllowedPaths()
        setDownloadsPath(paths.downloads)

        // Get system accent color first
        const systemAccent = await globalThis.api.getSystemAccentColor()
        setSystemAccentColor(systemAccent)

        // Load settings via IPC
        try {
          const settings = await globalThis.electron.ipcRenderer.invoke('settings:load')

          if (settings.accentColor) {
            // User has custom color - use it
            setAccentColor(settings.accentColor)
            setIsUsingSystemColor(false)
            applyAccentColor(settings.accentColor)
          } else {
            // No custom color - use system color
            setAccentColor(systemAccent)
            setIsUsingSystemColor(true)
            applyAccentColor(systemAccent)
          }

          // Load reader settings
          if (settings.reader) {
            if (settings.reader.global) {
              setGlobalReaderSettings(settings.reader.global)
            }

            if (settings.reader.forceDarkMode !== undefined) {
              setForceDarkMode(settings.reader.forceDarkMode)
            }

            if (settings.reader.quality !== undefined) {
              setImageQuality(settings.reader.quality)
            }

            // Load per-manga overrides
            if (settings.reader.manga) {
              const overrides = await loadPerMangaOverrides(settings.reader.manga)
              setPerMangaOverrides(overrides)
            }
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
        setIsLoadingReaderSettings(false)
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
      await globalThis.electron.ipcRenderer.invoke('settings:save', 'accentColor', undefined)
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
      await globalThis.electron.ipcRenderer.invoke('settings:save', 'accentColor', color)
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

  // Handle global reading mode change
  const handleReadingModeChange = async (mode: string | string[]): Promise<void> => {
    // Select component returns string or string[], we only support single selection
    const selectedMode = Array.isArray(mode) ? mode[0] : mode

    const updatedSettings: ReaderSettings = {
      ...globalReaderSettings,
      readingMode: selectedMode as ReaderSettings['readingMode']
    }
    setGlobalReaderSettings(updatedSettings)

    try {
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).global = updatedSettings

      await globalThis.electron.ipcRenderer.invoke('settings:save', 'reader', settings.reader)

      showToast({
        variant: 'success',
        title: 'Settings saved',
        message: 'Global reading mode updated'
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle double page mode checkbox changes
  const handleDoublePageSettingChange = async (
    key: 'skipCoverPages' | 'readRightToLeft',
    value: boolean
  ): Promise<void> => {
    const updatedSettings: ReaderSettings = {
      ...globalReaderSettings,
      doublePageMode: {
        skipCoverPages: globalReaderSettings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: globalReaderSettings.doublePageMode?.readRightToLeft ?? true,
        [key]: value
      }
    }
    setGlobalReaderSettings(updatedSettings)

    try {
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).global = updatedSettings

      await globalThis.electron.ipcRenderer.invoke('settings:save', 'reader', settings.reader)

      showToast({
        variant: 'success',
        title: 'Settings saved',
        message: 'Double page mode settings updated'
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle force dark mode toggle
  const handleForceDarkModeChange = async (enabled: boolean): Promise<void> => {
    setForceDarkMode(enabled)

    try {
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).forceDarkMode = enabled

      await globalThis.electron.ipcRenderer.invoke('settings:save', 'reader', settings.reader)

      showToast({
        variant: 'success',
        title: 'Settings saved',
        message: `Dark mode ${enabled ? 'enabled' : 'disabled'} in reader`
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle image quality change
  const handleImageQualityChange = async (quality: string | string[]): Promise<void> => {
    const selectedQuality = Array.isArray(quality) ? quality[0] : quality
    setImageQuality(selectedQuality as 'data' | 'data-saver')

    try {
      const paths = await globalThis.fileSystem.getAllowedPaths()
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existing = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        settings = JSON.parse(existing as string)
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).quality = selectedQuality

      await globalThis.electron.ipcRenderer.invoke('settings:save', 'reader', settings.reader)

      showToast({
        variant: 'success',
        title: 'Settings saved',
        message: 'Image quality updated'
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Reset individual manga override
  const handleResetMangaOverride = async (mangaId: string): Promise<void> => {
    try {
      await globalThis.reader.resetMangaReaderSettings(mangaId)
      setPerMangaOverrides((prev) => prev.filter((o) => o.mangaId !== mangaId))

      showToast({
        variant: 'success',
        title: 'Override reset',
        message: 'Manga will now use global settings'
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to reset override',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Clear all manga overrides
  const handleClearAllOverrides = async (): Promise<void> => {
    try {
      // Reset all overrides
      await Promise.all(
        perMangaOverrides.map((o) => globalThis.reader.resetMangaReaderSettings(o.mangaId))
      )
      setPerMangaOverrides([])

      showToast({
        variant: 'success',
        title: 'All overrides cleared',
        message: 'All manga will now use global settings'
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to clear overrides',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 'min(1200px, 90%)', margin: '0 auto', width: '100%' }}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab value="appearance">Appearance</Tab>
          <Tab value="storage">Storage</Tab>
          <Tab value="reader">Reader</Tab>
          <Tab value="advanced">Advanced</Tab>
        </TabList>

        {/* Appearance Settings */}
        <TabPanel value="appearance">
          <AppearanceSettings
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            accentColor={accentColor}
            onAccentColorChange={handleAccentColorChange}
            isUsingSystemColor={isUsingSystemColor}
            systemAccentColor={systemAccentColor}
            onUseSystemColor={handleUseSystemColor}
          />
        </TabPanel>

        {/* Storage Settings */}
        <TabPanel value="storage">
          <StorageSettings
            downloadsPath={downloadsPath}
            isLoadingPath={isLoadingPath}
            isChangingPath={isChangingPath}
            onSelectDownloadsFolder={handleSelectDownloadsFolder}
          />
        </TabPanel>

        {/* Reader Settings */}
        <TabPanel value="reader">
          <ReaderSettingsSection
            isLoading={isLoadingReaderSettings}
            forceDarkMode={forceDarkMode}
            onForceDarkModeChange={handleForceDarkModeChange}
            imageQuality={imageQuality}
            onImageQualityChange={handleImageQualityChange}
            globalReaderSettings={globalReaderSettings}
            onReadingModeChange={handleReadingModeChange}
            onDoublePageSettingChange={handleDoublePageSettingChange}
            perMangaOverrides={perMangaOverrides}
            onResetMangaOverride={handleResetMangaOverride}
            onClearAllOverrides={handleClearAllOverrides}
          />
        </TabPanel>

        {/* Advanced Settings */}
        <TabPanel value="advanced">
          <AdvancedSettings />
        </TabPanel>
      </Tabs>
    </div>
  )
}
