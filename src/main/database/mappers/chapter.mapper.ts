import { ChapterWithMetadata } from '../queries/manga/chapter-with-metadata.query'
import { chapter } from '../schema/chapter.schema'

type ChapterRow = typeof chapter.$inferSelect

export class ChapterMapper {
  static toChapterMetadata(data: ChapterRow): ChapterWithMetadata {
    return {
      chapterId: data.chapterId,
      mangaId: data.mangaId,
      title: data.title ?? undefined,
      chapterNumber: data.chapterNumber ?? undefined,
      volume: data.volume ?? undefined,
      language: data.language,
      publishedAt: data.publishAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      scanlatorGroup: data.scanlationGroup ?? undefined,
      externalUrl: data.externalUrl ?? undefined
    }
  }
}
