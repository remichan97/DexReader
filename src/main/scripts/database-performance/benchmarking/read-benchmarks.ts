/**
 * Database Benchmark Suite
 *
 * Measures query performance with realistic datasets.
 * Design: Reusable utilities that can be integrated into test suites (P5-T12).
 *
 * Note: Due to better-sqlite3 being compiled for Electron, this must be run
 * in Electron context (via run-benchmark.js wrapper).
 *
 * Implementation: Queries database directly to avoid singleton initialization issues.
 */

import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { and, eq, isNotNull, like, lt, notExists, or, sql } from 'drizzle-orm'
import * as schema from '../../../database/schemas'
import { DownloadStatus } from '../../../database/enums/download-status.enum'
import fs from 'node:fs'
import path from 'node:path'

export interface BenchmarkResult {
  query: string // Query name (e.g., 'getLibraryManga')
  view: string // View context (e.g., 'Library', 'History', 'Downloads')
  iterations: number // Number of test iterations
  avgTime: number // Average execution time (ms)
  minTime: number // Minimum execution time (ms)
  maxTime: number // Maximum execution time (ms)
  p95Time: number // 95th percentile execution time (ms)
  threshold: number // Performance threshold (ms)
  status: 'pass' | 'warn' | 'fail' // Performance status
  timestamp: string // ISO timestamp of benchmark run
}

export interface BenchmarkSummary {
  totalQueries: number
  passed: number
  warnings: number
  failed: number
  totalTime: number
  results: BenchmarkResult[]
  metadata: {
    timestamp: string
    iterations: number
    notes?: string
  }
}

export interface BenchmarkOptions {
  iterations?: number // Number of iterations per query (default: 10)
  warmupIterations?: number // Warmup runs before timing (default: 2)
  verbose?: boolean // Log detailed progress (default: false)
  saveToFile?: string // Save results to JSON file (optional)
}

export class DatabaseBenchmark {
  private readonly db: BetterSQLite3Database<typeof schema>
  private verbose: boolean = false

  // Test manga ID (should exist in seeded database)
  private testMangaId: string | null = null

  constructor(db: BetterSQLite3Database<typeof schema>) {
    this.db = db
  }

  /**
   * Benchmark a single query function
   */
  benchmark(
    name: string,
    view: string,
    queryFn: () => unknown,
    threshold: number,
    options: BenchmarkOptions = {}
  ): BenchmarkResult {
    const iterations = options.iterations ?? 10
    const warmupIterations = options.warmupIterations ?? 2

    this.log(`\nBenchmarking: ${name} (${view})`)
    this.log(`  Threshold: ${threshold}ms | Iterations: ${iterations}`)

    // Warmup runs (not timed)
    for (let i = 0; i < warmupIterations; i++) {
      queryFn()
    }

    // Timed runs
    const times: number[] = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      queryFn()
      const end = performance.now()
      const duration = end - start
      times.push(duration)
    }

    // Calculate statistics
    times.sort((a, b) => a - b)
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length
    const minTime = times[0]
    const maxTime = times.at(-1)!
    const p95Index = Math.floor(times.length * 0.95)
    const p95Time = times[p95Index]

    // Determine status
    let status: 'pass' | 'warn' | 'fail'
    if (avgTime <= threshold) {
      status = 'pass'
    } else if (avgTime <= threshold * 1.5) {
      status = 'warn' // Within 50% of threshold
    } else {
      status = 'fail'
    }

    const result: BenchmarkResult = {
      query: name,
      view,
      iterations,
      avgTime: Math.round(avgTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      p95Time: Math.round(p95Time * 100) / 100,
      threshold,
      status,
      timestamp: new Date().toISOString()
    }

    this.log(
      `  Result: ${status.toUpperCase()} | Avg: ${result.avgTime}ms | P95: ${result.p95Time}ms`
    )

    return result
  }

