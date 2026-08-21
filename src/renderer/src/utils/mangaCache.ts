/**
 * Manga caching utilities
 *
 * Handles opportunistic caching of manga metadata to the local database.
 */

import type { MangaContract } from '../../../preload/window.types'

/**
 * Cache manga metadata to the local database
 *
 * @param manga - Manga DTO fetched from MangaDex
 * @returns Promise that resolves when caching is complete
 */
export async function cacheMangaMetadata(manga: MangaContract): Promise<void> {
  await globalThis.library.upsertManga({
    mangaId: manga.id,
    title: manga.title.en || Object.values(manga.title)[0] || '',
    description: manga.description?.en,
    coverUrl: manga.coverUrl || '',
    status: manga.status,
    authors: manga.authors.map((author) => author.name),
    artists: manga.artists.map((artist) => artist.name),
    year: manga.year,
    tags: manga.tags.map((tag) => tag.id),
    externalLinks: manga.links,
    lastVolume: manga.lastVolume,
    lastChapter: manga.lastChapter
  })
}
