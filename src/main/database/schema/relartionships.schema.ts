import { relations } from 'drizzle-orm'
import { collections } from './collections.schema'
import { collectionItems } from './collection-items.schema'
import { mangaProgress } from './manga-progress.schema'
import { manga } from './manga.schema'
import { chapter } from './chapter.schema'
import { chapterProgress } from './chapter-progress.schema'

export const collectionRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems)
}))

export const collecitonItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id]
  }),
  manga: one(collections, {
    fields: [collectionItems.mangaId],
    references: [collections.id]
  })
}))

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

export const chapterRelations = relations(chapter, ({ one }) => ({
  manga: one(manga, {
    fields: [chapter.mangaId],
    references: [manga.mangaId]
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
