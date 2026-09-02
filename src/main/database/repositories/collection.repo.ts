import { and, eq, sql } from 'drizzle-orm'
import { databaseConnection } from '../connection'

import { collectionItems, collections, manga } from '../schemas'
import { CollectionMapper } from '../mappers/collection.mapper'
import { DbExecutor, executeBatchOperations } from '../utils/batch-operations.util'
import { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
import { UpdateCollectionCommand } from '@shared/commands/repositories/collections/update-collection.command'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '@shared/commands/repositories/collections/remove-from-collection.command'
import { CollectionContract } from '@shared/contracts/database/collections/collection.contract'
import { CollectionMetadataContract } from '@shared/contracts/database/collections/collection-metadata.contract'
import { CollectionItemContract } from '@shared/contracts/database/collections/collection-item.contract'

class CollectionRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getAllCollections(): CollectionContract[] {
    const query = this.db.select().from(collections).all()
    return query.map(CollectionMapper.toCollectionQuery)
  }

  getCollectionById(collectionId: number): CollectionContract | undefined {
    const result = this.db.select().from(collections).where(eq(collections.id, collectionId)).get()
    return result ? CollectionMapper.toCollectionQuery(result) : undefined
  }

  // Rich query with metadata (manga counts, cover urls)
  getAllCollectionsWithMetadata(): CollectionMetadataContract[] {
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

  getAllCollectionItems(): CollectionItemContract[] {
    const results = this.db.select().from(collectionItems).all()
    return results.map(CollectionMapper.toCollectionItemQuery)
  }

  createCollection(command: CreateCollectionCommand, executor: DbExecutor = this.db): number {
    const now = new Date()

    const result = executor
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

  batchCreateCollections(
    command: CreateCollectionCommand[],
    executor: DbExecutor = this.db
  ): number[] {
    const now = new Date()

    return executeBatchOperations({
      commands: command,
      db: executor,
      collectResults: true, // Need to collect the generated collection IDs
      singleOperation: (cmd) => this.createCollection(cmd, executor),
      batchOperation: (tx, cmd) => {
        const result = tx
          .insert(collections)
          .values({
            name: cmd.name,
            description: cmd.description,
            createdAt: now,
            updatedAt: now
          })
          .returning({ id: collections.id })
          .get()
        return result.id
      }
    })
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

  batchAddToCollection(command: AddToCollectionCommand[], executor: DbExecutor = this.db): void {
    const now = new Date()

    executeBatchOperations({
      commands: command,
      db: executor,
      singleOperation: (cmd) => {
        this.addToCollection(cmd, executor)
      },
      batchOperation: (tx, cmd) => {
        tx.insert(collectionItems)
          .values({
            collectionId: cmd.collectionId,
            mangaId: cmd.mangaId,
            addedAt: now
          })
          .onConflictDoNothing()
          .run()
      }
    })
  }

  addToCollection(command: AddToCollectionCommand, executor: DbExecutor = this.db): boolean {
    const now = new Date()

    const result = executor
      .insert(collectionItems)
      .values({
        collectionId: command.collectionId,
        mangaId: command.mangaId,
        addedAt: now
      })
      .onConflictDoNothing()
      .run()

    return result.changes > 0
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

  getCollectionByManga(mangaId: string): CollectionContract[] {
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
}
export const collectionRepo = new CollectionRepository()
