import path from 'node:path'
import fs from 'node:fs/promises'
import { ChapterWithMetadata } from '../../database/queries/manga/chapter-with-metadata.query'
import { chapterRepo } from '../../database/repository/chapter.repo'
import { collectionRepo } from '../../database/repository/collection.repo'
import { progressRepo } from '../../database/repository/manga-progress.repo'
import { mangaRepository } from '../../database/repository/manga.repo'
import { mihonExport } from '../helpers/mihon-export.helper'
import { ExportResult } from '../results/export.result'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { Backup } from '../types/mihon/backup.type'
import protobuf from 'protobufjs'
import Pako from 'pako'

export class MihonExportService {
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'mihon.proto'
  )

  async exportMihonData(savePath: string): Promise<ExportResult> {
    const categoryMap = new Map<string, number[]>()
    const chapterMetadataMap = new Map<string, ChapterWithMetadata>()
    const backupMangaList: BackupManga[] = []
    let backupCategories: BackupCategory[] = []
    try {
      //Grab all Library manga first
      const library = mangaRepository.getLibraryManga()

      if (library.length === 0) {
        return {
          exportedCount: 0,
          message: 'No manga in Library, nothing to export.'
        }
      }

      // Then current collections, as well as its items
      const collections = collectionRepo.getAllCollections()
      const collectionItems = collectionRepo.getAllCollectionItems()

      for (const item of collectionItems) {
        const existing = categoryMap.get(item.mangaId) || []
        categoryMap.set(item.mangaId, [...existing, item.collectionId])
      }

      // We then build BackupCategory array
      backupCategories = collections.map((col, idx) => {
        return mihonExport.buildBackupCategory(col, idx)
      })

      // Finally, we build BackupManga array

      for (const it of library) {
        const chapterProgressList = progressRepo.getAllChapterProgress(it.mangaId)

        // Grab chapters metadata
        for (const chProgress of chapterProgressList) {
          const metadata = chapterRepo.getChapterById(chProgress.chapterId)
          if (metadata) {
            chapterMetadataMap.set(chProgress.chapterId, metadata)
          }
        }

        // Build BackupChapter array
        const backupChapters = chapterProgressList.map((chProgress) => {
          const metadata = chapterMetadataMap.get(chProgress.chapterId)
          return mihonExport.buildBackupChapter(chProgress, metadata)
        })

        // Build BackupHistory array
        const backupHistory = chapterProgressList.map((chProgress) => {
          return mihonExport.buildBackupHistory(chProgress)
        })

        // Get categories for the manga
        const categories = categoryMap.get(it.mangaId) || []

        // Build BackupManga object
        const backupManga = mihonExport.buildBackupManga(
          it,
          categories,
          backupChapters,
          backupHistory
        )

        backupMangaList.push(backupManga)
      }

      const exportData: Backup = {
        backupManga: backupMangaList,
        backupCategories: backupCategories
      }

      const root = await protobuf.load(this.schemaPath)
      const BackupType = root.lookupType('Backup')
      const message = BackupType.create(exportData)
      const buffer = BackupType.encode(message).finish()

      // Compress with gzip and save to file
      const compressed = Pako.gzip(buffer)

      await fs.writeFile(savePath, compressed)

      return {
        exportedCount: backupMangaList.length,
        message: 'Mihon data exported successfully.'
      }
    } catch (error) {
      console.error('Error exporting Mihon data:', error)
      return {
        exportedCount: 0,
        error: (error as Error).message || 'An unknown error occurred during export.'
      }
    }
  }
}
export const mihonExportService = new MihonExportService()
