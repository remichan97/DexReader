import { useCollectionsStore, useLibraryStore, useProgressStore } from '@renderer/stores'
import { useHistoryStore } from '@renderer/stores/historyStore'

/**
 * Bring every store that mirrors imported data back in line with the database.
 *
 * An import now runs from any view, so whichever view is mounted may be showing data the
 * import just changed: the library and collections, per-manga progress (cached, so it has to
 * be re-read explicitly) and the History feed. Pending progress saves are flushed first so a
 * debounced write can't land after, and overwrite, the re-read.
 */
export async function refreshAfterImport(): Promise<void> {
  await useProgressStore.getState().flushPendingSaves()

  await Promise.all([
    useLibraryStore.getState().loadFavourites(),
    useCollectionsStore.getState().loadCollections(),
    useProgressStore.getState().reloadCachedProgress(),
    useProgressStore.getState().loadAllProgress(),
    useHistoryStore.getState().loadRecentEvents()
  ])
}
