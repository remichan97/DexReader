import { useCallback, useEffect, useState } from 'react'
import { useAppStore, useSidebarStore } from '@renderer/stores'
import type { ThemeMode } from '@renderer/stores/types'
import { queueSettingsWrite, writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import type { AppSettings } from '../../../../../../preload/window.types'

export type StartupPage = 'library' | 'browse' | 'downloads'
export type SidebarSize = 'full' | 'compact' | 'auto-hide'

export interface UseAppearanceSettingsDomainResult {
  themeMode: ThemeMode
  accentColor: string
  isUsingSystemColor: boolean
  systemAccentColor: string
  startupPage: StartupPage
  sidebarSize: SidebarSize
  handleThemeModeChange: (mode: string) => void
  handleAccentColorChange: (color: string) => void
  handleUseSystemColor: () => void
  handleStartupPageChange: (page: StartupPage) => void
  handleSidebarSizeChange: (size: SidebarSize) => void
  loadFromSettings: (settings: AppSettings, systemAccent: string) => void
  applyFallbackAccent: (color: string) => void
}

function applyAccentColorToDocument(color: string): void {
  const root = document.documentElement
  root.style.setProperty('--win-accent', color)

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

/**
 * Owns the "Appearance" settings domain (theme, accent colour, startup page, sidebar
 * size). Theme lives in the shared app store since it's read outside SettingsView too.
 * All four fields share the `appearance` section, so every handler writes it whole
 * (current values for the others, the new value for the one that changed). accentColor
 * is debounced (queueSettingsWrite) since it's a continuous input; everything else
 * writes immediately (writeSettingsSection).
 */
export function useAppearanceSettingsDomain(): UseAppearanceSettingsDomainResult {
  const themeMode = useAppStore((state) => state.themeMode)
  const setThemeMode = useAppStore((state) => state.setThemeMode)
  const setSidebarDisplayMode = useSidebarStore((state) => state.setDisplayMode)

  const [accentColor, setAccentColor] = useState<string>('#0078d4')
  const [isUsingSystemColor, setIsUsingSystemColor] = useState<boolean>(true)
  const [systemAccentColor, setSystemAccentColor] = useState<string>('#0078d4')
  const [startupPage, setStartupPage] = useState<StartupPage>('browse')
  const [sidebarSize, setSidebarSize] = useState<SidebarSize>('full')

  // Listen for system accent color changes
  useEffect(() => {
    const handleAccentColorChange = (newColor: string): void => {
      setSystemAccentColor(newColor)
      if (isUsingSystemColor) {
        setAccentColor(newColor)
        applyAccentColorToDocument(newColor)
      }
    }

    globalThis.api.onAccentColorChanged(handleAccentColorChange)
  }, [isUsingSystemColor])

  const applyFallbackAccent = useCallback((color: string): void => {
    setAccentColor(color)
    setIsUsingSystemColor(true)
    applyAccentColorToDocument(color)
  }, [])

  const handleUseSystemColor = useCallback((): void => {
    setAccentColor(systemAccentColor)
    setIsUsingSystemColor(true)
    applyAccentColorToDocument(systemAccentColor)
    void writeSettingsSection('appearance', {
      theme: themeMode,
      accentColor: undefined,
      startupPage,
      sidebarSize
    })
  }, [systemAccentColor, themeMode, startupPage, sidebarSize])

  // Autosaved (debounced) rather than buffered - see settingsPendingWrites.ts. Every
  // value reaching here is already a valid 6-digit hex (gated upstream by the native
  // colour input and the hex text field's own regex check), but the isValid callback
  // mirrors the backend's validator as a defence-in-depth safety net.
  const handleAccentColorChange = useCallback(
    (color: string): void => {
      setAccentColor(color)
      setIsUsingSystemColor(false)
      applyAccentColorToDocument(color)

      queueSettingsWrite(
        'appearance.accentColor',
        'appearance',
        { theme: themeMode, accentColor: color, startupPage, sidebarSize },
        () => /^#([0-9A-F]{3}){1,2}$/i.test(color)
      )
    },
    [themeMode, startupPage, sidebarSize]
  )

  const handleThemeModeChange = useCallback(
    (mode: string): void => {
      const newTheme = mode as ThemeMode
      setThemeMode(newTheme)
      void writeSettingsSection('appearance', {
        theme: newTheme,
        accentColor: isUsingSystemColor ? undefined : accentColor,
        startupPage,
        sidebarSize
      })
    },
    [setThemeMode, isUsingSystemColor, accentColor, startupPage, sidebarSize]
  )

  const handleStartupPageChange = useCallback(
    (page: StartupPage): void => {
      setStartupPage(page)
      void writeSettingsSection('appearance', {
        theme: themeMode,
        accentColor: isUsingSystemColor ? undefined : accentColor,
        startupPage: page,
        sidebarSize
      })
    },
    [themeMode, isUsingSystemColor, accentColor, sidebarSize]
  )

  const handleSidebarSizeChange = useCallback(
    (size: SidebarSize): void => {
      setSidebarSize(size)
      setSidebarDisplayMode(size)
      void writeSettingsSection('appearance', {
        theme: themeMode,
        accentColor: isUsingSystemColor ? undefined : accentColor,
        startupPage,
        sidebarSize: size
      })
    },
    [setSidebarDisplayMode, themeMode, isUsingSystemColor, accentColor, startupPage]
  )

  const loadFromSettings = useCallback(
    (settings: AppSettings, systemAccent: string): void => {
      setSystemAccentColor(systemAccent)

      if (settings.appearance.theme) {
        setThemeMode(settings.appearance.theme)
      }
      if (settings.appearance.startupPage) {
        setStartupPage(settings.appearance.startupPage)
      }
      if (settings.appearance.sidebarSize) {
        setSidebarSize(settings.appearance.sidebarSize)
        setSidebarDisplayMode(settings.appearance.sidebarSize)
      }

      if (settings.appearance.accentColor) {
        setAccentColor(settings.appearance.accentColor)
        setIsUsingSystemColor(false)
        applyAccentColorToDocument(settings.appearance.accentColor)
      } else {
        applyFallbackAccent(systemAccent)
      }
    },
    [setThemeMode, setSidebarDisplayMode, applyFallbackAccent]
  )

  return {
    themeMode,
    accentColor,
    isUsingSystemColor,
    systemAccentColor,
    startupPage,
    sidebarSize,
    handleThemeModeChange,
    handleAccentColorChange,
    handleUseSystemColor,
    handleStartupPageChange,
    handleSidebarSizeChange,
    loadFromSettings,
    applyFallbackAccent
  }
}
