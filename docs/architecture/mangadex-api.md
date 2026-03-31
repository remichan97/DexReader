# MangaDex API Integration

**Last Updated**: 12 December 2025
**Status**: ✅ Complete
**Phase**: Phase 2 - Content Display

---

## Overview

DexReader integrates with the MangaDex public API to provide manga browsing, search, and reading functionality. This document covers the complete implementation including the API client, rate limiting, image proxy, and error handling.

### Key Features

- **Public API Access**: No authentication required for all implemented endpoints
- **Smart Rate Limiting**: Global (5 req/s) + endpoint-specific limits (at-home: 40 req/min)
- **Image Proxy**: Custom `mangadex://` protocol with LRU caching
- **Ephemeral Cache**: Memory-only caching for smooth online reading
- **Error Handling**: Comprehensive error handling with automatic retry on 429
- **Type Safety**: Full TypeScript definitions for all API entities and responses

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Renderer Process                      │
│  ┌────────────┐                                              │
│  │   Views    │  window.mangadex.searchManga(params)        │
│  └─────┬──────┘                                              │
│        │                                                      │
│        ↓                                                      │
│  ┌────────────────────────────────────────────────┐         │
│  │         Preload (contextBridge)                │         │
│  │  mangadexApi: { searchManga, getManga, ... }   │         │
│  └────────────────┬───────────────────────────────┘         │
└───────────────────┼─────────────────────────────────────────┘
                    │ IPC (invoke)
┌───────────────────┼─────────────────────────────────────────┐
│                   ↓              Main Process                │
│  ┌────────────────────────────────────────────┐             │
│  │        IPC Handlers (wrapIpcHandler)       │             │
│  │  mangadex:search-manga                     │             │
│  │  mangadex:get-manga                        │             │
│  │  mangadex:get-manga-feed                   │             │
│  │  mangadex:get-chapter                      │             │
│  │  mangadex:get-chapter-images               │             │
│  │  mangadex:get-cover-url                    │             │
│  └───────────────┬────────────────────────────┘             │
│                  │                                            │
│                  ↓                                            │
│  ┌──────────────────────────────────────────────────┐       │
│  │           MangaDexClient                         │       │
│  │  - searchManga()                                 │       │
│  │  - getManga()                                    │       │
│  │  - getMangaFeed()                                │       │
│  │  - getChapter()                                  │       │
│  │  - getChapterImages()                            │       │
│  │  - getCoverImageUrl()                            │       │
│  └───────┬───────────────────────┬──────────────────┘       │
│          │                       │                           │
│          ↓                       ↓                           │
│  ┌──────────────┐       ┌──────────────┐                    │
│  │ RateLimiter  │       │  ImageProxy  │                    │
│  │ Token Bucket │       │  mangadex:// │                    │
│  │ 5 req/s      │       │  LRU Cache   │                    │
│  │ 40/min @home │       │  30MB+20MB   │                    │
│  └──────────────┘       └──────────────┘                    │
│          │                       │                           │
│          ↓                       ↓                           │
│  ┌──────────────────────────────────────────┐               │
│  │       MangaDex API / CDN                 │               │
│  │  https://api.mangadex.org                │               │
│  │  https://uploads.mangadex.org            │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## API Client (MangaDexClient)

### Location

- **File**: `src/main/api/mangadexClient.ts`
- **Class**: `MangaDexClient`

### Configuration

```typescript
// src/main/api/constants/api-config.constant.ts
const ApiConfig = {
  BASE_API_URL: 'https://api.mangadex.org',
  BASE_CDN_URL: 'https://uploads.mangadex.org',
  REQUEST_USER_AGENT: 'DexReader/1.0.0',
  API_TIMEOUT_MS: 15000, // 15 seconds
  IMAGE_TIMEOUT_MS: 30000, // 30 seconds
  GLOBAL_RATE_LIMIT: 5, // 5 requests/second
  AT_HOME_RATE_LIMIT: 40, // 40 requests/minute
  MAX_LIMIT: 100, // Max items per page
  MAX_OFFSET_PLUS_LIMIT: 10000 // Pagination limit
}
```

### Endpoints

#### 1. Search Manga

Search for manga with filters, pagination, and sorting.

```typescript
async searchManga(params: MangaSearchParams): Promise<CollectionResponse<Manga>>
```

**Example:**

