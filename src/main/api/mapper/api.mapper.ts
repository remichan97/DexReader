import { MangaContract } from '@shared/contracts/mangadex/manga.contract'
import {
  getChapterScanlationGroups,
  getMangaCoverUrl,
  getMangaCreator,
  getMangaTags
} from '../utils/mangadex.util'
import { Manga } from '../entities/manga.entity'
import { ChapterContract } from '@shared/contracts/mangadex/chapter.contract'
import { Chapter } from '../entities/chapter.entity'
import { RelationshipType, CoverSize } from '../enums'

export function mapMangaEntityToContract(manga: Manga): MangaContract {
  return {
    id: manga.id,
    title: manga.attributes.title,
    altTitles: manga.attributes.altTitles,
    description: manga.attributes.description,
    links: manga.attributes.links,
    lastVolume: manga.attributes.lastVolume || undefined,
    lastChapter: manga.attributes.lastChapter || undefined,
    publicationDemographic: manga.attributes.publicationDemographic || undefined,
    status: manga.attributes.status,
    year: manga.attributes.year || undefined,
    contentRating: manga.attributes.contentRating,
    tags: getMangaTags(manga),
    availableTranslatedLanguages: manga.attributes.availableTranslatedLanguages,
    coverUrl: getMangaCoverUrl(manga),
    coverUrlLarge: getMangaCoverUrl(manga, CoverSize.Large),
    authors: getMangaCreator(manga, RelationshipType.AUTHOR),
    artists: getMangaCreator(manga, RelationshipType.ARTIST)
  }
}

export function mapChapterEntityToContract(chapter: Chapter): ChapterContract {
  return {
    id: chapter.id,
    title: chapter.attributes.title,
    volume: chapter.attributes.volume,
    chapter: chapter.attributes.chapter,
    pages: chapter.attributes.pages,
    translatedLanguage: chapter.attributes.translatedLanguage,
    externalUrl: chapter.attributes.externalUrl,
    isUnavailable: chapter.attributes.isUnavailable,
    publishAt: chapter.attributes.publishAt,
    scanlationGroup: getChapterScanlationGroups(chapter)
  }
}
