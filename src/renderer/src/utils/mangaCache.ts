/**
 * Manga caching utilities
 *
 * Handles opportunistic caching of manga metadata to the local database.
 */

type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

/**
 * Cache manga metadata to the local database
 *
 * This function extracts all relevant metadata from a manga entity and
 * stores it in the local database for offline access and library management.
 *
 * @param manga - Manga entity from MangaDex API
 * @returns Promise that resolves when caching is complete
 */
export async function cacheMangaMetadata(manga: MangaEntity): Promise<void> {
  const coverRelationship = manga.relationships.find((rel) => rel.type === 'cover_art')
  const coverFileName =
    coverRelationship &&
    'attributes' in coverRelationship &&
    coverRelationship.attributes &&
    typeof coverRelationship.attributes.fileName === 'string'
      ? coverRelationship.attributes.fileName
      : undefined

  const coverUrl = coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`
    : ''

  const authorRelationships = manga.relationships.filter((rel) => rel.type === 'author')
  const artistRelationships = manga.relationships.filter((rel) => rel.type === 'artist')

  await globalThis.library.upsertManga({
    mangaId: manga.id,
    title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || '',
    description: manga.attributes.description?.en,
    coverUrl,
    status: manga.attributes.status,
    authors: authorRelationships
      .map((rel) => ('attributes' in rel && rel.attributes?.name) || '')
      .filter(Boolean),
    artists: artistRelationships
      .map((rel) => ('attributes' in rel && rel.attributes?.name) || '')
      .filter(Boolean),
    year: manga.attributes.year ?? undefined,
    tags: manga.attributes.tags?.map((tag) => tag.id) || [],
    externalLinks: manga.attributes.links,
    lastVolume: manga.attributes.lastVolume ?? undefined,
    lastChapter: manga.attributes.lastChapter ?? undefined
  })
}
