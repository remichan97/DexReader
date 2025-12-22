import { useState, useEffect, useCallback } from 'react'
import type { ReadingMode } from '@renderer/components/ReadingModeSelector'
import type { ReaderSettings } from '../../../../../preload/index.d'

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
  handleSettingsChange: (settings: ReaderSettings) => void
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
    (newSettings: ReaderSettings): void => {
      if (!mangaId) return

      const newDoublePageSettings = {
        skipCoverPages: newSettings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: newSettings.doublePageMode?.readRightToLeft ?? true
      }

      // Update state immediately
      setReadingMode(newSettings.readingMode)
      setDoublePageSettings(newDoublePageSettings)

      // Save to backend
      globalThis.reader.updateMangaReaderSettings(mangaId, newSettings).catch((error) => {
        console.error('Failed to save reader settings:', error)
      })
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
