/**
 * THROWAWAY (perf/baseline-probes branch, never merged).
 * Wraps the repository singletons so every call's duration is recorded.
 */
import { chapterDownloadsRepo } from '../database/repositories/chapter-downloads.repo'
import { chapterRepo } from '../database/repositories/chapter.repo'
import { collectionRepo } from '../database/repositories/collection.repo'
import { historyRepo } from '../database/repositories/history.repo'
import { progressRepo } from '../database/repositories/manga-progress.repo'
import { mangaRepo } from '../database/repositories/manga.repo'
import { readerSettingsRepo } from '../database/repositories/reader-settings.repo'
import { readingRepo } from '../database/repositories/reading-stats.repo'
import { searchPresetsRepo } from '../database/repositories/search-presets.repo'
import { diskCacheUtil } from '../api/utils/disk-cache.util'
import { instrumentObjects } from './perf-probe'

export function instrumentRepos(): void {
  instrumentObjects({
    chapterDownloadsRepo,
    chapterRepo,
    collectionRepo,
    historyRepo,
    progressRepo,
    mangaRepo,
    readerSettingsRepo,
    readingRepo,
    searchPresetsRepo,
    diskCacheUtil
  })
}