  /**
   * Run all benchmarks and return results
   */
  runAll(options: BenchmarkOptions = {}): BenchmarkSummary {
    this.verbose = options.verbose ?? false

    console.log('═'.repeat(70))
    console.log('Database Performance Benchmark Suite')
    console.log('═'.repeat(70))

    const startTime = performance.now()

    // Initialize test data references
    this.initializeTestData()

    const results: BenchmarkResult[] = []

    // 1. Library View Benchmarks (threshold: 50ms)
    results.push(
      this.benchmark('getLibraryManga()', 'Library', () => this.queryLibraryManga(), 50, options)
    )

    results.push(
      this.benchmark(
        'getLibraryManga({ search })',
        'Library',
        () => this.queryLibraryManga('Dragon'),
        50,
        options
      )
    )

    // 2. History View Benchmarks (threshold: 75ms)
    results.push(
      this.benchmark(
        'getAllProgressWithMetadata()',
        'History',
        () => this.queryProgressWithMetadata(),
        75,
        options
      )
    )

    // 3. Downloads View Benchmarks (threshold: 75ms)
    results.push(
      this.benchmark('getAllDownloads()', 'Downloads', () => this.queryAllDownloads(), 75, options)
    )

    // 4. Collections View Benchmarks (threshold: 75ms)
    results.push(
      this.benchmark(
        'getAllCollectionsWithMetadata()',
        'Collections',
        () => this.queryCollectionsWithMetadata(),
        75,
        options
      )
    )

    // 5. Reader View Benchmarks (threshold: 100ms)
    if (this.testMangaId) {
      results.push(
        this.benchmark(
          'getChaptersByMangaId()',
          'Reader',
          () => this.queryChaptersByMangaId(this.testMangaId as string),
          100,
          options
        )
      )
    } else {
      console.warn('⚠️  Skipping Reader benchmarks: No test manga found')
    }

    // 6. Cleanup Benchmarks (threshold: 150ms)
    results.push(
      this.benchmark(
        'cleanupMangaCache()',
        'Cleanup',
        () => this.queryCleanupMangaCache(),
        150,
        options
      )
    )

    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)

    // Calculate summary
    const passed = results.filter((r) => r.status === 'pass').length
    const warnings = results.filter((r) => r.status === 'warn').length
    const failed = results.filter((r) => r.status === 'fail').length

    const summary: BenchmarkSummary = {
      totalQueries: results.length,
      passed,
      warnings,
      failed,
      totalTime,
      results,
      metadata: {
        timestamp: new Date().toISOString(),
        iterations: options.iterations ?? 10,
        notes: 'Benchmark run on seeded database with ~1000 manga, ~10,000 chapters'
      }
    }

    // Print summary
    this.printSummary(summary)

    // Save to file if requested
    if (options.saveToFile) {
      this.saveResults(summary, options.saveToFile)
    }

