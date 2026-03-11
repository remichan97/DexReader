import path from 'node:path'
import fs from 'node:fs/promises'
import { DexreaderExportOption } from '../options/dexreader-export.option'
import { DexReaderExportResult } from '../results/dexreader/export.result'
import { LibraryData } from '../types/dexreader/library.type'
import { mangaRepo } from '../../database/repository/manga.repo'
import { dexreaderExport } from '../helpers/dexreader-export.helper'
import { chapterRepo } from '../../database/repository/chapter.repo'
import { DexReaderBackup } from '../types/dexreader/backup.type'
import { CollectionsData } from '../types/dexreader/collections.type'
import { collectionRepo } from '../../database/repository/collection.repo'
import { ProgressData } from '../types/dexreader/progress.type'
import { progressRepo } from '../../database/repository/manga-progress.repo'
import { ReaderSettingsData } from '../types/dexreader/reader-settings.type'
import { readerSettingsRepo } from '../../database/repository/reader-settings.repo'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { version } from '../../../../package.json'
import protobuf from 'protobufjs'
import Pako from 'pako'

export class DexReaderExportService {
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'dexreader.proto'
  )

  async exportLibrary(
    savePath: string,
    options: DexreaderExportOption
  ): Promise<DexReaderExportResult> {
    const libraryData: LibraryData = this.fetchLibraryData(options)

    if (libraryData.mangaList.filter((it) => it.isFavourite === true).length === 0) {
      throw new Error('No manga in library, nothing to export')
    }

    const backup: DexReaderBackup = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      appVersion: version,
      library: libraryData
    }

    if (options.includeCollections) {
      const collectionsData: CollectionsData = this.fetchCollectionData()
      // Only include if there's actual data to prevent protobuf empty object deserialization issues
      if (collectionsData.collectionList.length > 0 || collectionsData.collectionItems.length > 0) {
        backup.collections = collectionsData
      }
    }

    if (options.includeProgress) {
      const progressData: ProgressData = this.fetchProgressData()
      // Only include if there's actual data to prevent protobuf empty object deserialization issues
      if (progressData.mangaProgress.length > 0 || progressData.chapterProgress.length > 0) {
        backup.progress = progressData
      }
    }

    if (options.includeReaderSettings) {
      const readerSettingsData: ReaderSettingsData = this.fetchReaderSettingsData()
      // Only include if there's actual data to prevent protobuf empty object deserialization issues
      if (readerSettingsData.overrides.length > 0) {
        backup.readerSettings = readerSettingsData
      }
    }

    const root = await protobuf.load(this.schemaPath)
    const BackupType = root.lookupType('DexReaderBackup')
    const message = BackupType.create(backup)
    const buffer = BackupType.encode(message).finish()
    const compressed = Pako.gzip(buffer)

    await fs.writeFile(savePath, compressed)

    return {
      filePath: savePath,
      exportedMangaCount: libraryData.mangaList.filter((it) => it.isFavourite === true).length,
      exportedChaptersCount: libraryData.chapterList.length,
      exportedCollectionsCount: backup.collections ? backup.collections.collectionList.length : 0,
      exportedProgressCount: backup.progress
        ? backup.progress.mangaProgress.length + backup.progress.chapterProgress.length
        : 0,
      exportedReaderSettingsCount: backup.readerSettings
        ? backup.readerSettings.overrides.length
        : 0
    }
  }

  private fetchLibraryData(options: DexreaderExportOption): LibraryData {
    // If we need to export collections, progress, or reader settings, we need all manga data
    // to prevent FK violations (these sections can reference non-favourite manga)
    const mangaList =
      options.includeCollections || options.includeProgress || options.includeReaderSettings
        ? mangaRepo.getAllManga()
        : mangaRepo.getLibraryMangaForExport()

    const mangaIDs = mangaList.map((it) => it.mangaId)
    const chapterList = chapterRepo.getChaptersByMangaIds(mangaIDs)
    return {
      mangaList: mangaList.map((it) => dexreaderExport.buildMangaData(it)),
      chapterList: chapterList.map((it) => dexreaderExport.buildChapterData(it))
    }
  }

  private fetchCollectionData(): CollectionsData {
    const collection = collectionRepo.getAllCollections()
    const collectionItems = collectionRepo.getAllCollectionItems()
    return {
      collectionList: collection.map((it) => dexreaderExport.buildCollectionData(it)),
      collectionItems: collectionItems.map((it) => dexreaderExport.buildCollectionItemData(it))
    }
  }

  private fetchProgressData(): ProgressData {
    const mangaProgressList = progressRepo.getAllMangaProgress()
    const chapterProgressList = progressRepo.getAllChapterProgressForAllManga()

    return {
      mangaProgress: mangaProgressList.map((it) => dexreaderExport.buildMangaProgressData(it)),
      chapterProgress: chapterProgressList.map((it) => dexreaderExport.buildChapterProgressData(it))
    }
  }

  private fetchReaderSettingsData(): ReaderSettingsData {
    const overrides = readerSettingsRepo.getAllOverridesWithMetadata()
    return {
      overrides: overrides.map((it) => ({
        mangaId: it.mangaId,
        readingMode: it.readerSettings.readingMode,
        doublePageMode: it.readerSettings.doublePageMode || undefined,
        createdAt: dateToUnixTimestamp(it.createdAt),
        updatedAt: dateToUnixTimestamp(it.updatedAt)
      }))
    }
  }
}
export const dexreaderExportService = new DexReaderExportService()
