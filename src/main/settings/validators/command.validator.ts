import { assertNonNullObject } from '@shared/utils/assert-non-null-object.util'
import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'
import { PublicationStatus } from '@shared/enums/mangadex'
import { GetLibraryMangaCommand } from '@shared/commands/repositories/manga/get-library-manga.command'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
import { UpdateCollectionCommand } from '@shared/commands/repositories/collections/update-collection.command'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '@shared/commands/repositories/collections/remove-from-collection.command'
import { RecordReadCommand } from '@shared/commands/repositories/history/record-read.command'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { SaveChapterCommand } from '@shared/commands/repositories/progress/save-chapter.command'

export function isDownloadChapterOptions(values: unknown): values is DownloadChapterCommand {
  assertNonNullObject<DownloadChapterCommand>(values, 'Invalid parameters for downloading chapter')

  if (typeof values.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId')
  }

  if (typeof values.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId')
  }

  if (typeof values.language !== 'string') {
    throw new TypeError('Missing or invalid language')
  }

  if (typeof values.quality !== 'string') {
    throw new TypeError('Missing or invalid quality')
  }

  return true
}

export function isQueuedDownloads(values: unknown): values is QueuedDownloads {
  assertNonNullObject<QueuedDownloads>(values, 'Invalid parameters for queued downloads')

  if (typeof values.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId')
  }

  if (typeof values.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId')
  }

  if (typeof values.language !== 'string') {
    throw new TypeError('Missing or invalid language')
  }

  if (typeof values.quality !== 'string') {
    throw new TypeError('Missing or invalid quality')
  }

  if (!(values.addedAt instanceof Date)) {
    throw new TypeError('Missing or invalid addedAt')
  }

  return true
}

// Validate IPC input for library:get-manga
export function isGetLibraryMangaCommand(values: unknown): values is GetLibraryMangaCommand {
  assertNonNullObject<GetLibraryMangaCommand>(
    values,
    'Invalid parameters for getting library manga'
  )

  const command = values

  if (command.collectionId !== undefined && typeof command.collectionId !== 'number') {
    throw new TypeError('Invalid collectionId for getting library manga')
  }

  if (command.search !== undefined && typeof command.search !== 'string') {
    throw new TypeError('Invalid search for getting library manga')
  }

  if (command.limit !== undefined && typeof command.limit !== 'number') {
    throw new TypeError('Invalid limit for getting library manga')
  }

  if (command.offset !== undefined && typeof command.offset !== 'number') {
    throw new TypeError('Invalid offset for getting library manga')
  }

  if (command.includeDownloaded !== undefined && typeof command.includeDownloaded !== 'boolean') {
    throw new TypeError('Invalid includeDownloaded for getting library manga')
  }

  return true
}

// Validate IPC input for library:upsert-manga
export function isUpsertMangaCommand(values: unknown): values is UpsertMangaCommand {
  assertNonNullObject<UpsertMangaCommand>(values, 'Invalid parameters for upserting manga')

  const command = values

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for upserting manga')
  }

  if (typeof command.title !== 'string') {
    throw new TypeError('Missing or invalid title for upserting manga')
  }

  if (typeof command.coverUrl !== 'string') {
    throw new TypeError('Missing or invalid coverUrl for upserting manga')
  }

  if (!Object.values(PublicationStatus).includes(command.status)) {
    throw new TypeError('Missing or invalid status for upserting manga')
  }

  if (!Array.isArray(command.authors) || command.authors.some((a) => typeof a !== 'string')) {
    throw new TypeError('Missing or invalid authors for upserting manga')
  }

  if (!Array.isArray(command.artists) || command.artists.some((a) => typeof a !== 'string')) {
    throw new TypeError('Missing or invalid artists for upserting manga')
  }

  if (!Array.isArray(command.tags) || command.tags.some((t) => typeof t !== 'string')) {
    throw new TypeError('Missing or invalid tags for upserting manga')
  }

  return true
}