```typescript
const results = await window.mangadex.searchManga({
  title: 'One Piece',
  limit: 20,
  offset: 0,
  contentRating: [ContentRating.Safe, ContentRating.Suggestive],
  order: { relevance: OrderDirection.Desc }
})
```

**Parameters:**

- `title?: string` - Search by title
- `limit?: number` - Results per page (max 100)
- `offset?: number` - Pagination offset
- `contentRating?: ContentRating[]` - Filter by content rating
- `publicationDemographic?: Demographic[]` - Filter by demographic
- `status?: PublicationStatus[]` - Filter by publication status
- `includedTags?: string[]` - Include manga with these tags
- `excludedTags?: string[]` - Exclude manga with these tags
- `includedTagsMode?: IncludedTagsMode` - AND or OR for included tags
- `order?: OrderOptions` - Sort order

#### 2. Get Manga by ID

Fetch detailed information about a specific manga.

```typescript
async getManga(mangaId: string, includes?: string[]): Promise<ApiResponse<Manga>>
```

**Example:**

```typescript
const manga = await window.mangadex.getManga('manga-id-here', ['cover_art', 'author', 'artist'])
```

#### 3. Get Manga Feed (Chapter List)

Fetch chapters for a specific manga.

```typescript
async getMangaFeed(mangaId: string, params: FeedParams): Promise<CollectionResponse<Chapter>>
```

**Example:**

```typescript
const chapters = await window.mangadex.getMangaFeed('manga-id-here', {
  limit: 100,
  offset: 0,
  translatedLanguage: ['en'],
  order: { chapter: 'asc' }
})
```

**Parameters:**

- `limit?: number` - Results per page (max 500 for feeds)
- `offset?: number` - Pagination offset
- `translatedLanguage?: string[]` - Filter by language codes
- `order?: ChapterOrderOptions` - Sort order
- `includes?: ChapterIncludes[]` - Related entities to include

#### 4. Get Chapter by ID

Fetch detailed information about a specific chapter.

```typescript
async getChapter(chapterId: string, includes?: string[]): Promise<ApiResponse<Chapter>>
```

**Example:**

```typescript
const chapter = await window.mangadex.getChapter('chapter-id-here', ['scanlation_group', 'manga'])
```

#### 5. Get Chapter Images

Fetch image URLs for reading a chapter.

```typescript
async getChapterImages(chapterId: string, quality: ImageQuality): Promise<ImageUrlResponse[]>
```

**Example:**

```typescript
const images = await window.mangadex.getChapterImages(
  'chapter-id-here',
  ImageQuality.Data // or ImageQuality.DataSaver
)

// Returns array of:
// [
//   { url: 'https://...', filename: 'x1.jpg', quality: 'data' },
//   { url: 'https://...', filename: 'x2.jpg', quality: 'data' },
//   ...
// ]
```

**Important**: Image URLs expire after 15 minutes. Always use the `mangadex://` protocol to access images:

```typescript
// ❌ Don't use URLs directly
<img src={imageUrl} />

// ✅ Convert to proxy protocol
<img src={imageUrl.replace('https://', 'mangadex://')} />
```

#### 6. Get Cover URL

Generate cover image URL (direct CDN access, no rate limit).

```typescript
getCoverImageUrl(mangaId: string, fileName: string, size?: CoverSize): string
```

**Example:**

```typescript
const coverUrl = await window.mangadex.getCoverUrl(
  'manga-id-here',
  'cover-filename.jpg',
  CoverSize.Medium // 512px, default
)

// Use with proxy protocol
<img src={coverUrl.replace('https://', 'mangadex://')} />
```

**Available Sizes:**

- `CoverSize.Original` - Full resolution
- `CoverSize.Large` - 1024px
- `CoverSize.Medium` - 512px (default)
- `CoverSize.Small` - 256px

---

## Rate Limiting

### Implementation

**File**: `src/main/api/rateLimiter.ts`

Uses token bucket algorithm with two layers:

1. **Global Rate Limit**: 5 requests/second (all endpoints)
2. **Endpoint-Specific Limits**: Special limits for certain endpoints

### Endpoint Configuration

```typescript
const ENDPOINT_CONFIGS = {
  'at-home/server': {
    capacity: 40,
    refillRatePerSecond: 0.67 // 40 requests/minute
  }
}
```

### How It Works

1. **Token Refill**: Tokens refill continuously based on elapsed time
2. **Waiting**: If no tokens available, waits in 50ms intervals
3. **Dual Check**: Waits until both global AND endpoint tokens available
4. **Token Consumption**: Consumes 1 global + 1 endpoint token per request

