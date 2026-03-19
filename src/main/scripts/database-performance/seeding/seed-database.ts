/**
 * Database Seeding Utilities
 *
 * Generates realistic test data for performance benchmarking and testing.
 * Design: Reusable utilities that can be imported by test suites (P5-T12).
 */

import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from '../../../database/schemas'
import { PublicationStatus, ImageQuality } from '../../../api/enums'
import { DownloadStatus } from '../../../database/enums/download-status.enum'

export interface SeedOptions {
  manga?: number // Number of manga to generate (default: 1000)
  chapters?: number // Number of chapters to generate (default: 10000)
  collections?: number // Number of collections to generate (default: 5)
  downloads?: number // Number of download records (default: 200)
  progress?: number // Number of manga progress records (default: 300)
  statistics?: boolean // Generate reading statistics (default: true)
  clearExisting?: boolean // Clear existing data before seeding (default: true)
  verbose?: boolean // Log detailed progress (default: false)
}

export interface SeedResults {
  manga: number
  chapters: number
  collections: number
  collectionItems: number
  downloads: number
  mangaProgress: number
  chapterProgress: number
  statistics: number
  duration: number // milliseconds
}

/**
 * Generates realistic manga titles (mix of existing + generated)
 */
const SAMPLE_TITLES = [
  'The Dragon Slayer Chronicles',
  'Moonlight Symphony',
  'Crimson Eclipse',
  'Tales of the Wandering Samurai',
  "The Alchemist's Apprentice",
  'Shadow Realm Academy',
  'Starlight Memories',
  'The Last Guardian',
  'Reborn as a Villainess',
  'Chronicles of the Arcane'
]

const TITLE_PREFIXES = ['The', 'Chronicles of', 'Tales of', 'Legend of', 'Rise of', 'Fall of']
const TITLE_MIDDLES = [
  'Dragon',
  'Phoenix',
  'Shadow',
  'Crimson',
  'Azure',
  'Silver',
  'Golden',
  'Dark',
  'Light',
  'Eternal'
]
const TITLE_SUFFIXES = [
  'Warrior',
  'Mage',
  'Knight',
  'Assassin',
  'Hero',
  'Kingdom',
  'Empire',
  'Academy',
  'Guild',
  'Chronicles'
]

const AUTHORS = [
  'Akira Toriyama',
  'Kentaro Miura',
  'Eiichiro Oda',
  'Masashi Kishimoto',
  'Naoko Takeuchi',
  'Yoshihiro Togashi',
  'Hajime Isayama',
  'Rumiko Takahashi',
  'Osamu Tezuka',
  'Makoto Shinkai'
]

const TAGS = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
  'Isekai',
  'Martial Arts'
]

export class DatabaseSeeder {
  private readonly db: BetterSQLite3Database<typeof schema>
  private verbose: boolean = false

  constructor(db: BetterSQLite3Database<typeof schema>) {
    this.db = db
  }

  /**
   * Seed the database with realistic test data
   */
  async seed(options: SeedOptions = {}): Promise<SeedResults> {
    const startTime = performance.now()

    // Default options
    const opts: Required<SeedOptions> = {
      manga: options.manga ?? 1000,
      chapters: options.chapters ?? 10000,
      collections: options.collections ?? 5,
      downloads: options.downloads ?? 200,
      progress: options.progress ?? 300,
      statistics: options.statistics ?? true,
      clearExisting: options.clearExisting ?? true,
      verbose: options.verbose ?? false
    }

    this.verbose = opts.verbose

    this.log(`Starting database seeding...`)
    this.log(`Options: ${JSON.stringify(opts, null, 2)}`)

    // Clear existing data if requested
    if (opts.clearExisting) {
      this.clearData()
    }

    // Seed data in order (respecting foreign key constraints)
    const mangaIds = this.seedManga(opts.manga)
    const chapterIds = this.seedChapters(mangaIds, opts.chapters)
    const collectionIds = this.seedCollections(opts.collections)
    const collectionItemsCount = this.seedCollectionItems(collectionIds, mangaIds)
    const downloadsCount = this.seedDownloads(mangaIds, opts.downloads)
    const { mangaProgressCount, chapterProgressCount } = this.seedProgress(
      mangaIds,

      opts.progress
    )
    const statisticsCount = opts.statistics ? this.seedStatistics() : 0

    const endTime = performance.now()
    const duration = endTime - startTime

    const results: SeedResults = {
      manga: mangaIds.length,
      chapters: chapterIds.length,
      collections: collectionIds.length,
      collectionItems: collectionItemsCount,
      downloads: downloadsCount,
      mangaProgress: mangaProgressCount,
      chapterProgress: chapterProgressCount,
      statistics: statisticsCount,
      duration: Math.round(duration)
    }

    this.log(`\nSeeding completed in ${Math.round(duration)}ms`)
    this.log(`Results: ${JSON.stringify(results, null, 2)}`)

    return results
  }

