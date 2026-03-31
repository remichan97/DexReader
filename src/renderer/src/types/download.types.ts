// Type extracted from downloads.getAllDownloads() return type
type ChapterDownloadQuery = NonNullable<
  Awaited<ReturnType<Window['downloads']['getAllDownloads']>>['data']
>[number]

/**
 * Frontend representation of a download
 * Mapped from ChapterDownloadQuery with additional calculated fields
 */
export interface Download {
  id: string // chapterId
  mangaId: string
  mangaTitle: string // from title field
  chapterNumber: string
  chapterTitle?: string
  volume?: string
  progress: number // 0-100 percentage
  status: 'queued' | 'downloading' | 'completed' | 'failed'
  totalPages: number
  currentPage?: number // From progress event
  downloadedAt: number
  storageSize: number
  errorMessage?: string
  language?: string
}

/**
 * Manga group with aggregated downloads
 * Used for collapsible grouped UI
 */
export interface MangaDownloadGroup {
  mangaId: string
  mangaTitle: string
  downloads: Download[]
  totalChapters: number
  completedChapters: number
  failedChapters: number
  activeChapters: number // downloading + queued
  totalStorageSize: number
  isExpanded: boolean // For collapsible UI
}

/**
 * Maps backend ChapterDownloadQuery to frontend Download interface
 */
export function mapChapterDownloadToFrontend(query: ChapterDownloadQuery): Download {
  // Calculate progress percentage based on status
  const progress = query.status === 'completed' ? 100 : 0

  return {
    id: query.chapterId,
    mangaId: query.mangaId,
    mangaTitle: query.title,
    chapterNumber: query.chapterNumber,
    chapterTitle: query.chapterTitle,
    volume: query.volume,
    progress,
    status: query.status,
    totalPages: query.totalPages,
    downloadedAt: query.downloadedAt,
    storageSize: query.storageSize,
    errorMessage: query.errorMessage,
    language: query.language
  }
}

/**
 * Groups downloads by manga and calculates aggregate statistics
 * Sorts groups by activity (manga with active downloads first)
 */
export function groupDownloadsByManga(downloads: Download[]): MangaDownloadGroup[] {
  const grouped = new Map<string, MangaDownloadGroup>()

  downloads.forEach((download) => {
    if (!grouped.has(download.mangaId)) {
      grouped.set(download.mangaId, {
        mangaId: download.mangaId,
        mangaTitle: download.mangaTitle,
        downloads: [],
        totalChapters: 0,
        completedChapters: 0,
        failedChapters: 0,
        activeChapters: 0,
        totalStorageSize: 0,
        isExpanded: true // Expand all by default
      })
    }

    const group = grouped.get(download.mangaId)!
    group.downloads.push(download)
    group.totalChapters++
    group.totalStorageSize += download.storageSize

    if (download.status === 'completed') group.completedChapters++
    if (download.status === 'failed') group.failedChapters++
    if (download.status === 'downloading' || download.status === 'queued') {
      group.activeChapters++
    }
  })

  // Sort chapters within each group by STATUS PRIORITY
  // Order: downloading → failed → completed → queued
  grouped.forEach((group) => {
    const statusPriority = {
      downloading: 0,
      failed: 1,
      completed: 2,
      queued: 3
    }

    group.downloads.sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status]
      if (statusDiff !== 0) return statusDiff

      // Secondary sort by chapter number
      const numA = Number.parseFloat(a.chapterNumber) || 0
      const numB = Number.parseFloat(b.chapterNumber) || 0
      return numA - numB
    })
  })

  // Sort groups: active downloads first, then by manga title
  return Array.from(grouped.values()).sort((a, b) => {
    if (a.activeChapters > 0 && b.activeChapters === 0) return -1
    if (a.activeChapters === 0 && b.activeChapters > 0) return 1
    return a.mangaTitle.localeCompare(b.mangaTitle)
  })
}

/**
 * Format bytes to human-readable string
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const mb = bytes / (1024 * 1024)
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(2)} MB`
}

/**
 * Format speed from bytes per second to human-readable string
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 KB/s'

  const mbps = bytesPerSecond / (1024 * 1024)
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} MB/s`
  }

  const kbps = bytesPerSecond / 1024
  return `${kbps.toFixed(1)} KB/s`
}

/**
 * Format ETA from seconds to human-readable string
 */
export function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.ceil(seconds % 60)
    return `${minutes}m ${secs}s`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}