### Rate Limit Response Handling

When a 429 (Too Many Requests) is received:

```typescript
// Automatic retry with delay
if (response.status === 429) {
  const retryAfter = response.headers.get('X-RateLimit-Retry-After')
  const delay = rateLimiter.handleRateLimitResponse(retryAfter)
  await sleep(delay)
  return retry() // Automatic retry
}
```

**Penalties** (from MangaDex):

- First violation: HTTP 429 with Retry-After header
- Repeated violations: HTTP 403 (temporary ban)
- Severe abuse: IP block

### Best Practices

✅ **Do:**

- Let the rate limiter handle delays automatically
- Use the built-in retry mechanism
- Monitor rate limit headers

❌ **Don't:**

- Make parallel requests to the same endpoint
- Bypass the rate limiter
- Ignore 429 responses

---

## Image Proxy

### Why It's Needed

MangaDex blocks direct hotlinking from Electron's renderer process. Accessing image URLs directly returns wrong images or fails. The image proxy solves this by:

1. Fetching images from the main process (allowed by MangaDex)
2. Serving them to the renderer via custom protocol
3. Caching in memory for smooth reading experience

### Custom Protocol

**Protocol**: `mangadex://`
**File**: `src/main/api/imageProxy.ts`

### Architecture

```
Renderer                Main Process               Network
   │                         │                         │
   │ <img src="mangadex://...">                       │
   ├────────────────────────>│                         │
   │                         │                         │
   │                    Check Cache                    │
   │                         │                         │
   │                    Cache Miss?                    │
   │                         ├────────────────────────>│
   │                         │  fetch(https://...)     │
   │                         │<────────────────────────┤
   │                         │                         │
   │                    Store in Cache                 │
   │                    (LRU eviction)                 │
   │                         │                         │
   │<────────────────────────┤                         │
   │    Return image buffer  │                         │
   │                         │                         │
```

### Cache Strategy

**Two Separate Caches:**

1. **Chapter Images Cache**
   - Size: 30 MB
   - TTL: 15 minutes (images expire)
   - Max individual image: 5 MB
   - Eviction: Least Recently Used (LRU)
   - Purpose: Smooth page transitions during reading

2. **Cover Images Cache**
   - Size: 20 MB
   - TTL: Never expires
   - Eviction: Least Recently Used (LRU)
   - Purpose: Fast library/browse view

### Usage

```typescript
// In renderer component
function ChapterViewer({ images }: { images: ImageUrlResponse[] }) {
  return (
    <div>
      {images.map((img, index) => (
        <img
          key={index}
          src={img.url.replace('https://', 'mangadex://')}
          alt={`Page ${index + 1}`}
        />
      ))}
    </div>
  )
}
```

### LRU Cache Implementation

**True LRU**: Tracks `lastAccessed` timestamp on every cache hit

```typescript
interface CacheEntry {
  buffer: Buffer
  timestamp: number // When added
  size: number // Buffer size in bytes
  lastAccessed: number // Last access time (for LRU)
}
```

**Eviction Process:**

1. When cache is full, find entry with oldest `lastAccessed`
2. Remove that entry
3. Repeat until there's space for new image
4. Add new image to cache

### Cache Management

```typescript
// Clear chapter cache (preserves cover cache)
imageProxy.clearChapterCache()

// Get cache statistics
const stats = imageProxy.getCacheStats()
// { chapterCacheSize: 15728640, coverCacheSize: 10485760 }
```

---

## Type Definitions

### Core Entities

**Manga Entity** (`src/main/api/entities/manga.entity.ts`):

```typescript
interface Manga {
  id: string
  type: 'manga'
  attributes: {
    title: LocalizedString
    altTitles: LocalizedString[]
    description: LocalizedString
    isLocked: boolean
    links: Record<string, string>
    originalLanguage: string
    lastVolume: string | null
    lastChapter: string | null
    publicationDemographic: Demographic | null
    status: PublicationStatus
    year: number | null
    contentRating: ContentRating
    tags: Tag[]
    state: string
    chapterNumbersResetOnNewVolume: boolean
    createdAt: string
    updatedAt: string
    version: number
    availableTranslatedLanguages: string[]
    latestUploadedChapter: string | null
  }
  relationships: Relationship[]
}
```

**Chapter Entity** (`src/main/api/entities/chapter.entity.ts`):

