import { eq, inArray } from 'drizzle-orm'
import { SaveChapterCommand } from '../commands/progress/save-chapter.command'
import { databaseConnection } from '../connection'
import { ChapterWithMetadata } from '../queries/manga/chapter-with-metadata.query'
import { chapter } from '../schemas/chapter.schema'
import { ChapterMapper } from '../mappers/chapter.mapper'

type ChapterRow = typeof chapter.$inferSelect

class ChapterRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  saveChapters(chapters: SaveChapterCommand[]): void {
    const now = new Date()

    this.db.transaction((tx) => {
      for (const ch of chapters) {
        tx.insert(chapter)
          .values({
            chapterId: ch.chapterId,
            mangaId: ch.mangaId,
            title: ch.title,
            chapterNumber: ch.chapterNumber,
            volume: ch.volume,
            language: ch.language,
            publishAt: ch.publishAt,
            createdAt: now,
            updatedAt: now,
            scanlationGroup: ch.scanlationGroup,
            externalUrl: ch.externalUrl
          })
          .onConflictDoUpdate({
            target: chapter.chapterId,
            set: {
              title: ch.title,
              chapterNumber: ch.chapterNumber,
              volume: ch.volume,
              updatedAt: now
            }
          })
          .run()
      }
    })
  }

  getChaptersByMangaId(mangaId: string): ChapterWithMetadata[] {
    const results = this.db.select().from(chapter).where(eq(chapter.mangaId, mangaId)).all()

    return results.map(ChapterMapper.toChapterMetadata)
  }

  getChapterById(chapterId: string): ChapterWithMetadata | undefined {
    const result = this.db
      .select()
      .from(chapter)
      .where(eq(chapter.chapterId, chapterId))
      .limit(1)
      .get()

    if (!result) {
      return undefined
    }

    return ChapterMapper.toChapterMetadata(result)
  }

  getChaptersByMangaIds(mangaIds: string[]): ChapterRow[] {
    if (mangaIds.length === 0) {
      return []
    }

    const CHUNK_SIZE = 500 // SQLite has a 999-parameter limit for WHERE IN clauses
    const allResults: ChapterRow[] = []

    // Process in chunks to avoid SQLite's parameter limit
    for (let i = 0; i < mangaIds.length; i += CHUNK_SIZE) {
      const chunk = mangaIds.slice(i, i + CHUNK_SIZE)
      const results = this.db.select().from(chapter).where(inArray(chapter.mangaId, chunk)).all()
      allResults.push(...results)
    }

    return allResults
  }
}

export const chapterRepo = new ChapterRepository()