  /**
   * Clear all data from the database
   */
  private clearData(): void {
    this.log('Clearing existing data...')

    // Order matters due to foreign key constraints
    this.db.delete(schema.chapterProgress).run()
    this.db.delete(schema.mangaProgress).run()
    this.db.delete(schema.chapterDownloads).run()
    this.db.delete(schema.collectionItems).run()
    this.db.delete(schema.collections).run()
    this.db.delete(schema.chapter).run()
    this.db.delete(schema.manga).run()
    this.db.delete(schema.readingStatistics).run()

    this.log('Data cleared successfully')
  }

  /**
   * Generate manga records
   */
  private seedManga(count: number): string[] {
    this.log(`\nGenerating ${count} manga records...`)

    const mangaIds: string[] = []
    const now = Date.now()
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

    for (let i = 0; i < count; i++) {
      const mangaId = this.generateUUID()
      const title = this.generateMangaTitle(i)
      const status = this.generatePublicationStatus()
      const isFavourite = Math.random() < 0.2 // 20% favourited
      const addedAt = this.randomDate(ninetyDaysAgo, now)
      const lastAccessedAt = this.randomDate(addedAt, now)

      this.db
        .insert(schema.manga)
        .values({
          mangaId,
          title,
          description: `This is a description for ${title}. An epic tale of adventure and courage.`,
          status,
          coverUrl: `https://uploads.mangadex.org/covers/${mangaId}/cover.jpg`,
          year: 2020 + Math.floor(Math.random() * 5),
          isFavourite,
          addedAt: new Date(addedAt),
          updatedAt: new Date(lastAccessedAt),
          lastAccessedAt: new Date(lastAccessedAt),
          tags: this.randomTags(),
          authors: [this.randomElement(AUTHORS)],
          artists: [this.randomElement(AUTHORS)],
          alternativeTitles: { en: title, ja: `日本語タイトル ${i}` },
          lastKnownChapterNumber: null,
          hasNewChapters: false
        })
        .run()

      mangaIds.push(mangaId)

      if (this.verbose && (i + 1) % 100 === 0) {
        this.log(`Generated ${i + 1}/${count} manga`)
      }
    }

    this.log(`Generated ${count} manga records`)
    return mangaIds
  }

  /**
   * Generate chapter records distributed across manga
   */
  private seedChapters(mangaIds: string[], totalChapters: number): string[] {
    this.log(`\nGenerating ${totalChapters} chapter records...`)

    const chapterIds: string[] = []
    const now = Date.now()
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

    // Distribute chapters across manga (avg ~10 chapters, range 1-500)
    let remainingChapters = totalChapters
    const chaptersPerManga = new Map<string, number>()

    for (const mangaId of mangaIds) {
      if (remainingChapters <= 0) break

      // Some manga have many chapters, most have few
      const isPopular = Math.random() < 0.05 // 5% have 200-500 chapters
      const count = isPopular
        ? 200 + Math.floor(Math.random() * 300)
        : 1 + Math.floor(Math.random() * 30)

      chaptersPerManga.set(mangaId, Math.min(count, remainingChapters))
      remainingChapters -= count
    }

    // Generate chapters for each manga
    let totalGenerated = 0
    for (const [mangaId, count] of chaptersPerManga.entries()) {
      for (let chapterNum = 1; chapterNum <= count; chapterNum++) {
        const chapterId = this.generateUUID()
        const publishAt = this.randomDate(sixtyDaysAgo, now)

        this.db
          .insert(schema.chapter)
          .values({
            chapterId,
            mangaId,
            title: `Chapter ${chapterNum}`,
            chapterNumber: chapterNum.toString(),
            volume: chapterNum <= 10 ? '1' : Math.floor(chapterNum / 10).toString(),
            language: 'en',
            publishAt: new Date(publishAt),
            createdAt: new Date(publishAt),
            updatedAt: new Date(publishAt),
            scanlationGroup: 'Test Scans'
          })
          .run()

        chapterIds.push(chapterId)
        totalGenerated++

        if (this.verbose && totalGenerated % 1000 === 0) {
          this.log(`Generated ${totalGenerated}/${totalChapters} chapters`)
        }
      }
    }

    this.log(`Generated ${chapterIds.length} chapter records`)
    return chapterIds
  }

