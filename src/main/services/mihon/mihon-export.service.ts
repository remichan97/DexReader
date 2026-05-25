import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { ChapterWithMetadata } from '../../database/queries/manga/chapter-with-metadata.query'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { mihonExport } from '../helpers/mihon-export.helper'
import { ExportResult } from '../results/mihon/export.result'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { Backup } from '../types/mihon/backup.type'
import protobuf from 'protobufjs'
import Pako from 'pako'

class MihonExportService {
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

    //Grab all Library manga first
    const library = mangaRepo.getLibraryManga()

    if (library.length === 0) {
      throw new Error('No manga in library, nothing to export')
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
      exportedCount: backupMangaList.length
    }
  }
}
export const mihonExportService = new MihonExportService()
