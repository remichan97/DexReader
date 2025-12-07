/**
 * Available sorting options for chapter feeds
 * Used in the 'order' parameter for feed endpoints
 */
export enum ChapterOrderOptions {
  VOLUME = 'volume',
  CHAPTER = 'chapter',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PUBLISHED_AT = 'publishedAt',
  READABLE_AT = 'readableAt'
}
