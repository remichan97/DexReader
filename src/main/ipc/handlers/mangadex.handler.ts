import { ImageQuality } from '../../api/enums'
import { MangaDexClient } from '../../api/mangadex-client'
import { FeedParams } from '../../api/search-params/feed.searchparam'
import { MangaSearchParams } from '../../api/search-params/manga.searchparam'
import { wrapIpcHandler } from '../wrap-handler'

const mangadexClient = new MangaDexClient()

export function registerMangaDexHandlers(): void {
  wrapIpcHandler('mangadex:search-manga', async (_, query: unknown) => {
    return await mangadexClient.searchManga(query as MangaSearchParams)
  })

  wrapIpcHandler('mangadex:get-manga', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getManga(id as string, includes as string[] | undefined)
  })

  wrapIpcHandler('mangadex:get-manga-feed', async (_, id: unknown, query: unknown) => {
    return await mangadexClient.getMangaFeed(id as string, query as FeedParams)
  })

  wrapIpcHandler('mangadex:get-chapter', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getChapter(id as string, includes as string[] | undefined)
  })

  wrapIpcHandler('mangadex:get-chapter-images', async (_, id: unknown, quality: unknown) => {
    return await mangadexClient.getChapterImages(id as string, quality as ImageQuality)
  })

  wrapIpcHandler('mangadex:healthcheck', async () => {
    return await mangadexClient.isServiceAlive()
  })
}