```typescript
interface Chapter {
  id: string
  type: 'chapter'
  attributes: {
    title: string | null
    volume: string | null
    chapter: string | null
    pages: number
    translatedLanguage: string
    uploader: string
    externalUrl: string | null
    version: number
    createdAt: string
    updatedAt: string
    publishAt: string
    readableAt: string
  }
  relationships: Relationship[]
}
```

### Response Wrappers

**Single Item Response**:

```typescript
interface ApiResponse<T> {
  result: 'ok' | 'error'
  response: string
  data: T
}
```

**Collection Response**:

```typescript
interface CollectionResponse<T> {
  result: 'ok' | 'error'
  response: string
  data: T[]
  limit: number
  offset: number
  total: number
}
```

### Search Parameters

**Manga Search** (`src/main/api/searchparams/manga.searchparam.ts`):

```typescript
interface MangaSearchParams {
  limit?: number
  offset?: number
  title?: string
  authorOrArtist?: string
  authors?: string[]
  artists?: string[]
  year?: number
  includedTags?: string[]
  excludedTags?: string[]
  status?: PublicationStatus[]
  originalLanguage?: string[]
  excludedOriginalLanguage?: string[]
  availableTranslatedLanguage?: string[]
  publicationDemographic?: Demographic[]
  contentRating?: ContentRating[]
  order?: OrderOptions
  includes?: MangaIncludes[]
  hasAvailableChapters?: boolean | 'true' | 'false'
  createdAtSince?: string
  updatedAtSince?: string
}
```

---

## Error Handling

### Error Classes

**File**: `src/main/api/shared/error.shared.ts`

```typescript
// API errors (4xx, 5xx responses)
class MangaDexApiError extends Error {
  constructor(
    public message: string,
    public error?: ErrorResponse,
    public requestId?: string
  )
}

// Network errors (timeout, connection failed)
class MangaDexNetworkError extends Error {
  constructor(
    public message: string,
    public url: string
  )
}
```

### Error Flow

1. **Network Errors**: Wrapped in `MangaDexNetworkError`
2. **Rate Limits (429)**: Automatic retry with delay
3. **Other API Errors**: Thrown as `MangaDexApiError` with request ID
4. **IPC Serialization**: All errors serialized by `wrapIpcHandler`

### Handling in Renderer

```typescript
try {
  const manga = await window.mangadex.getManga('manga-id')
  if (manga.result === 'ok') {
    // Success
    console.log(manga.data)
  }
} catch (error) {
  if (error.name === 'MangaDexApiError') {
    // API returned an error
    console.error('API Error:', error.message, error.requestId)
  } else if (error.name === 'MangaDexNetworkError') {
    // Network issue
    console.error('Network Error:', error.url)
  } else {
    // Other error
    console.error('Unknown Error:', error)
  }
}
```

---

## IPC Bridge

### Preload Exposure

**File**: `src/preload/index.ts`

```typescript
const mangadexApi = {
  searchManga: (params: MangaSearchParams) => ipcRenderer.invoke('mangadex:search-manga', params),
  getManga: (id: string, includes?: string[]) =>
    ipcRenderer.invoke('mangadex:get-manga', id, includes),
  getMangaFeed: (id: string, query: FeedParams) =>
    ipcRenderer.invoke('mangadex:get-manga-feed', id, query),
  getChapter: (id: string, includes?: string[]) =>
    ipcRenderer.invoke('mangadex:get-chapter', id, includes),
  getChapterImages: (id: string, quality: ImageQuality) =>
    ipcRenderer.invoke('mangadex:get-chapter-images', id, quality),
  getCoverUrl: (id: string, fileName: string, size?: string) =>
    ipcRenderer.invoke('mangadex:get-cover-url', id, fileName, size)
}

contextBridge.exposeInMainWorld('mangadex', mangadexApi)
```

### TypeScript Support

**File**: `src/preload/index.d.ts`

```typescript
interface MangaDexApi {
  searchManga: (params: MangaSearchParams) => Promise<CollectionResponse<Manga>>
  getManga: (id: string, includes?: string[]) => Promise<ApiResponse<Manga>>
  getMangaFeed: (id: string, query: FeedParams) => Promise<CollectionResponse<Chapter>>
  getChapter: (id: string, includes?: string[]) => Promise<ApiResponse<Chapter>>
  getChapterImages: (id: string, quality: ImageQuality) => Promise<ImageUrlResponse[]>
  getCoverUrl: (id: string, fileName: string, size?: string) => string
}

declare global {
  interface Window {
    mangadex: MangaDexApi
  }
}
```