// Validate IPC input for collections:create
export function isCreateCollectionCommand(values: unknown): values is CreateCollectionCommand {
  assertNonNullObject<CreateCollectionCommand>(values, 'Invalid parameters for creating collection')

  const command = values

  if (typeof command.name !== 'string' || command.name.trim().length === 0) {
    throw new TypeError('Missing or invalid name for creating collection')
  }

  if (command.description !== undefined && typeof command.description !== 'string') {
    throw new TypeError('Invalid description for creating collection')
  }

  return true
}

// Validate IPC input for collections:update
export function isUpdateCollectionCommand(values: unknown): values is UpdateCollectionCommand {
  assertNonNullObject<UpdateCollectionCommand>(values, 'Invalid parameters for updating collection')

  const command = values

  if (typeof command.id !== 'number') {
    throw new TypeError('Missing or invalid id for updating collection')
  }

  if (command.name !== undefined && typeof command.name !== 'string') {
    throw new TypeError('Invalid name for updating collection')
  }

  if (command.description !== undefined && typeof command.description !== 'string') {
    throw new TypeError('Invalid description for updating collection')
  }

  return true
}

// Validate IPC input for collections:add-manga
export function isAddToCollectionCommand(values: unknown): values is AddToCollectionCommand {
  assertNonNullObject<AddToCollectionCommand>(
    values,
    'Invalid parameters for adding manga to collection'
  )

  const command = values

  if (typeof command.collectionId !== 'number') {
    throw new TypeError('Missing or invalid collectionId for adding manga to collection')
  }

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for adding manga to collection')
  }

  return true
}

// Validate IPC input for collections:remove-manga (called per-entry against an array)
export function isRemoveFromCollectionCommand(
  values: unknown
): values is RemoveFromCollectionCommand {
  assertNonNullObject<RemoveFromCollectionCommand>(
    values,
    'Invalid parameters for removing manga from collection'
  )

  const command = values

  if (typeof command.collectionId !== 'number') {
    throw new TypeError('Missing or invalid collectionId for removing manga from collection')
  }

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for removing manga from collection')
  }

  return true
}

// Validate IPC input for history:record-read
export function isRecordReadCommand(values: unknown): values is RecordReadCommand {
  assertNonNullObject<RecordReadCommand>(values, 'Invalid parameters for recording read')

  const command = values

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for recording read')
  }

  if (typeof command.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId for recording read')
  }

  return true
}

// Validate IPC input for progress:save-progress (called per-entry against an array)
export function isSaveProgressCommand(values: unknown): values is SaveProgressCommand {
  assertNonNullObject<SaveProgressCommand>(values, 'Invalid parameters for saving progress')

  const command = values

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for saving progress')
  }

  if (typeof command.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId for saving progress')
  }

  if (typeof command.currentPage !== 'number') {
    throw new TypeError('Missing or invalid currentPage for saving progress')
  }

  if (typeof command.completed !== 'boolean') {
    throw new TypeError('Missing or invalid completed for saving progress')
  }

  if (command.lastReadAt !== undefined && typeof command.lastReadAt !== 'number') {
    throw new TypeError('Invalid lastReadAt for saving progress')
  }

  return true
}

// Validate IPC input for progress:save-chapters (called per-entry against an array)
export function isSaveChapterCommand(values: unknown): values is SaveChapterCommand {
  assertNonNullObject<SaveChapterCommand>(values, 'Invalid parameters for saving chapter')

  const command = values

  if (typeof command.chapterId !== 'string') {
    throw new TypeError('Missing or invalid chapterId for saving chapter')
  }

  if (typeof command.mangaId !== 'string') {
    throw new TypeError('Missing or invalid mangaId for saving chapter')
  }

  if (typeof command.language !== 'string') {
    throw new TypeError('Missing or invalid language for saving chapter')
  }

  if (!(command.publishAt instanceof Date)) {
    throw new TypeError('Missing or invalid publishAt for saving chapter')
  }

  return true
}
