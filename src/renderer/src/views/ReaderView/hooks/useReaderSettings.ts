import { useState, useEffect, useCallback } from 'react'
import type { ReadingMode } from '@renderer/components/ReadingModeSelector'
import type { MangaReadingSettings } from '../../../../../preload/index.d'

interface DoublePageSettings {
  skipCoverPages: boolean
  readRightToLeft: boolean
}

interface UseReaderSettingsReturn {
  readingMode: ReadingMode
  doublePageSettings: DoublePageSettings
  showSettingsModal: boolean
  settingsLoaded: boolean
  toggleSettingsModal: () => void
  handleSettingsChange: (settings: MangaReadingSettings) => void
}

/**
 * Custom hook for managing reader settings (reading mode, double page settings)
 * Handles loading per-manga settings from backend and saving changes
 */
export function useReaderSettings(mangaId: string | null): UseReaderSettingsReturn {
  const [readingMode, setReadingMode] = useState<ReadingMode>('single')
  const [doublePageSettings, setDoublePageSettings] = useState<DoublePageSettings>({
    skipCoverPages: true,
    readRightToLeft: false
  })
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load settings when mangaId changes
  useEffect(() => {
    if (!mangaId) return

    setSettingsLoaded(false)

    globalThis.reader
      .getMangaReaderSettings(mangaId)
      .then((response) => {
        if (!response.success || !response.data) {
          console.warn('Failed to load reader settings:', response.error)
          setSettingsLoaded(true)
          return
        }

        const settings = response.data

        setReadingMode(settings.readingMode)
        setDoublePageSettings({
          skipCoverPages: settings.doublePageMode?.skipCoverPages ?? true,
          readRightToLeft: settings.doublePageMode?.readRightToLeft ?? false
        })
        setSettingsLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load reader settings:', error)
        setSettingsLoaded(true) // Still mark as loaded to allow reading
      })
  }, [mangaId])

  const toggleSettingsModal = useCallback(() => {
    setShowSettingsModal((prev) => !prev)
  }, [])

  const handleSettingsChange = useCallback(
    (newSettings: MangaReadingSettings): void => {
      if (!mangaId) return

      const newDoublePageSettings = {
        skipCoverPages: newSettings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: newSettings.doublePageMode?.readRightToLeft ?? true
      }

      // Update state immediately
      setReadingMode(newSettings.readingMode)
      setDoublePageSettings(newDoublePageSettings)

      // Load global settings to compare (async, but don't block)
      ;(async () => {
        try {
          const settingsResult = await globalThis.electron.ipcRenderer.invoke('settings:load')
          if (settingsResult.success && settingsResult.data?.reader?.global) {
            const globalSettings = settingsResult.data.reader.global

            // Check if override matches global settings
            const matchesGlobal =
              newSettings.readingMode === globalSettings.readingMode &&
              (newSettings.readingMode !== 'double' ||
                (newSettings.doublePageMode?.skipCoverPages ===
                  globalSettings.doublePageMode?.skipCoverPages &&
                  newSettings.doublePageMode?.readRightToLeft ===
                    globalSettings.doublePageMode?.readRightToLeft))

            if (matchesGlobal) {
              // Settings match global, reset override instead of saving
              await globalThis.reader.resetMangaReaderSettings(mangaId)
              return
            }
          }
        } catch (error) {
          console.error('Failed to load global settings for comparison:', error)
        }

        // Save override to backend (only if different from global)
        globalThis.reader.updateMangaReaderSettings(mangaId, newSettings).catch((error) => {
          console.error('Failed to save reader settings:', error)
        })
      })()
    },
    [mangaId]
  )

  return {
    readingMode,
    doublePageSettings,
    showSettingsModal,
    settingsLoaded,
    toggleSettingsModal,
    handleSettingsChange
  }
}
