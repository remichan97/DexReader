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

      try {
        // First, query for metadata changes
        const newMetadata = await this.client.getManga(mangaId, DEFAULT_MANGA_INCLUDES)

        // If no changes (indicated by same updateAt), skip
        if (newMetadata.data.attributes.updatedAt === cachedMangaData.updatedAt.toISOString()) {
          continue
        }

        // Build the update command based on changes
        const updateCommand = this.buildUpdateCommand(cachedMangaData, newMetadata.data)

        // If no changes, proceed to next one on the list
        if (!updateCommand) continue

        // Then, fetch the latest chapter to see if there's a new one
        const latestChapter = await this.fetchLatestChapter(mangaId)
        const hasNewChapter =
          latestChapter &&
          this.isNewerChapter(
            latestChapter,
            cachedMangaData.lastKnownChapterId,
            cachedMangaData.lastKnownChapterNumber
          )

        // Push the chapter check result
        updates.push({
          hasNewChapters: hasNewChapter ?? false,
          data: updateCommand
        })

        // Add to the final result set only if there's a new chapter
        if (hasNewChapter) {
          result.push({
            mangaId,
            hasNewChapters: true,
            latestChapter: {
              chapterId: latestChapter.id,
              number: latestChapter.attributes.chapter ?? undefined,
              title: latestChapter.attributes.title ?? undefined
            }
          })
        }
      } catch (error) {
        console.error(`Error checking updates for manga ID ${mangaId}:`, error)
        // Log the error but continue with other manga
        result.push({
          mangaId,
          hasNewChapters: false,
          error: (error as Error).message
        })
        continue
      }
    }
    // Finally, commit any metadata updates if needed
    const commands = updates.map((i) => i.data)
    mangaRepository.batchUpsertManga(commands)
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
    const normalized = this.normalizeApiMangaData(apiData, cached)

    // Use reusable comparison utility
    const changes = getChangedFields(cached, normalized, [
      'title',
      'description',
      'status',
      'tags',
      'lastChapter',
      'lastVolume',
      'updatedAt',
      'year',
      'coverUrl'
    ])

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

  private normalizeApiMangaData(apiData: Manga, cached: MangaWithMetadata): MangaWithMetadata {
    const coverRelationship = apiData.relationships.find((rel) => rel.type === 'cover_art')
    const coverFileName =
      coverRelationship &&
      'attributes' in coverRelationship &&
      coverRelationship.attributes &&
      typeof coverRelationship.attributes.fileName === 'string'
        ? coverRelationship.attributes.fileName
        : undefined

    const newCoverUrl = coverFileName
      ? `https://uploads.mangadex.org/covers/${apiData.id}/${coverFileName}`
      : undefined

    return {
      mangaId: apiData.id,
      title: apiData.attributes.title.en || Object.values(apiData.attributes.title)[0] || '',
      description: apiData.attributes.description?.en,
      status: apiData.attributes.status,
      tags: apiData.attributes.tags.map((tag) => tag.id),
      lastChapter: apiData.attributes.lastChapter ?? undefined, // Adding here for completeness, but likely unchanged, since this is the officially known last chapter
      lastVolume: apiData.attributes.lastVolume ?? undefined, // Adding here for completeness, but likely unchanged, since this is the officially known last volume
      updatedAt: new Date(apiData.attributes.updatedAt),
      coverUrl: newCoverUrl,
      lastCheckForUpdate: new Date(),
      year: apiData.attributes.year ?? undefined, // Adding here for completeness, but likely unchanged
      externalLinks: apiData.attributes.links,

      // Copy other fields as it is
      authors: cached.authors,
      artists: cached.artists,
      lastKnownChapterId: cached.lastKnownChapterId,
      lastKnownChapterNumber: cached.lastKnownChapterNumber,
      hasNewChapters: cached.hasNewChapters ?? false
    }
  }
}
export const libraryUpdate = new UpdateCheckerService()
