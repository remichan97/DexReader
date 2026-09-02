/**
 * Database-to-DTO conversion utilities
 *
 * Builds MangaContract/ChapterContract display DTOs from cached database rows,
 * used while offline or before the live API response arrives. Only fields the
 * DB actually stores are populated - tags, the large cover variant, and page
 * counts aren't cached, so they're left empty/undefined/0 until live data
 * replaces them.
 */

import { ContentRating } from '@shared/enums/mangadex'
import type {
  MangaContract,
  ChapterContract,
  MangaWithMetadataContract,
  ChapterWithMetadataContract
} from '../../../preload/window.types'

export function convertDbMangaToContract(dbManga: MangaWithMetadataContract): MangaContract {
  return {
    id: dbManga.mangaId,
    title: { en: dbManga.title },
    altTitles: [],
    description: dbManga.description ? { en: dbManga.description } : {},
    links: dbManga.externalLinks || {},
    lastVolume: dbManga.lastVolume,
    lastChapter: dbManga.lastChapter,
    publicationDemographic: undefined,
    status: dbManga.status,
    year: dbManga.year,
    contentRating: ContentRating.Safe,
    tags: [],
    availableTranslatedLanguages: [],
    coverUrl: dbManga.coverUrl,
    coverUrlLarge: dbManga.coverUrl,
    authors: dbManga.authors.map((name, index) => ({ id: `cached-author-${index}`, name })),
    artists: dbManga.artists.map((name, index) => ({ id: `cached-artist-${index}`, name }))
  }
}

export function convertDbChaptersToContract(
  dbChapters: ChapterWithMetadataContract[]
): ChapterContract[] {
  return dbChapters.map((ch) => {
    const scanlationGroup: Record<string, string> = ch.scanlatorGroup
      ? { 'cached-group': ch.scanlatorGroup }
      : {}

    return {
      id: ch.chapterId,
      title: ch.title,
      volume: ch.volume,
      chapter: ch.chapterNumber,
      pages: 0,
      translatedLanguage: ch.language,
      externalUrl: ch.externalUrl,
      publishAt: ch.publishedAt.toISOString(),
      isUnavailable: false,
      scanlationGroup
    }
  })
}