  /**
   * Generate collection records
   */
  private seedCollections(count: number): number[] {
    this.log(`\nGenerating ${count} collection records...`)

    const collectionIds: number[] = []
    const now = new Date()
    const collectionNames = ['Favourites', 'Reading', 'Completed', 'Plan to Read', 'On Hold']

    for (let i = 0; i < count; i++) {
      const name = collectionNames[i] || `Collection ${i + 1}`

      const result = this.db
        .insert(schema.collections)
        .values({
          name,
          description: `Collection for ${name}`,
          createdAt: now,
          updatedAt: now
        })
        .run()

      collectionIds.push(Number(result.lastInsertRowid))
    }

    this.log(`Generated ${count} collection records`)
    return collectionIds
  }

  /**
   * Generate collection items (link manga to collections)
   */
  private seedCollectionItems(collectionIds: number[], mangaIds: string[]): number {
    this.log(`\nGenerating collection items...`)

    // Only add favourited manga to collections (20% of total)
    const favouritedManga = mangaIds.filter(() => Math.random() < 0.2)

    let totalItems = 0
    const now = new Date()

    // Distribution: 50%, 30%, 15%, 5%, 1% of favourited manga
    const distributions = [0.5, 0.3, 0.15, 0.05, 0.01]

    for (let i = 0; i < collectionIds.length && i < distributions.length; i++) {
      const collectionId = collectionIds[i]
      const itemCount = Math.floor(favouritedManga.length * distributions[i])

      // Randomly select manga for this collection
      const selectedManga = this.shuffleArray([...favouritedManga]).slice(0, itemCount)

      for (let j = 0; j < selectedManga.length; j++) {
        this.db
          .insert(schema.collectionItems)
          .values({
            collectionId,
            mangaId: selectedManga[j],
            addedAt: now,
            position: j
          })
          .run()

        totalItems++
      }
    }

    this.log(`Generated ${totalItems} collection items`)
    return totalItems
  }

  /**
   * Generate chapter download records
   */
  private seedDownloads(mangaIds: string[], count: number): number {
    this.log(`\nGenerating ${count} download records...`)

    // Select random subset of manga that have downloads (50 manga)
    const mangaWithDownloads = this.shuffleArray([...mangaIds]).slice(0, 50)
    const now = new Date()

    let totalDownloads = 0
    const usedChapterIds = new Set<string>() // Track used chapters to avoid duplicates

    for (let i = 0; i < count; i++) {
      // Pick a random manga that has downloads
      const mangaId = this.randomElement(mangaWithDownloads)

      // Find chapters for this manga that haven't been used yet
      const mangaChapters = this.db
        .select()
        .from(schema.chapter)
        .where(eq(schema.chapter.mangaId, mangaId))
        .limit(20)
        .all()

      if (mangaChapters.length === 0) continue

      // Filter to unused chapters
      const availableChapters = mangaChapters.filter((ch) => !usedChapterIds.has(ch.chapterId))

      if (availableChapters.length === 0) {
        // No more chapters available for this manga, skip
        continue
      }

      const chapter = this.randomElement(availableChapters)
      usedChapterIds.add(chapter.chapterId) // Mark as used

      // Status distribution: 80% completed, 10% downloading, 5% failed, 5% pending
      const rand = Math.random()
      let status: DownloadStatus
      if (rand < 0.8) {
        status = DownloadStatus.Completed
      } else if (rand < 0.9) {
        status = DownloadStatus.Downloading
      } else if (rand < 0.95) {
        status = DownloadStatus.Failed
      } else {
        status = DownloadStatus.Queued
      }

      this.db
        .insert(schema.chapterDownloads)
        .values({
          chapterId: chapter.chapterId,
          mangaId: chapter.mangaId,
          status,
          downloadedAt: status === DownloadStatus.Completed ? now : null,
          downloadsBasePath: String.raw`C:\DexReader\Downloads`,
          filePath: `${chapter.mangaId}/${chapter.chapterId}`,
          totalPages: 15 + Math.floor(Math.random() * 35), // 15-50 pages
          storageSize: 5000000 + Math.floor(Math.random() * 15000000), // 5-20MB
          imageQuality: ImageQuality.High,
          imageFormat: '.jpg',
          errorMessage: status === DownloadStatus.Failed ? 'Download failed' : null,
          lastAttemptedAt: now,
          lastVerifiedAt: now,
          isHidden: false
        })
        .run()

      totalDownloads++

      if (this.verbose && (i + 1) % 50 === 0) {
        this.log(`Generated ${i + 1}/${count} downloads`)
      }
    }

    this.log(`Generated ${totalDownloads} download records`)
    return totalDownloads
  }

