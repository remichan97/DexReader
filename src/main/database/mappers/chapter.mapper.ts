import { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
import { chapter } from '../schemas/chapter.schema'

type ChapterRow = typeof chapter.$inferSelect

export class ChapterMapper {
  static toChapterMetadata(data: ChapterRow): ChapterWithMetadataContract {
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
