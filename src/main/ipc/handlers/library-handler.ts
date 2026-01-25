import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { CreateCollectionCommand } from '../../database/commands/collections/create-collection.command'
import { RemoveFromCollectionCommand } from '../../database/commands/collections/remove-from-collection.command'
import { ReorderMangaInCollectionCommand } from '../../database/commands/collections/reorder-manga-collection.command'
import { UpdateCollectionCommand } from '../../database/commands/collections/update-collection.command'
import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'
import { RecordReadCommand } from '../../database/commands/history/record-read.command'
import { GetLibraryMangaCommand } from '../../database/commands/manga/get-library-manga.command'
import { collectionRepo } from '../../database/repository/collection.repo'
import { mangaRepository } from '../../database/repository/manga.repo'
import { readHistoryRepo } from '../../database/repository/read-history.repo'
import { libraryUpdate } from '../../services/update-checker.services'
import { wrapIpcHandler } from '../wrapHandler'

export function registerLibraryHandlers(): void {
  wrapIpcHandler('library:get-manga', async (_, options: unknown) => {
    return mangaRepository.getLibraryManga(options as GetLibraryMangaCommand)
  })

  wrapIpcHandler('library:toggle-favourite', async (_, mangaId: string) => {
    return mangaRepository.toggleFavourite(mangaId)
  })

  wrapIpcHandler('library:upsert-manga', async (_, command: unknown) => {
    return mangaRepository.upsertManga(command as UpsertMangaCommand)
  })

  wrapIpcHandler('library:check-for-updates', async (_, mangaIds: unknown) => {
    return libraryUpdate.checkForUpdates(mangaIds as string[])
  })

  wrapIpcHandler('library:get-manga-with-updates', async () => {
    return mangaRepository.getLibraryMangaWithNewChapters()
  })

  wrapIpcHandler('collections:get-all', async () => {
    return collectionRepo.getAllCollections()
  })

  wrapIpcHandler('collections:get-manga', async (_, collectionId: unknown) => {
    return collectionRepo.getMangaInCollection(collectionId as number)
  })

  wrapIpcHandler('collections:get-by-manga', async (_, mangaId: unknown) => {
    return collectionRepo.getCollectionByManga(mangaId as string)
  })

  wrapIpcHandler('collections:create', async (_, command: unknown) => {
    return collectionRepo.createCollection(command as CreateCollectionCommand)
  })

  wrapIpcHandler('collections:update', async (_, command: unknown) => {
    return collectionRepo.updateCollection(command as UpdateCollectionCommand)
  })

  wrapIpcHandler('collections:delete', async (_, collectionId: unknown) => {
    return collectionRepo.deleteCollection(collectionId as number)
  })

  wrapIpcHandler('collections:add-manga', async (_, command: unknown) => {
    return collectionRepo.addToCollection(command as AddToCollectionCommand)
  })

  wrapIpcHandler('collections:remove-manga', async (_, command: unknown) => {
    return collectionRepo.removeFromCollection(command as RemoveFromCollectionCommand[])
  })

  wrapIpcHandler('collections:reorder', async (_, command: unknown) => {
    return collectionRepo.reorderMangaInCollection(command as ReorderMangaInCollectionCommand)
  })

  wrapIpcHandler('history:get-all', async () => {
    return readHistoryRepo.getHistory()
  })

  wrapIpcHandler('history:get-recently-read', async (_, limit: unknown) => {
    return readHistoryRepo.getRecentlyRead(limit as number)
  })

  wrapIpcHandler('history:record-read', async (_, command: unknown) => {
    return readHistoryRepo.recordRead(command as RecordReadCommand)
  })

  wrapIpcHandler('history:clear-history', async () => {
    return readHistoryRepo.clearAllHistory()
  })
}
