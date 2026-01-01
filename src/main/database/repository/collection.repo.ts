import { and, eq, sql } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { CollectionQuery } from '../queries/collections/collection.query'

import { CreateCollectionCommand } from '../commands/collections/create-collection.command'
import { collectionItems, collections, manga } from '../schema'
import { AddToCollectionCommand } from '../commands/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '../commands/collections/remove-from-collection.command'
import { UpdateCollectionCommand } from '../commands/collections/update-collection.command'
import { CollectionMetadataQuery } from '../queries/collections/collection-metadata.query'
import { CollectioinMapper } from '../mappers/collection.mapper'

export class CollectionRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getAllCollections(): CollectionQuery[] {
    return this.db.select().from(collections).all()
  }

  getCollectionById(collectionId: number): CollectionQuery | undefined {
    return this.db.select().from(collections).where(eq(collections.id, collectionId)).get()
  }

  // Rich query with metadata (manga counts, cover urls)
  getAllCollectionsWithMetadata(): CollectionMetadataQuery[] {
    // JOINS with collection_items and manga for counts and cover
    const result = this.db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        mangaCount: sql<number>`COUNT(${collectionItems.mangaId})`,
        coverUrl: sql<string | null>`MAX(${manga.coverUrl})`
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collections.id, collectionItems.collectionId))
      .leftJoin(manga, eq(collectionItems.mangaId, manga.mangaId))
      .groupBy(collections.id)
      .all()

    return result.map(CollectioinMapper.toCollectionWithMetadata)
  }

  getMangaInCollection(collectionId: number): string[] {
    const results = this.db
      .select({ mangaId: collectionItems.mangaId })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId))
      .all()
    return results.map((result) => result.mangaId)
  }

  createCollection(command: CreateCollectionCommand): number {
    const now = new Date()

    const result = this.db
      .insert(collections)
      .values({
        name: command.name,
        description: command.description,
        createdAt: now,
        updatedAt: now
      })
      .returning({ id: collections.id })
      .get()

    return result.id
  }

  updateCollection(command: UpdateCollectionCommand): void {
    const now = new Date()

    this.db
      .update(collections)
      .set({
        name: command.name,
        description: command.description,
        updatedAt: now
      })
      .where(eq(collections.id, command.id))
      .run()
  }

  deleteCollection(collectionId: number): void {
    this.db.delete(collections).where(eq(collections.id, collectionId)).run()
  }

  addToCollection(command: AddToCollectionCommand): void {
    const now = new Date()

    this.db
      .insert(collectionItems)
      .values({
        collectionId: command.collectionId,
        mangaId: command.mangaId,
        addedAt: now
      })
      .run()
  }

  removeFromCollection(command: RemoveFromCollectionCommand): void {
    this.db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, command.collectionId),
          eq(collectionItems.mangaId, command.mangaId)
        )
      )
      .run()
  }
}
export const collectionRepo = new CollectionRepository()
