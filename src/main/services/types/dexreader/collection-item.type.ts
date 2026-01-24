export interface DexReaderCollectionItem {
  collectionId: number // Collection ID
  mangaId: string // Manga UUID
  addedAt: number // Unix timestamp (milliseconds)
  position: number // Position in collection (for sorting)
}
