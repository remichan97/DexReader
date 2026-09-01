import { useCallback, useEffect, useState } from 'react'
import { useAppStore, useSidebarStore } from '@renderer/stores'
import type { ThemeMode } from '@renderer/stores/types'
import type { AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

export type StartupPage = 'library' | 'browse' | 'downloads'
export type SidebarSize = 'full' | 'compact' | 'auto-hide'

export interface AppearancePayload {
  appearance: {
    theme: ThemeMode
    accentColor?: string
    startupPage: StartupPage
    sidebarSize: SidebarSize
  }
}

interface UseAppearanceSettingsDomainParams {
  markSettingModified: (key: string) => void
}

export interface UseAppearanceSettingsDomainResult extends SettingsDomain<AppearancePayload> {
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
 * Owns the "Appearance" settings domain (theme, accent colour, startup page, sidebar size).
 * Theme lives in the shared app store since it's read outside SettingsView too; everything
 * else here is local to the settings form until saved.
 */
export function useAppearanceSettingsDomain(
  params: UseAppearanceSettingsDomainParams
): UseAppearanceSettingsDomainResult {
  const { markSettingModified } = params
  const { themeMode, setThemeMode } = useAppStore()
  const { setDisplayMode: setSidebarDisplayMode } = useSidebarStore()

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
    markSettingModified('accentColor')
  }, [systemAccentColor, markSettingModified])

  const handleAccentColorChange = useCallback(
    (color: string): void => {
      setAccentColor(color)
      setIsUsingSystemColor(false)
      applyAccentColorToDocument(color)
      markSettingModified('accentColor')
    },
    [markSettingModified]
  )

  const handleThemeModeChange = useCallback(
    (mode: string): void => {
      setThemeMode(mode as ThemeMode)
      markSettingModified('themeMode')
    },
    [setThemeMode, markSettingModified]
  )

  const handleStartupPageChange = useCallback(
    (page: StartupPage): void => {
      setStartupPage(page)
      markSettingModified('startupPage')
    },
    [markSettingModified]
  )

  const handleSidebarSizeChange = useCallback(
    (size: SidebarSize): void => {
      setSidebarSize(size)
      setSidebarDisplayMode(size)
      markSettingModified('sidebarSize')
    },
    [setSidebarDisplayMode, markSettingModified]
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

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      themeMode !== original.appearance.theme ||
      startupPage !== original.appearance.startupPage ||
      sidebarSize !== original.appearance.sidebarSize ||
      (isUsingSystemColor
        ? original.appearance.accentColor !== undefined
        : original.appearance.accentColor !== accentColor),
    [themeMode, startupPage, sidebarSize, isUsingSystemColor, accentColor]
  )

  const buildPayload = useCallback(
    (): AppearancePayload => ({
      appearance: {
        theme: themeMode,
        accentColor: isUsingSystemColor ? undefined : accentColor,
        startupPage,
        sidebarSize
      }
    }),
    [themeMode, isUsingSystemColor, accentColor, startupPage, sidebarSize]
  )

  const reset = useCallback(
    (original: AppSettings): void => {
      setThemeMode(original.appearance.theme)
      setStartupPage(original.appearance.startupPage)
      setSidebarSize(original.appearance.sidebarSize)
      setSidebarDisplayMode(original.appearance.sidebarSize)
      if (original.appearance.accentColor) {
        setAccentColor(original.appearance.accentColor)
        setIsUsingSystemColor(false)
        applyAccentColorToDocument(original.appearance.accentColor)
      } else {
        applyFallbackAccent(systemAccentColor)
      }
    },
    [setThemeMode, setSidebarDisplayMode, systemAccentColor, applyFallbackAccent]
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
    applyFallbackAccent,
    isDirty,
    buildPayload,
    reset
  }
}
