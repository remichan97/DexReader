import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { useToastStore, useAppStore } from '@renderer/stores'
import type { MangaReadingSettings } from '../../../../preload/index.d'
import { AppearanceSettings } from './components/AppearanceSettings'
import { ReaderSettingsSection } from './components/ReaderSettingsSection'
import { StorageSettings } from './components/StorageSettings'
import { AdvancedSettings } from './components/AdvancedSettings'
import { DangerZoneSettings } from '../../components/SettingsView/DangerZoneSettings'

interface PerMangaOverride {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  settings: MangaReadingSettings
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
  const [globalReaderSettings, setGlobalReaderSettings] = useState<MangaReadingSettings>({
    readingMode: 'single' as MangaReadingSettings['readingMode']
  })
  const [forceDarkMode, setForceDarkMode] = useState<boolean>(true)
  const [imageQuality, setImageQuality] = useState<'data' | 'data-saver'>('data')
  const [perMangaOverrides, setPerMangaOverrides] = useState<PerMangaOverride[]>([])
  const [isLoadingReaderSettings, setIsLoadingReaderSettings] = useState(true)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const pathsResult = await globalThis.fileSystem.getAllowedPaths()
        if (!pathsResult.success || !pathsResult.data) {
          throw new Error('Failed to get allowed paths')
        }
        const paths = pathsResult.data
        setDownloadsPath(paths.downloads)

        // Get system accent color first
        const systemAccentResult = await globalThis.api.getSystemAccentColor()
        if (!systemAccentResult.success || !systemAccentResult.data) {
          throw new Error('Failed to get system accent color')
        }
        const systemAccent = systemAccentResult.data as string
        setSystemAccentColor(systemAccent)

        // Load settings via IPC
        try {
          const settingsResult = await globalThis.settings.load()
          if (!settingsResult.success || !settingsResult.data) {
            throw new Error('Failed to load settings')
          }
          const settings = settingsResult.data

          // Load theme from settings
          if (settings.appearance.theme) {
            setThemeMode(settings.appearance.theme)
          }

          if (settings.appearance.accentColor) {
            // User has custom color - use it
            setAccentColor(settings.appearance.accentColor)
            setIsUsingSystemColor(false)
            applyAccentColor(settings.appearance.accentColor)
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
          }

          // Load per-manga overrides from database
          const overridesResult = await globalThis.reader.getAllMangaOverrides()
          if (overridesResult.success && overridesResult.data) {
            const overrides: PerMangaOverride[] = overridesResult.data.map((override) => ({
              mangaId: override.mangaId,
              mangaTitle: override.title,
              coverUrl: override.coverUrl,
              settings: override.readerSettings
            }))
            setPerMangaOverrides(overrides)
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
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      delete settings.accentColor
      const result = await globalThis.settings.save('accentColor', undefined)
      if (!result.success) {
        throw new Error('Failed to save settings')
      }
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
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      settings.accentColor = color
      const result = await globalThis.settings.save('accentColor', color)
      if (!result.success) {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      // Silently fail - user can see the UI hasn't changed
      console.error('Failed to save accent color:', error)
    }
  }

  // Handle theme mode change
  const handleThemeModeChange = async (mode: string): Promise<void> => {
    setThemeMode(mode as 'system' | 'light' | 'dark')

    try {
      const result = await globalThis.settings.save('theme', mode)
      if (!result.success) {
        throw new Error('Failed to save theme setting')
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  // Handle downloads folder selection
  const handleSelectDownloadsFolder = async (): Promise<void> => {
    setIsChangingPath(true)
    try {
      const response = await globalThis.fileSystem.selectDownloadsFolder()
      if (!response.success || !response.data) {
        throw new Error('Failed to select downloads folder')
      }
      const result = response.data

      if (!result.cancelled && result.filePath) {
        setDownloadsPath(result.filePath)
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

    const updatedSettings: MangaReadingSettings = {
      ...globalReaderSettings,
      readingMode: selectedMode as MangaReadingSettings['readingMode']
    }
    setGlobalReaderSettings(updatedSettings)

    try {
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).global = updatedSettings

      const result = await globalThis.settings.save('reader', settings.reader)
      if (!result.success) {
        throw new Error('Failed to save reader settings')
      }
      // Success - no toast needed
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
    const updatedSettings: MangaReadingSettings = {
      ...globalReaderSettings,
      doublePageMode: {
        skipCoverPages: globalReaderSettings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: globalReaderSettings.doublePageMode?.readRightToLeft ?? true,
        [key]: value
      }
    }
    setGlobalReaderSettings(updatedSettings)

    try {
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).global = updatedSettings

      const result = await globalThis.settings.save('reader', settings.reader)
      if (!result.success) {
        throw new Error('Failed to save reader settings')
      }
      // Success - no toast needed
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
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).forceDarkMode = enabled

      const result = await globalThis.settings.save('reader', settings.reader)
      if (!result.success) {
        throw new Error('Failed to save reader settings')
      }
      // Success - no toast needed
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
      const pathsResult = await globalThis.fileSystem.getAllowedPaths()
      if (!pathsResult.success || !pathsResult.data) {
        throw new Error('Failed to get allowed paths')
      }
      const paths = pathsResult.data
      const settingsPath = paths.appData + '/settings.json'

      let settings: Record<string, unknown> = {}
      try {
        const existingResult = await globalThis.fileSystem.readFile(settingsPath, 'utf-8')
        if (existingResult.success && existingResult.data) {
          settings = JSON.parse(existingResult.data as string)
        }
      } catch {
        // File doesn't exist, use empty object
      }

      if (!settings.reader) {
        settings.reader = {}
      }
      ;(settings.reader as Record<string, unknown>).quality = selectedQuality

      const result = await globalThis.settings.save('reader', settings.reader)
      if (!result.success) {
        throw new Error('Failed to save reader settings')
      }
      // Success - no toast needed
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
      const result = await globalThis.reader.resetMangaReaderSettings(mangaId)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to reset settings')
      }

      setPerMangaOverrides((prev) => prev.filter((o) => o.mangaId !== mangaId))
      // Success - no toast needed
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
      // Clear all overrides in a single database operation
      const result = await globalThis.reader.clearAllOverrides()

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear all overrides')
      }

      setPerMangaOverrides([])
      // Success - no toast needed
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
            onThemeModeChange={handleThemeModeChange}
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
          <DangerZoneSettings />
        </TabPanel>
      </Tabs>
    </div>
  )
}