### Main Process Handlers

**File**: `src/main/index.ts`

All handlers wrapped with `wrapIpcHandler` for automatic error serialization:

```typescript
wrapIpcHandler('mangadex:search-manga', async (_, query: unknown) => {
  return await mangadexClient.searchManga(query as MangaSearchParams)
})
```

---

## Usage Patterns

### 1. Browse/Search View

```typescript
import { useState, useEffect } from 'react'

function BrowseView() {
  const [manga, setManga] = useState<Manga[]>([])
  const [loading, setLoading] = useState(false)

  async function searchManga(query: string) {
    setLoading(true)
    try {
      const results = await window.mangadex.searchManga({
        title: query,
        limit: 20,
        contentRating: [ContentRating.Safe, ContentRating.Suggestive],
        includes: [MangaIncludes.CoverArt]
      })

      setManga(results.data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input onChange={(e) => searchManga(e.target.value)} />
      {loading && <p>Loading...</p>}
      {manga.map(m => (
        <MangaCard key={m.id} manga={m} />
      ))}
    </div>
  )
}
```

### 2. Manga Detail View

```typescript
function MangaDetailView({ mangaId }: { mangaId: string }) {
  const [manga, setManga] = useState<Manga | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  useEffect(() => {
    async function loadManga() {
      // Fetch manga details
      const mangaRes = await window.mangadex.getManga(mangaId, ['cover_art', 'author', 'artist'])
      setManga(mangaRes.data)

      // Fetch chapter list
      const chaptersRes = await window.mangadex.getMangaFeed(mangaId, {
        limit: 100,
        translatedLanguage: ['en'],
        order: { chapter: 'asc' }
      })
      setChapters(chaptersRes.data)
    }

    loadManga()
  }, [mangaId])

  // Render manga details and chapter list
}
```

### 3. Chapter Reader

```typescript
function ChapterReader({ chapterId }: { chapterId: string }) {
  const [images, setImages] = useState<ImageUrlResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChapter() {
      try {
        const imageUrls = await window.mangadex.getChapterImages(
          chapterId,
          ImageQuality.Data
        )

        // Convert to proxy protocol
        const proxiedImages = imageUrls.map(img => ({
          ...img,
          url: img.url.replace('https://', 'mangadex://')
        }))

        setImages(proxiedImages)
      } catch (error) {
        console.error('Failed to load chapter:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChapter()
  }, [chapterId])

  if (loading) return <div>Loading chapter...</div>

  return (
    <div className="chapter-reader">
      {images.map((img, index) => (
        <img
          key={index}
          src={img.url}
          alt={`Page ${index + 1}`}
          loading="lazy"
        />
      ))}
    </div>
  )
}
```

### 4. Cover Image Display

```typescript
function MangaCoverImage({ manga }: { manga: Manga }) {
  const coverArt = manga.relationships.find(r => r.type === 'cover_art')

  if (!coverArt || !coverArt.attributes?.fileName) {
    return <div className="no-cover">No Cover</div>
  }

  const coverUrl = window.mangadex.getCoverUrl(
    manga.id,
    coverArt.attributes.fileName,
    CoverSize.Medium
  )

  // Convert to proxy protocol
  const proxiedUrl = coverUrl.replace('https://', 'mangadex://')

  return (
    <img
      src={proxiedUrl}
      alt={manga.attributes.title.en || 'Manga cover'}
      loading="lazy"
    />
  )
}
```

---

## Performance Considerations

### Rate Limiting

- **Global limit**: 5 requests/second = 300 requests/minute
- **At-home limit**: 40 requests/minute for chapter images
- **Automatic backoff**: Built into rate limiter
- **Request queuing**: Handled transparently

### Caching

- **Chapter cache**: 30 MB = ~60 high-quality pages
- **Cover cache**: 20 MB = ~40 covers at 512px
- **Total memory**: ~50 MB for all cached images
- **Cache hits**: Instant response (no network)
- **Cache misses**: Fetched on-demand

### Image Loading

- **Use `loading="lazy"`** on `<img>` tags
- **Preload next pages** for smooth reading:

```typescript
useEffect(() => {
  // Preload next 3 pages
  const nextPages = images.slice(currentPage + 1, currentPage + 4)
  nextPages.forEach((img) => {
    const image = new Image()
    image.src = img.url
  })
}, [currentPage, images])
```

