import path from 'node:path'
import fs from 'node:fs/promises'
import { DexreaderExportOption } from '../options/dexreader-export.option'
import { DexReaderExportResult } from '../results/dexreader/export.result'
import { LibraryData } from '../types/dexreader/library.type'
import { mangaRepository } from '../../database/repository/manga.repo'
import { dexreaderExport } from '../helpers/dexreader-export.helper'
import { chapterRepo } from '../../database/repository/chapter.repo'
import { DexReaderBackup } from '../types/dexreader/backup.type'
import { CollectionsData } from '../types/dexreader/collections.type'
import { collectionRepo } from '../../database/repository/collection.repo'
import { ProgressData } from '../types/dexreader/progress.type'
import { progressRepo } from '../../database/repository/manga-progress.repo'
import { ReaderSettingsData } from '../types/dexreader/reader-settings.type'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
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
    try {
      const libraryData: LibraryData = this.fetchLibraryData()

      if (libraryData.mangaList.length === 0) {
        return {
          filePath: savePath,
          exportedMangaCount: 0,
          exportedChaptersCount: 0,
          message: 'No manga in Library, nothing to export.'
        }
      }

      const backup: DexReaderBackup = {
        schemaVersion: 1,
        exportedAt: Date.now(),
        appVersion: '1.0.0',
        library: libraryData
      }

      if (options.includeCollections) {
        const collectionsData: CollectionsData = this.fetchCollectionData()
        backup.collections = collectionsData
      }

      if (options.inlcludeProgress) {
        const progressData: ProgressData = this.fetchProgressData()
        backup.progress = progressData
      }

      if (options.includeReaderSettings) {
        const readerSettingsData: ReaderSettingsData = this.fetchReaderSettingsData()
        backup.readerSettings = readerSettingsData
      }

      if (options.includeReaderSettings) {
        const readerSettingsData: ReaderSettingsData = this.fetchReaderSettingsData()
        backup.readerSettings = readerSettingsData
      }

      const root = await protobuf.load(this.schemaPath)
      const BackupType = root.lookupType('DexReaderBackup')
      const message = BackupType.create(backup)
      const buffer = BackupType.encode(message).finish()
      const compressed = Pako.gzip(buffer)

      await fs.writeFile(savePath, compressed)

      return {
        filePath: savePath,
        exportedMangaCount: libraryData.mangaList.length,
        exportedChaptersCount: libraryData.chapterList.length,
        exportedCollectionsCount: backup.collections ? backup.collections.collectionList.length : 0,
        exportedProgressCount: backup.progress
          ? backup.progress.mangaProgress.length + backup.progress.chapterProgress.length
          : 0,
        exportedReaderSettingsCount: backup.readerSettings
          ? backup.readerSettings.overrides.length
          : 0
      }
    } catch (error) {
      console.error('Failed to export DexReader data:', error)
      return {
        filePath: savePath,
        exportedMangaCount: 0,
        exportedChaptersCount: 0,
        message: `Export failed: ${(error as Error).message}`
      }
    }
  }

  private fetchLibraryData(): LibraryData {
    const mangaList = mangaRepository.getLibraryManga()

    const mangaIDs = mangaList.map((it) => it.mangaId)
    const chapterList = mangaIDs.flatMap((mangaId) => {
      return chapterRepo.getChaptersByMangaId(mangaId)
    })
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
    const overrides = mangaRepository.getAllOverrides()
    return {
      overrides: overrides.map((it) => ({
        mangaId: it.mangaId,
        readingMode: it.readerSettings.readingMode,
        settings: it.readerSettings,
        createdAt: dateToUnixTimestamp(it.createdAt),
        updatedAt: dateToUnixTimestamp(it.updatedAt)
      }))
    }
  }
}
export const dexreaderExportService = new DexReaderExportService()
