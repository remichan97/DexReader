/**
 * Relationship types for reference expansion
 * Used to specify related entities (author, artist, cover_art, etc.)
 */
export enum RelationshipType {
  AUTHOR = 'author',
  ARTIST = 'artist',
  COVER_ART = 'cover_art',
  MANGA = 'manga',
  SCANLATION_GROUP = 'scanlation_group',
  USER = 'user',
  CHAPTER = 'chapter',
  TAG = 'tag',
  CUSTOM_LIST = 'custom_list'
}
