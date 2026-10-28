# MangaDex API Integration

**Last updated**: October 2026 (v1.16.1)
**Source**: `src/main/api/` (client, rate limiter, image proxies, caches), `src/main/ipc/handlers/mangadex.handler.ts`

---

## Overview

All MangaDex traffic happens in the main process. The renderer never calls `api.mangadex.org` or a CDN directly. It asks main over IPC for data, and loads images through two custom protocols, because MangaDex blocks hotlinking and the renderer's CSP only allows `'self'`, `data:`, `mangadex:` and `local-manga:` images.

```
Renderer ──globalThis.mangadex.*──► IPC handlers ──► MangaDexClient ──► api.mangadex.org
   │                                                     │
   │                                                RateLimiter (token buckets)
   │
   └──<img src="mangadex://…">──► ImageProxy ──► memory/disk cache ──► uploads.mangadex.org / @Home nodes
   └──<img src="local-manga://…">──► LocalImageProxy ──► downloaded files (via the database)
```

| Piece               | File                                                                           | Role                                              |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `MangaDexClient`    | `mangadex-client.ts`                                                           | The API calls, ID validation, 429 retry           |
| `RateLimiter`       | `rate-limiter.ts`                                                              | Global and per-endpoint token buckets             |
| `ImageProxy`        | `proxy/image.proxy.ts`                                                         | `mangadex://` protocol, caching, @Home reports    |
| `LocalImageProxy`   | `proxy/local-image.proxy.ts`                                                   | `local-manga://` protocol for downloaded chapters |
| `AtHomeGuardsUtil`  | `utils/at-home-guards.utl.ts`                                                  | Allow-list of URLs the proxy may fetch            |
| Caches              | `utils/lru-memory-cache.util.ts`, `disk-cache.util.ts`, `memory-cache.util.ts` | Memory LRU, cover disk cache, memory tiers        |
| Entities and mapper | `entities/`, `mapper/api.mapper.ts`, `utils/mangadex.util.ts`                  | API shapes → renderer contracts                   |

---

## Configuration

`constants/api-config.constant.ts`:

| Constant                      | Value                                 | Meaning                                     |
| ----------------------------- | ------------------------------------- | ------------------------------------------- |
| `BASE_API_URL`                | `https://api.mangadex.org`            | API host                                    |
| `BASE_CDN_URL`                | `https://uploads.mangadex.org`        | Cover host                                  |
| `NETWORK_REPORT_URL`          | `https://api.mangadex.network/report` | @Home telemetry endpoint                    |
| `API_TIMEOUT_MS`              | `15000`                               | Per-request timeout (`AbortSignal.timeout`) |
| `GLOBAL_RATE_LIMIT`           | `5`                                   | Requests per second                         |
| `AT_HOME_RATE_LIMIT`          | `40`                                  | `/at-home/server` requests per minute       |
| `MAX_LIMIT`, `MAX_FEED_LIMIT` | `100`, `500`                          | Page size caps                              |
| `MAX_OFFSET_PLUS_LIMIT`       | `10000`                               | MangaDex's pagination ceiling               |

Requests carry a `User-Agent` built by `buildUserAgent()` (app version, platform, Node version and the project URL), as MangaDex requires.

---

## `MangaDexClient`

| Method                           | Endpoint                       | Rate-limit bucket | IPC channel                   | Preload                     |
| -------------------------------- | ------------------------------ | ----------------- | ----------------------------- | --------------------------- |
| `searchManga(params)`            | `GET /manga`                   | global            | `mangadex:search-manga`       | `mangadex.searchManga`      |
| `getManga(id, includes?)`        | `GET /manga/{id}`              | global            | `mangadex:get-manga`          | `mangadex.getManga`         |
| `getMangaFeed(id, params)`       | `GET /manga/{id}/feed`         | global            | `mangadex:get-manga-feed`     | `mangadex.getMangaFeed`     |
| `getChapter(id, includes?)`      | `GET /chapter/{id}`            | global            | `mangadex:get-chapter`        | `mangadex.getChapter`       |
| `getChapterImages(id, quality)`  | `GET /at-home/server/{id}`     | `at-home/server`  | `mangadex:get-chapter-images` | `mangadex.getChapterImages` |
| `isServiceAlive()`               | `GET /ping` (expects `pong`)   | global            | `mangadex:healthcheck`        | `mangadex.isServiceAlive`   |
| `reportAtHomeNetworkStatus(...)` | `POST` to `NETWORK_REPORT_URL` | `network/report`  | none (internal)               | none                        |

Every call waits for a rate-limit token first. Behaviour worth knowing:

- **IDs are checked** against a UUID pattern before a request is built (`getManga`, `getMangaFeed`, `getChapter`, `getChapterImages`), and `getChapterImages` also checks that `quality` is a real `ImageQuality` (`data` or `data-saver`). The search and feed parameter objects are only cast (`as MangaSearchParams`) in the IPC handler, then serialised by `buildQueryParams`, which appends `[]` to array keys and `key[sub]` to nested objects as the API expects. The host and path are fixed, so the renderer can shape the query string but cannot redirect the request.
- **Responses are mapped**: the handlers convert API entities to contracts with `mapMangaEntityToContract` and `mapChapterEntityToContract` (titles, tags, authors and artists from relationships, the scanlation group, and cover URLs). The renderer never sees raw API entities.
- **`getChapterImages` records the node**: the `baseUrl` and chapter `hash` from the response are stored in the at-home allow-list (below), then each file becomes `{ url, filename, quality }` with `url = {baseUrl}/data/{hash}/{filename}` (or `data-saver`).
- **Downloads use the same client** (`download.service.ts`, which also caches chapter image URLs for 5 minutes and has its own retry logic).

### Cover URLs

`getMangaCoverUrl(manga, size)` builds `mangadex://uploads.mangadex.org/covers/{mangaId}/{fileName}.{size}.jpg` from the `cover_art` relationship, with `size` 256 (`CoverSize.Medium`, `coverUrl`) or 512 (`CoverSize.Large`, `coverUrlLarge`). It returns `undefined` when the manga has no cover relationship. The renderer converts chapter image URLs the same way (`url.replace('https://', 'mangadex://')`).

### Errors

| Class                  | Thrown when                                         | Fields                                                                               |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `MangaDexApiError`     | A non-2xx response, or bad input                    | `statusCode`, `requestId` (`X-Request-ID`), parsed `error` body, `retryAfterSeconds` |
| `MangaDexNetworkError` | The request never completed (timeout, DNS, offline) | `url`                                                                                |

These go through `wrapIpcHandler`, and `serializeError` keeps only `name` and `message` for a plain `Error`. So the renderer sees messages like `MangaDex API Error: HTTP 404: Not Found` but not `statusCode` or `requestId`; those are in the main-process log, which records the request ID on 429 handling. Reachability for the UI comes from `connectivityStore`, which polls `mangadex.isServiceAlive()`.

---

## Rate limiting

`RateLimiter` is a set of token buckets: a **global** bucket (capacity 5, refilling 5 per second) that every call draws from, plus a per-endpoint bucket that is checked **in addition** for the endpoints that have their own limit:

| Endpoint key     | Capacity | Refill        |
| ---------------- | -------- | ------------- |
| `at-home/server` | 40       | 40 per minute |
| `network/report` | 20       | 20 per minute |

`waitForToken(endpoint?)` sleeps until both the global bucket and the endpoint bucket have a token, then takes one from each.

**Limits are per client, not per app.** Each `MangaDexClient` owns its own `RateLimiter`, and the app creates three: the IPC handlers (everything the UI asks for), the download service, and the one handed to `ImageProxy` in `index.ts` (used only for @Home reports). The UI and the download queue therefore draw from separate buckets and can together exceed 5 requests per second. The 429 handling above is what absorbs that. A single shared limiter would fix it.

**429 responses**: `fetch()` reads `X-RateLimit-Retry-After`, calls `handleRateLimitResponse()` (which empties every bucket and pushes the refill time out by the retry delay), and retries up to 3 times. The delay is the header value, or `1s × 2^attempt` without one, with ±20% jitter. After the third retry it throws a `MangaDexApiError` carrying `retryAfterSeconds`.

---

## Image proxy (`mangadex://`)

`protocol.handle('mangadex', ...)` rewrites `mangadex://` back to `https://` and serves the image. A URL containing `/covers/` is a cover; everything else is a chapter page.

### Which URLs may be fetched

`AtHomeGuardsUtil.isUrlAllowed(url, hash)` is the allow-list. Without it the protocol would be an open proxy for any host:

- **Covers**: host `uploads.mangadex.org` and a path under `/covers/`.
- **Chapter pages**: the URL's `/data/{hash}/` segment must match a hash recorded by a recent `getChapterImages` call, the URL's origin must equal the `baseUrl` recorded for it, and the record must be younger than 15 minutes (a 60 s sweep removes expired ones).

Anything else gets `403 Access denied`. A network failure returns `502`.

### Caches

| Cache         | Where       | Size                                                                 | Expiry     |
| ------------- | ----------- | -------------------------------------------------------------------- | ---------- |
| Chapter pages | Memory, LRU | By tier (below); only images under 5 MB are cached                   | 15 minutes |
| Covers        | Memory, LRU | 20 MB                                                                | none       |
| Covers        | Disk        | `downloads.maxDiskCacheSize` setting, default 50 MB, `0` = unlimited | none       |

