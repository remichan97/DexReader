import { MangaDexClient } from '../api/mangadexClient'
import { UpdateResult } from './results/update.result'
import { Chapter } from '../api/entities/chapter.entity'
import { ChapterOrderOptions, OrderDirection } from '../api/enums'
import { mangaRepository } from '../database/repository/manga.repo'
import { MangaWithMetadata } from '../database/queries/manga/manga-with-metadata.query'
import { DEFAULT_MANGA_INCLUDES } from '../api/constants/default-manga-includes.constant'
import { MangaUpdateData } from './data/manga-updates.data'
import { getChangedFields } from '../utils/diffs.util'
import { Manga } from '../api/entities/manga.entity'
import { UpsertMangaCommand } from '../database/commands/collections/upsert-manga.command'

export class UpdateCheckerService {
  private readonly client: MangaDexClient = new MangaDexClient()
  private readonly oneHourAgo = Date.now() - 60 * 60 * 1000
  async checkForUpdates(mangaIds: string[]): Promise<UpdateResult[]> {
    const result: UpdateResult[] = []
    const updates: Array<MangaUpdateData> = []

    for (const mangaId of mangaIds) {
      // If no cached data, skip
      const cachedMangaData = this.queryCachedMangaData(mangaId)
      if (!cachedMangaData) {
        continue
      }
      // Skip if checked within the last hour
      if (
        cachedMangaData.lastCheckForUpdate &&
        cachedMangaData.lastCheckForUpdate.getTime() > this.oneHourAgo
      ) {
        continue
      }

      // First, query for metadata changes
      const newMetadata = await this.client.getManga(mangaId, DEFAULT_MANGA_INCLUDES)

      // If the updatedAt is the same, skip
      if (newMetadata.data.attributes.updatedAt === cachedMangaData.updatedAt.toISOString()) {
        continue
      }

      // Build update command for metadata changes
      const mangaUpdateCommand = this.buildUpdateCommand(cachedMangaData, newMetadata.data)

      if (mangaUpdateCommand) {
        updates.push({
          hasNewChapters: false,
          data: mangaUpdateCommand
        })
      }

      // Then, fetch the latest chapter
      const latestChapter = await this.fetchLatestChapter(mangaId)
      if (!latestChapter) {
        continue
      }

      if (
        this.isNewerChapter(
          latestChapter,
          cachedMangaData.lastKnownChapterId,
          cachedMangaData.lastKnownChapterNumber
        )
      ) {
        // Build update command
        const updateCommand = this.buildUpdateCommand(cachedMangaData, newMetadata.data)
        if (updateCommand) {
          updates.push({
            hasNewChapters: true,
            data: {
              ...updateCommand
            }
          })
        }

        // Add to result
        result.push({
          mangaId: mangaId,
          hasNewChapters: true,
          latestChapter: {
            chapterId: latestChapter.id,
            number: latestChapter.attributes.chapter ?? undefined,
            title: latestChapter.attributes.title ?? undefined
          }
        })
      }

      // Finally, commit any metadata updates if needed
      if (updates.length > 0) {
        for (const update of updates) {
          mangaRepository.upsertManga(update.data)
        }
        updates.length = 0
      }
    }
    return result
  }

  private async fetchLatestChapter(mangaId: string): Promise<Chapter | undefined> {
    const feedResponse = await this.client.getMangaFeed(mangaId, {
      order: { [ChapterOrderOptions.CHAPTER]: OrderDirection.Desc },
      limit: 1
    })
    if (feedResponse.data.length === 0) {
      return undefined
    }
    return feedResponse.data[0]
  }

  private queryCachedMangaData(mangaId: string): MangaWithMetadata | undefined {
    return mangaRepository.getMangaById(mangaId)
  }

  private buildUpdateCommand(
    cached: MangaWithMetadata,
    apiData: Manga
  ): UpsertMangaCommand | undefined {
    // Check updatedAt timestamp first - skip if no changes
    const apiUpdatedAt = new Date(apiData.attributes.updatedAt)
    if (cached.updatedAt.getTime() === apiUpdatedAt.getTime()) {
      return undefined
    }

    // Normalize API data to comparable structure
    const normalized = {
      mangaId: apiData.id,
      title: apiData.attributes.title.en || Object.values(apiData.attributes.title)[0] || '',
      description: apiData.attributes.description?.en,
      status: apiData.attributes.status,
      tags: apiData.attributes.tags.map((tag) => tag.id),
      lastChapter: apiData.attributes.lastChapter,
      lastVolume: apiData.attributes.lastVolume,
      updatedAt: apiUpdatedAt
    }

    // Use reusable comparison utility
    const changes = getChangedFields(
      cached as Record<string, unknown>,
      normalized as Record<string, unknown>,
      ['title', 'description', 'status', 'tags', 'lastChapter', 'lastVolume', 'updatedAt']
    )

    if (!changes) {
      return undefined
    }

    return {
      mangaId: cached.mangaId,
      ...changes
    } as UpsertMangaCommand
  }

  private isNewerChapter(
    latestChapter: Chapter,
    knownChapterId?: string,
    knownChapterNumber?: string
  ): boolean {
    if (knownChapterId && knownChapterId === latestChapter.id) {
      return false
    }

    if (knownChapterNumber && latestChapter.attributes.chapter) {
      const knownNumber = Number.parseFloat(knownChapterNumber)
      const latestNumber = Number.parseFloat(latestChapter.attributes.chapter)
      if (!Number.isNaN(knownNumber) && !Number.isNaN(latestNumber)) {
        return latestNumber > knownNumber
      }
    }

    return true
  }
}
export const libraryUpdate = new UpdateCheckerService()
