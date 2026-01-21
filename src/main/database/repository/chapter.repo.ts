import { eq } from 'drizzle-orm'
import { SaveChapterCommand } from '../commands/progress/save-chapter.command'
import { databaseConnection } from '../connection'
import { ChapterWithMetadata } from '../queries/manga/chapter-with-metadata.query'
import { chapter } from '../schema/chapter.schema'
import { ChapterMapper } from '../mappers/chapter.mapper'

export class ChapterRepository {
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

  getChapterById(chapterId: string): ChapterWithMetadata {
    const result = this.db
      .select()
      .from(chapter)
      .where(eq(chapter.chapterId, chapterId))
      .limit(1)
      .get()

    if (!result) {
      throw new Error(`Chapter with ID ${chapterId} not found`)
    }

    return ChapterMapper.toChapterMetadata(result)
  }
}

export const chapterRepo = new ChapterRepository()