The chapter cache size comes from the reader's performance setting (`memoryCacheUtil`), each tier being a share of system memory capped at a ceiling:

| Tier   | Share of RAM                         | Cap             |
| ------ | ------------------------------------ | --------------- |
| Low    | 1.5%                                 | 75 MB           |
| Normal | 3.5%                                 | 200 MB          |
| High   | 5%                                   | 350 MB          |
| Custom | the user's `customCacheSize` setting | 200 MB if unset |

The proxy fetches `getMemoryLimit()` at startup and again when settings change (`updateChapterCacheSize`). An expiry sweep runs every 5 minutes.

A cover request checks memory, then disk (`~/.dexreader/cache/covers/{mangaId}/{file}`, with ID and file name sanitised to `[A-Za-z0-9._-]`), then the network. On a network hit it writes memory and disk and sets `manga.cover_cached_at` in the database; clearing or evicting covers clears that date again.

> **Known issue**: the disk limit is probably not enforced. Covers are stored in per-manga folders, but `enforceDiskCacheLimit` lists only the top level of the cache, so it measures and tries to delete the folders themselves rather than the files inside them (a folder's size is 0 on Windows, and `unlink` on a folder fails with `EPERM`, which is caught and logged). The unit test hides this by mocking `readDir` with flat paths such as `manga-old/cover.jpg`, which `readDir` never returns. `getDiskCacheSize`, which does recurse, reports the real size.

### MangaDex@Home reports

For chapter pages fetched from an @Home node, the proxy reports the outcome (URL, success, cached or not, duration, bytes) to `api.mangadex.network/report`, as the network asks clients to. Reports run in the background and never delay or fail the image. At most 100 are in flight, extras are dropped, and the endpoint is rate-limited to 20 per minute. Covers are not part of @Home and are never reported.

---

## Local images (`local-manga://`)

Downloaded chapters are served by `LocalImageProxy` from `local-manga://chapter/{chapterId}/page/{pageNumber}`:

1. Look up the chapter in `chapter_downloads` (`404` if there is no record).
2. Build `{downloadsBasePath}/{filePath}/pages/{NNN}{imageFormat}`, using the base path **stored with the download**, not the current setting, so chapters stay readable after the downloads folder is changed. The page number in the URL is 0-based and the file is 1-based and padded to three digits (`001.jpg`).
3. Read it with `secureFs` and return it with a content type from the extension (`image/png`, `image/webp`, otherwise `image/jpeg`). Any other failure returns `500`.

---

## Using the API from the renderer

```typescript
const response = await globalThis.mangadex.searchManga(params)
if (response.success && response.data) {
  // response.data: CollectionResponse<MangaContract>
}
```

- **Browse** (`searchStore`) calls `searchManga`, refuses to search while `connectivityStore.isOnline` is false, and stops paging at the 10,000-result ceiling.
- **Manga Detail** (`useMangaDetailData`) calls `getManga`, then pages the chapter feed through `utils/chapterFeedLoader.ts`: 500 chapters per request (the API's maximum), ordered by `chapter` then `publishAt` in the direction the list is sorted towards, with all four content ratings (the feed leaves out pornographic titles unless asked). The first page is shown at once and the rest loads in the background; each report carries the merged list oldest first (`utils/chapterOrder.ts`), de-duplicated by id. A series almost always fits one or two pages (the longest English feed among the 40 most-followed series was 617 chapters, about a second to load). **API names to get right**: the order key and the date filter are `publishAt` and `publishAtSince`, not `publishedAt…`; the API rejects the latter.
- **Reader** (`useChapterData`) first asks whether the chapter is downloaded and, if so, uses `local-manga://chapter/{id}/page/{n}` URLs. Otherwise it calls `getChapterImages` and maps each URL to `mangadex://`. When opened without a chapter list (from History or Downloads), or with one the manga page was still loading, it loads the whole list itself with the same loader, oldest first (English only when it has to guess the language).
- **Creator view** calls `searchManga` filtered by author or artist.
- **Connectivity** polls `isServiceAlive()`.

Images are always shown with `mangadex://` or `local-manga://` URLs, never plain HTTPS.

---

## Adding an endpoint

1. Add the method to `MangaDexClient`: `await this.rateLimiter.waitForToken(...)` first, validate any IDs, then `this.fetch<T>(...)`. If the API gives the endpoint its own limit, add a bucket in `RateLimiter.endpointConfigs`.
2. Add an entity type in `entities/` and a contract in `src/shared/contracts/mangadex/`, and map one to the other in `mapper/api.mapper.ts`.
3. Add the IPC channel in `mangadex.handler.ts`, the preload method and its `window.types.ts` signature (see [ipc-messaging.md](./ipc-messaging.md)).
4. If it serves images, extend `AtHomeGuardsUtil` deliberately: the allow-list is what keeps the proxy from becoming open.