    return summary
  }

  /**
   * Initialize test data references (e.g., sample manga ID)
   */
  private initializeTestData(): void {
    // Get a sample manga ID for Reader benchmarks
    const sampleManga = this.db
      .select({ id: schema.manga.mangaId })
      .from(schema.manga)
      .where(eq(schema.manga.isFavourite, true))
      .limit(1)
      .all()

    if (sampleManga.length > 0) {
      this.testMangaId = sampleManga[0].id
      this.log(`Test manga ID: ${this.testMangaId}`)
    }
  }

  /**
   * Query: Get library manga (favourited manga)
   * Matches: MangaRepository.getLibraryManga()
   */
  private queryLibraryManga(search?: string): unknown[] {
    // Match actual repository with LEFT JOIN, COUNT aggregation, GROUP BY
    let query = this.db
      .select({
        manga: schema.manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${schema.chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(schema.manga)
      .leftJoin(schema.chapterDownloads, eq(schema.manga.mangaId, schema.chapterDownloads.mangaId))
      .$dynamic()

    // Apply search filter if provided
    if (search) {
      query = query.where(
        and(
          or(
            eq(schema.manga.isFavourite, true),
            eq(schema.chapterDownloads.status, DownloadStatus.Completed)
          ),
          like(schema.manga.title, `%${search}%`)
        )
      )
    } else {
      query = query.where(
        or(
          eq(schema.manga.isFavourite, true),
          eq(schema.chapterDownloads.status, DownloadStatus.Completed)
        )
      )
    }

    return query.groupBy(schema.manga.mangaId).all()
  }

  /**
   * Query: Get all progress with metadata
   * Matches: MangaProgressRepository.getAllProgressWithMetadata()
   */
  private queryProgressWithMetadata(): unknown[] {
    // Match actual repository with INNER JOIN manga, LEFT JOIN chapter, explicit columns
    return this.db
      .select({
        mangaId: schema.mangaProgress.mangaId,
        lastChapterId: schema.mangaProgress.lastChapterId,
        firstReadAt: schema.mangaProgress.firstReadAt,
        lastReadAt: schema.mangaProgress.lastReadAt,
        title: schema.manga.title,
        coverUrl: schema.manga.coverUrl,
        status: schema.manga.status,
        lastChapterNumber: schema.chapter.chapterNumber,
        lastChapterTitle: schema.chapter.title,
        lastChapterVolume: schema.chapter.volume,
        language: schema.chapter.language
      })
      .from(schema.mangaProgress)
      .innerJoin(schema.manga, eq(schema.mangaProgress.mangaId, schema.manga.mangaId))
      .leftJoin(schema.chapter, eq(schema.mangaProgress.lastChapterId, schema.chapter.chapterId))
      .where(isNotNull(schema.mangaProgress.lastReadAt))
      .all()
  }

  /**
   * Query: Get all downloads
   * Matches: ChapterDownloadsRepository.getAllDownloads()
   */
  private queryAllDownloads(): unknown[] {
    // Match actual repository with 2 INNER JOINs, WHERE clause, explicit columns
    return this.db
      .select({
        chapterId: schema.chapterDownloads.chapterId,
        mangaId: schema.chapterDownloads.mangaId,
        status: schema.chapterDownloads.status,
        storageSize: schema.chapterDownloads.storageSize,
        downloadedAt: schema.chapterDownloads.downloadedAt,
        downloadsBasePath: schema.chapterDownloads.downloadsBasePath,
        filePath: schema.chapterDownloads.filePath,
        totalPages: schema.chapterDownloads.totalPages,
        imageQuality: schema.chapterDownloads.imageQuality,
        imageFormat: schema.chapterDownloads.imageFormat,
        errorMessage: schema.chapterDownloads.errorMessage,
        title: schema.manga.title,
        coverUrl: schema.manga.coverUrl,
        chapterNumber: schema.chapter.chapterNumber,
        chapterTitle: schema.chapter.title,
        volume: schema.chapter.volume,
        language: schema.chapter.language
      })
      .from(schema.chapterDownloads)
      .innerJoin(schema.manga, eq(schema.chapterDownloads.mangaId, schema.manga.mangaId))
      .innerJoin(schema.chapter, eq(schema.chapterDownloads.chapterId, schema.chapter.chapterId))
      .where(eq(schema.chapterDownloads.isHidden, false))
      .all()
  }

  /**
   * Query: Get collections with metadata
   * Matches: CollectionRepository.getAllCollectionsWithMetadata()
   */
  private queryCollectionsWithMetadata(): unknown[] {
    // Match actual repository with LEFT JOINs, COUNT, MAX, GROUP BY
    return this.db
      .select({
        id: schema.collections.id,
        name: schema.collections.name,
        createdAt: schema.collections.createdAt,
        updatedAt: schema.collections.updatedAt,
        mangaCount: sql<number>`COUNT(${schema.collectionItems.mangaId})`,
        coverUrl: sql<string | null>`MAX(${schema.manga.coverUrl})`
      })
      .from(schema.collections)
      .leftJoin(
        schema.collectionItems,
        eq(schema.collections.id, schema.collectionItems.collectionId)
      )
      .leftJoin(schema.manga, eq(schema.collectionItems.mangaId, schema.manga.mangaId))
      .groupBy(schema.collections.id)
      .all()
  }

  /**
   * Query: Get chapters by manga ID
   * Matches: ChapterRepository.getChaptersByMangaId()
   */
  private queryChaptersByMangaId(mangaId: string): unknown[] {
    // This one already matches the repository (simple select with where)
    return this.db.select().from(schema.chapter).where(eq(schema.chapter.mangaId, mangaId)).all()
  }

  /**
   * Query: Cleanup manga cache (find stale manga)
   * Matches: MangaRepository.cleanupMangaCache()
   */
  private queryCleanupMangaCache(): unknown[] {
    const now = new Date()
    const thresholdDate = new Date()
    thresholdDate.setDate(now.getDate() - 90)

    // Match actual repository with notExists checking for COMPLETED downloads
    return this.db
      .select({ mangaId: schema.manga.mangaId })
      .from(schema.manga)
      .where(
        and(
          eq(schema.manga.isFavourite, false),
          lt(schema.manga.lastAccessedAt, thresholdDate),
          notExists(
            this.db
              .select()
              .from(schema.chapterDownloads)
              .where(
                and(
                  eq(schema.chapterDownloads.mangaId, schema.manga.mangaId),
                  eq(schema.chapterDownloads.status, DownloadStatus.Completed)
                )
              )
          )
        )
      )
      .all()
  }

  /**
   * Print benchmark summary to console
   */
  printSummary(summary: BenchmarkSummary): void {
    console.log('\n' + '═'.repeat(70))
    console.log('Benchmark Results Summary')
    console.log('═'.repeat(70))

    console.log(`\nTotal Queries: ${summary.totalQueries}`)
    console.log(`✅ Passed:     ${summary.passed}`)
    console.log(`⚠️  Warnings:   ${summary.warnings}`)
    console.log(`❌ Failed:     ${summary.failed}`)
    console.log(`⏱️  Total Time: ${summary.totalTime}ms`)

    console.log('\n' + '-'.repeat(70))
    console.log('Detailed Results')
    console.log('-'.repeat(70))

    // Group by view
    const views = ['Library', 'History', 'Downloads', 'Collections', 'Reader', 'Cleanup']

    for (const view of views) {
      const viewResults = summary.results.filter((r) => r.view === view)
      if (viewResults.length === 0) continue

      console.log(`\n${view} View:`)
      for (const result of viewResults) {
        let statusIcon: string
        if (result.status === 'pass') {
          statusIcon = '✅'
        } else if (result.status === 'warn') {
          statusIcon = '⚠️'
        } else {
          statusIcon = '❌'
        }

        const avgFormatted = result.avgTime.toFixed(2).padStart(8)
        const p95Formatted = result.p95Time.toFixed(2).padStart(8)
        const thresholdFormatted = result.threshold.toString().padStart(4)

        console.log(
          `  ${statusIcon} ${result.query.padEnd(35)} Avg: ${avgFormatted}ms | P95: ${p95Formatted}ms | Threshold: ${thresholdFormatted}ms`
        )
      }
    }

    console.log('\n' + '═'.repeat(70))

    // Overall status
    if (summary.failed > 0) {
      console.log('❌ BENCHMARK FAILED: Some queries exceed performance thresholds')
    } else if (summary.warnings > 0) {
      console.log('⚠️  BENCHMARK WARNING: Some queries are approaching thresholds')
    } else {
      console.log('✅ ALL BENCHMARKS PASSED')
    }

    console.log('═'.repeat(70) + '\n')
  }

  /**
   * Save benchmark results to JSON file
   */
  saveResults(summary: BenchmarkSummary, filename: string): void {
    try {
      const filePath = path.resolve(filename)
      const dir = path.dirname(filePath)

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const json = JSON.stringify(summary, null, 2)
      fs.writeFileSync(filePath, json, 'utf-8')
      console.log(`\n📁 Results saved to: ${filePath}`)
    } catch (error) {
      console.error(`Failed to save results: ${error}`)
    }
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(message)
    }
  }
}