### Pagination

- **Max offset + limit**: 10,000
- **Recommended page size**: 20-50 for search, 100-500 for feeds
- **Deep pagination**: Use `createdAtSince` or `updatedAtSince` instead

---

## MangaDex Usage Policy

As per MangaDex's terms:

✅ **Allowed:**

- Using public API for personal applications
- Caching images temporarily (we use memory-only, clears on app close)
- Crediting MangaDex and scanlation groups (required)

❌ **Not Allowed:**

- Running advertisements
- Charging users for access
- Redistributing content
- Ignoring group removal requests

**DexReader Compliance:**

- Credits MangaDex in About dialog
- Credits scanlation groups in chapter view
- No monetization
- No content redistribution
- Respects all rate limits

---

## Testing

### Manual Testing

Test the API client from the DevTools console:

```javascript
// Search for manga
const results = await window.mangadex.searchManga({ title: 'One Piece', limit: 5 })
console.log(results)

// Get manga details
const manga = await window.mangadex.getManga(results.data[0].id, ['cover_art'])
console.log(manga)

// Get chapters
const chapters = await window.mangadex.getMangaFeed(manga.data.id, {
  limit: 10,
  translatedLanguage: ['en']
})
console.log(chapters)

// Get chapter images
const images = await window.mangadex.getChapterImages(chapters.data[0].id, 'data')
console.log(images)
```

### Rate Limit Testing

```javascript
// Test global rate limit (should throttle after 5 req/s)
for (let i = 0; i < 20; i++) {
  const start = Date.now()
  await window.mangadex.searchManga({ title: 'test', limit: 1 })
  console.log(`Request ${i + 1}: ${Date.now() - start}ms`)
}

// Expected: First 5 fast (~100ms), rest throttled (~200ms intervals)
```

### Image Proxy Testing

```html
<!-- In DevTools, create test image -->
const img = document.createElement('img') img.src =
'mangadex://uploads.mangadex.org/covers/manga-id/cover.jpg' document.body.appendChild(img) // Should
load successfully // Check Network tab - protocol should be "mangadex"
```

---

## Troubleshooting

### Images Not Loading

**Symptom**: Images show broken or wrong content
**Cause**: Direct URL usage instead of proxy protocol
**Fix**: Always convert URLs to `mangadex://`

```typescript
// ❌ Wrong
<img src={imageUrl} />

// ✅ Correct
<img src={imageUrl.replace('https://', 'mangadex://')} />
```

### 429 Rate Limit Errors

**Symptom**: Console shows "Rate limited" warnings
**Cause**: Too many requests in short time
**Fix**: Rate limiter handles automatically, but check for:

- Parallel requests to same endpoint
- Rapid pagination clicks
- Missing rate limit in client code

### Chapter Images Expire

**Symptom**: Images load, then fail after 15 minutes
**Cause**: MangaDex image URLs have 15-minute expiry
**Fix**: Always fetch fresh image URLs per reading session

```typescript
// ❌ Don't store image URLs long-term
localStorage.setItem('images', JSON.stringify(images))

// ✅ Fetch images when opening chapter
useEffect(() => {
  fetchChapterImages(chapterId)
}, [chapterId])
```

### Memory Issues

**Symptom**: App uses too much RAM
**Cause**: Cache growing too large
**Fix**: Clear chapter cache between reading sessions

```typescript
// When closing reader
useEffect(() => {
  return () => {
    // Cleanup on unmount
    imageProxy.clearChapterCache()
  }
}, [])
```

---

## Future Enhancements

### Phase 3 (Bookmarks)

- Persistent cover image cache in AppData
- Manga metadata storage
- Automatic cover image caching on bookmark

### Phase 4 (Downloads)

- Full chapter downloads to user directory
- Offline reading from local storage
- Download queue management

---

## Related Documentation

- [IPC Messaging Architecture](./ipc-messaging.md) - IPC patterns and error handling
- [Error Handling](./error-handling.md) - Error boundaries and recovery
- [Filesystem Security](./filesystem-security.md) - Secure file operations

---

## Changelog

### 2025-12-12 - Initial Implementation

- ✅ API client with all endpoints
- ✅ Rate limiter with token bucket algorithm
- ✅ Image proxy with LRU caching
- ✅ IPC bridge with error handling
- ✅ TypeScript definitions
- ✅ Bug fixes: API URL, LRU eviction, cover expiry, retry loop

---

**Last Verified**: 12 December 2025