  /**
   * Generate reading progress records
   */
  private seedProgress(
    mangaIds: string[],
    count: number
  ): { mangaProgressCount: number; chapterProgressCount: number } {
    this.log(`\nGenerating ${count} manga progress records...`)

    // Select random subset of manga for progress (30% of total)
    const mangaWithProgress = this.shuffleArray([...mangaIds]).slice(0, count)

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    let chapterProgressCount = 0

    for (const mangaId of mangaWithProgress) {
      // Get chapters for this manga
      const mangaChapters = this.db
        .select()
        .from(schema.chapter)
        .where(eq(schema.chapter.mangaId, mangaId))
        .all()

      if (mangaChapters.length === 0) continue

      // Determine how many chapters were read (40% completed, 60% in-progress)
      const isCompleted = Math.random() < 0.4
      const readCount = isCompleted
        ? mangaChapters.length
        : 1 + Math.floor(Math.random() * Math.min(mangaChapters.length, 10))

      const lastChapter = mangaChapters[Math.min(readCount - 1, mangaChapters.length - 1)]
      const firstReadAt = this.randomDate(thirtyDaysAgo, now)
      const lastReadAt = this.randomDate(firstReadAt, now)

      // Create manga progress
      this.db
        .insert(schema.mangaProgress)
        .values({
          mangaId,
          lastChapterId: lastChapter.chapterId,
          firstReadAt: new Date(firstReadAt),
          lastReadAt: new Date(lastReadAt)
        })
        .run()

      // Create chapter progress for each read chapter
      for (let i = 0; i < readCount; i++) {
        const chapter = mangaChapters[i]
        const totalPages = 20 + Math.floor(Math.random() * 30) // 20-50 pages
        const currentPage = i < readCount - 1 ? totalPages : Math.floor(Math.random() * totalPages)
        const completed = i < readCount - 1

        this.db
          .insert(schema.chapterProgress)
          .values({
            mangaId,
            chapterId: chapter.chapterId,
            currentPage,
            completed,
            lastReadAt: new Date(lastReadAt)
          })
          .run()

        chapterProgressCount++
      }
    }

    this.log(`Generated ${mangaWithProgress.length} manga progress records`)
    this.log(`Generated ${chapterProgressCount} chapter progress records`)

    return {
      mangaProgressCount: mangaWithProgress.length,
      chapterProgressCount
    }
  }

  /**
   * Generate reading statistics
   */
  private seedStatistics(): number {
    this.log(`\nGenerating reading statistics...`)

    // Calculate statistics from existing progress data
    const mangaProgress = this.db.select().from(schema.mangaProgress).all()
    const chapterProgress = this.db.select().from(schema.chapterProgress).all()

    const totalMangasRead = mangaProgress.length
    const totalChaptersRead = chapterProgress.filter((cp) => cp.completed).length
    const totalPagesRead = chapterProgress.reduce(
      (sum, cp) => sum + (cp.completed ? 30 : cp.currentPage),
      0
    )
    const totalEstimatedMinutes = Math.floor(totalPagesRead * 0.5) // ~0.5 min per page

    this.db
      .insert(schema.readingStatistics)
      .values({
        id: 1,
        totalMangasRead,
        totalChaptersRead,
        totalPagesRead,
        totalEstimatedMinutes,
        lastCalculatedAt: new Date()
      })
      .run()

    this.log(`Generated reading statistics record`)
    return 1
  }

  // ==================== UTILITY METHODS ====================

  private log(message: string): void {
    if (this.verbose || !message.startsWith('Generated')) {
      console.log(message)
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
      const r = Math.trunc(Math.random() * 16)
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private generateMangaTitle(index: number): string {
    if (index < SAMPLE_TITLES.length) {
      return SAMPLE_TITLES[index]
    }

    const prefix = this.randomElement(TITLE_PREFIXES)
    const middle = this.randomElement(TITLE_MIDDLES)
    const suffix = this.randomElement(TITLE_SUFFIXES)

    return `${prefix} ${middle} ${suffix}`
  }

  private generatePublicationStatus(): PublicationStatus {
    const rand = Math.random()
    if (rand < 0.6) return PublicationStatus.Ongoing
    if (rand < 0.85) return PublicationStatus.Completed
    if (rand < 0.95) return PublicationStatus.Hiatus
    return PublicationStatus.Cancelled
  }

  private randomTags(): string[] {
    const count = 3 + Math.floor(Math.random() * 5) // 3-7 tags
    return this.shuffleArray([...TAGS]).slice(0, count)
  }

  private randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private randomDate(start: number, end: number): number {
    return start + Math.floor(Math.random() * (end - start))
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
