import { and, eq, sql } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { CollectionQuery } from '../queries/collections/collection.query'

import { CreateCollectionCommand } from '../commands/collections/create-collection.command'
import { collectionItems, collections, manga } from '../schema'
import { AddToCollectionCommand } from '../commands/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '../commands/collections/remove-from-collection.command'
import { UpdateCollectionCommand } from '../commands/collections/update-collection.command'
import { CollectionMetadataQuery } from '../queries/collections/collection-metadata.query'
import { CollectionMapper } from '../mappers/collection.mapper'
import { ReorderMangaInCollectionCommand } from '../commands/collections/reorder-manga-collection.command'
import { CollectionItemQuery } from '../queries/collections/collection-item.query'

export class CollectionRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getAllCollections(): CollectionQuery[] {
    const query = this.db.select().from(collections).all()
    return query.map(CollectionMapper.toCollectionQuery)
  }

  getCollectionById(collectionId: number): CollectionQuery | undefined {
    const result = this.db.select().from(collections).where(eq(collections.id, collectionId)).get()
    return result ? CollectionMapper.toCollectionQuery(result) : undefined
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

    return result.map(CollectionMapper.toCollectionWithMetadata)
  }

  getMangaInCollection(collectionId: number): string[] {
    const results = this.db
      .select({ mangaId: collectionItems.mangaId })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId))
      .all()
    return results.map((result) => result.mangaId)
  }

  getAllCollectionItems(): CollectionItemQuery[] {
    const results = this.db.select().from(collectionItems).all()
    return results.map(CollectionMapper.toCollectionItemQuery)
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

  batchAddToCollection(command: AddToCollectionCommand[]): void {
    const now = new Date()

    if (command.length === 0) {
      return
    }

    if (command.length === 1) {
      this.addToCollection(command[0])
    }

    this.db.transaction((tx) => {
      for (const cmd of command) {
        tx.insert(collectionItems)
          .values({
            collectionId: cmd.collectionId,
            mangaId: cmd.mangaId,
            addedAt: now
          })
          .run()
      }
    })
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

  removeFromCollection(command: RemoveFromCollectionCommand[]): void {
    this.db.transaction((tx) => {
      command.forEach((cmd) => {
        tx.delete(collectionItems)
          .where(
            and(
              eq(collectionItems.collectionId, cmd.collectionId),
              eq(collectionItems.mangaId, cmd.mangaId)
            )
          )
          .run()
      })
    })
  }

  getCollectionByManga(mangaId: string): CollectionQuery[] {
    const results = this.db
      .select()
      .from(collectionItems)
      .innerJoin(
        collections,
        and(eq(collections.id, collectionItems.collectionId), eq(collectionItems.mangaId, mangaId))
      )
      .all()

    return results.map(CollectionMapper.toCollectionQuery)
  }

  reorderMangaInCollection(command: ReorderMangaInCollectionCommand): void {
    this.db.transaction((tx) => {
      command.mangaIds.forEach((mangaId, index) => {
        tx.update(collectionItems)
          .set({ position: index })
          .where(
            and(
              eq(collectionItems.collectionId, command.collectionId),
              eq(collectionItems.mangaId, mangaId)
            )
          )
          .run()
      })
    })
  }
}
export const collectionRepo = new CollectionRepository()
