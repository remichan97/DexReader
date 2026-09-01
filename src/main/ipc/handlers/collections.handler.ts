import { collectionRepo } from '../../database/repositories/collection.repo'
import { wrapIpcHandler } from '../wrap-handler'
import {
  isCreateCollectionCommand,
  isUpdateCollectionCommand,
  isAddToCollectionCommand,
  isRemoveFromCollectionCommand,
  isReorderMangaInCollectionCommand
} from '../../settings/validators/types.validator'

export function registerCollectionsHandlers(): void {
  /**
   * Get all collections.
   *
   * Retrieves all user-created manga collections (custom reading lists). Returns
   * collection metadata (name, description, manga count). Used in Collections sidebar.
   *
   * @returns Promise<Array<Collection>> - All collections
   *
   * @example
   * // Show collections list
   * const collections = await window.api.getAllCollections()
   * collections.forEach(c => console.log(`${c.name}: ${c.mangaCount} manga`))
   */
  wrapIpcHandler('collections:get-all', async () => {
    return collectionRepo.getAllCollections()
  })

  /**
   * Get manga in a specific collection.
   *
   * Retrieves manga belonging to a collection with custom sort order. Used in
   * CollectionView to display collection contents.
   *
   * @param collectionId - Collection database ID (auto-increment, not UUID)
   * @returns Promise<Array<Manga>> - Manga in collection (sorted by custom order)
   *
   * @example
   * // Show collection contents
   * const manga = await window.api.getCollectionManga(5)
   */
  wrapIpcHandler('collections:get-manga', async (_, collectionId: unknown) => {
    if (typeof collectionId !== 'number') {
      throw new TypeError('Invalid collectionId for getting collection manga')
    }

    return collectionRepo.getMangaInCollection(collectionId)
  })

  /**
   * Get collections that contain a specific manga.
   *
   * Returns list of collections a manga belongs to. Used to show collection badges
   * in MangaDetails and allow quick add/remove.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Array<Collection>> - Collections containing this manga
   *
   * @example
   * // Show which collections manga belongs to
   * const collections = await window.api.getCollectionsByManga('xyz789...')
   * console.log(`In ${collections.length} collections`)
   */
  wrapIpcHandler('collections:get-by-manga', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for getting collections by manga')
    }

    return collectionRepo.getCollectionByManga(mangaId)
  })

  /**
   * Create a new collection.
   *
   * Creates empty manga collection with name and optional description.
   * Returns collection ID for subsequent operations.
   *
   * @param command - Collection metadata
   * @param command.name - Collection name (required)
   * @param command.description - Optional description
   * @returns Promise<{id: number}> - New collection ID
   *
   * @example
   * // Create collection
   * const result = await window.api.createCollection({
   *   name: 'Favorites',
   *   description: 'My top picks'
   * })
   * console.log(`Created collection ${result.id}`)
   */
  wrapIpcHandler('collections:create', async (_, command: unknown) => {
    if (!isCreateCollectionCommand(command)) {
      throw new TypeError('Invalid parameters for creating collection')
    }

    return collectionRepo.createCollection(command)
  })

  /**
   * Update collection metadata.
   *
   * Updates collection name and/or description. Does not affect manga membership.
   *
   * @param command - Update data
   * @param command.id - Collection ID
   * @param command.name - New name (optional)
   * @param command.description - New description (optional)
   * @returns Promise<void>
   *
   * @example
   * // Rename collection
   * await window.api.updateCollection({
   *   id: 5,
   *   name: 'Top Picks',
   *   description: 'Updated description'
   * })
   */
  wrapIpcHandler('collections:update', async (_, command: unknown) => {
    if (!isUpdateCollectionCommand(command)) {
      throw new TypeError('Invalid parameters for updating collection')
    }

    return collectionRepo.updateCollection(command)
  })

  /**
   * Delete a collection.
   *
   * Permanently removes collection and all manga associations. Manga themselves
   * are NOT deleted (remain in library). Cannot be undone.
   *
   * @param collectionId - Collection database ID
   * @returns Promise<void>
   *
   * @example
   * // Delete collection
   * await window.api.deleteCollection(5)
   */
  wrapIpcHandler('collections:delete', async (_, collectionId: unknown) => {
    if (typeof collectionId !== 'number') {
      throw new TypeError('Invalid collectionId for deleting collection')
    }

    return collectionRepo.deleteCollection(collectionId)
  })

  /**
   * Add manga to a collection.
   *
   * Adds one or more manga to collection. Manga are appended to end of custom sort order.
   * Silently ignores duplicates.
   *
   * @param command - Add operation data
   * @param command.collectionId - Collection ID
   * @param command.mangaIds - Array of manga UUIDs to add
   * @returns Promise<void>
   *
   * @example
   * // Add manga to collection
   * await window.api.addMangaToCollection({
   *   collectionId: 5,
   *   mangaIds: ['xyz789...', 'abc123...']
   * })
   */
  wrapIpcHandler('collections:add-manga', async (_, command: unknown) => {
    if (!isAddToCollectionCommand(command)) {
      throw new TypeError('Invalid parameters for adding manga to collection')
    }

    return collectionRepo.addToCollection(command)
  })

  /**
   * Remove manga from collection(s).
   *
   * Removes manga from one or more collections. Accepts array of remove commands
   * for batch operations (e.g., remove manga from multiple collections).
   *
   * @param command - Array of remove operations
   * @param command[].collectionId - Collection ID
   * @param command[].mangaId - Manga UUID to remove
   * @returns Promise<void>
   *
   * @example
   * // Remove manga from collection
   * await window.api.removeMangaFromCollection([
   *   {collectionId: 5, mangaId: 'xyz789...'}
   * ])
   */
  wrapIpcHandler('collections:remove-manga', async (_, command: unknown) => {
    if (!Array.isArray(command) || !command.every(isRemoveFromCollectionCommand)) {
      throw new TypeError('Invalid parameters for removing manga from collection')
    }

    return collectionRepo.removeFromCollection(command)
  })

  /**
   * Reorder manga within a collection.
   *
   * Updates custom sort order for manga in collection. Used for drag-and-drop reordering.
   *
   * @param command - Reorder operation
   * @param command.collectionId - Collection ID
   * @param command.mangaIds - Array of manga UUIDs in new order
   * @returns Promise<void>
   *
   * @example
   * // Reorder manga (drag-and-drop)
   * await window.api.reorderCollectionManga({
   *   collectionId: 5,
   *   mangaIds: ['id3...', 'id1...', 'id2...'] // New order
   * })
   */
  wrapIpcHandler('collections:reorder', async (_, command: unknown) => {
    if (!isReorderMangaInCollectionCommand(command)) {
      throw new TypeError('Invalid parameters for reordering collection manga')
    }

    return collectionRepo.reorderMangaInCollection(command)
  })
}
