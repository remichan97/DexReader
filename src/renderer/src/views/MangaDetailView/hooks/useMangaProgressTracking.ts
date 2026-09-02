import { useEffect, useState } from 'react'
import { useProgressStore } from '@renderer/stores/progressStore'
import { rendererLog } from '@renderer/services/logging.service'
import type { ChapterProgressContract } from '../../../../../preload/window.types'

export interface UseMangaProgressTrackingResult {
  progress: NonNullable<Awaited<ReturnType<Window['progress']['getProgress']>>['data']> | null
  chapterProgress: Map<string, ChapterProgressContract>
}

/**
 * Owns manga/chapter reading-progress tracking for the detail view: loads
 * progress on mount, mirrors the shared progress store's map for this manga,
 * and reloads both when navigating back to this view (e.g. from the reader).
 */
export function useMangaProgressTracking(
  mangaId: string | undefined,
  locationPathname: string
): UseMangaProgressTrackingResult {
  const loadProgress = useProgressStore((state) => state.loadProgress)
  const progressMap = useProgressStore((state) => state.progressMap)

  const [progress, setProgress] = useState<UseMangaProgressTrackingResult['progress']>(null)
  const [chapterProgress, setChapterProgress] = useState<Map<string, ChapterProgressContract>>(
    new Map()
  )

  async function loadChapterProgress(id: string): Promise<void> {
    try {
      const response = await globalThis.progress.getAllChapterProgress(id)
      if (response.success && response.data) {
        // Convert array to map for easy lookup
        setChapterProgress(new Map(response.data.map((p) => [p.chapterId, p])))
      }
    } catch (error) {
      rendererLog.error('[useMangaProgressTracking] Failed to load chapter progress:', error)
    }
  }

  // Load progress and chapter progress for this manga on mount / manga change
  useEffect(() => {
    if (mangaId) {
      loadProgress(mangaId)
      void loadChapterProgress(mangaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId])

  // Mirror the shared progress store's entry for this manga
  useEffect(() => {
    if (mangaId) {
      setProgress(progressMap.get(mangaId) || null)
    }
  }, [mangaId, progressMap])

  // Refresh progress when navigating back to this view (e.g. from the reader)
  useEffect(() => {
    if (mangaId && locationPathname === `/browse/${mangaId}`) {
      void loadProgress(mangaId)
      void loadChapterProgress(mangaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPathname])

  return { progress, chapterProgress }
}
