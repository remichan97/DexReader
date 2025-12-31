import { relations } from 'drizzle-orm'
import { collections } from './collections.schema'
import { collectionItems } from './collection-items.schema'
import { mangaProgress } from './manga-progress.schema'
import { manga } from './manga.schema'
import { chapter } from './chapter.schema'
import { chapterProgress } from './chapter-progress.schema'
import { mangaReaderOverrides } from './manga-reader-overrides.schema'
import { readHistory } from './read-history.schema'

// Collection Relations
export const collectionRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems)
}))

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id]
  }),
  manga: one(manga, {
    fields: [collectionItems.mangaId],
    references: [manga.mangaId]
  })
}))

// Manga Relations
export const mangaRelations = relations(manga, ({ many, one }) => ({
  chapters: many(chapter),
  progress: one(mangaProgress, {
    fields: [manga.mangaId],
    references: [mangaProgress.mangaId]
  }),
  readerOverride: one(mangaReaderOverrides, {
    fields: [manga.mangaId],
    references: [mangaReaderOverrides.mangaId]
  }),
  readHistory: many(readHistory)
}))

// Read History Relations
export const readHistoryRelations = relations(readHistory, ({ one }) => ({
  manga: one(manga, {
    fields: [readHistory.mangaId],
    references: [manga.mangaId]
  })
}))

// Manga Progress Relations
export const mangaProgressRelations = relations(mangaProgress, ({ one }) => ({
  manga: one(manga, {
    fields: [mangaProgress.mangaId],
    references: [manga.mangaId]
  }),
  lastChapter: one(chapter, {
    fields: [mangaProgress.lastChapterId],
    references: [chapter.chapterId]
  })
}))

export const chapterProgressRelations = relations(chapterProgress, ({ one }) => ({
  manga: one(mangaProgress, {
    fields: [chapterProgress.mangaId],
    references: [mangaProgress.mangaId]
  }),
  chapter: one(chapter, {
    fields: [chapterProgress.chapterId],
    references: [chapter.chapterId]
  })
}))

// Chapter Relations
export const chapterRelations = relations(chapter, ({ one }) => ({
  manga: one(manga, {
    fields: [chapter.mangaId],
    references: [manga.mangaId]
  })
}))
