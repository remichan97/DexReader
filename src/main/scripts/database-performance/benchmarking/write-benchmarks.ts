/**
 * Database Write Benchmarks
 *
 * Benchmarks write operations (INSERT, UPDATE, DELETE) to establish baseline
 * performance before batch operation refactoring.
 *
 * Tests both patterns:
 * - Pattern A: Simple bulk operations (candidates for inArray optimization)
 * - Pattern B: Complex per-item logic (will use transaction utility)
 *
 * These benchmarks match actual repository implementations exactly.
 */

import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from '../../../database/schemas'
import { BenchmarkResult, BenchmarkOptions } from './benchmark-suite'
import { PublicationStatus } from '../../../api/enums'

export interface WriteBenchmarkSummary {
  totalOperations: number
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

export class WriteBenchmarks {
  private readonly db: BetterSQLite3Database<typeof schema>
  private verbose: boolean = false

  // Test data IDs (populated from seeded database)
  private testMangaIds: string[] = []
  private testChapterIds: string[] = []

  constructor(db: BetterSQLite3Database<typeof schema>) {
    this.db = db
  }

  /**
   * Benchmark a single write operation function
   */
  benchmark(
    name: string,
    category: string,
    operationFn: () => unknown,
    threshold: number,
    options: BenchmarkOptions = {}
  ): BenchmarkResult {
    const iterations = options.iterations ?? 10
    const warmupIterations = options.warmupIterations ?? 2

    this.log(`\nBenchmarking: ${name} (${category})`)
    this.log(`  Threshold: ${threshold}ms | Iterations: ${iterations}`)

    // Warmup runs (not timed)
    for (let i = 0; i < warmupIterations; i++) {
      operationFn()
    }

    // Timed runs
    const times: number[] = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      operationFn()
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
      status = 'warn'
    } else {
      status = 'fail'
    }

    const result: BenchmarkResult = {
      query: name,
      view: category,
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
   * Run all write benchmarks and return results
   */
  runAll(options: BenchmarkOptions = {}): WriteBenchmarkSummary {
    this.verbose = options.verbose ?? false

    console.log('═'.repeat(70))
    console.log('Database Write Performance Benchmarks (BASELINE)')
    console.log('═'.repeat(70))

    const startTime = performance.now()

    // Initialize test data references
    this.initializeTestData()

    const results: BenchmarkResult[] = []

    // Pattern A: Simple Bulk Operations (candidates for inArray)
    // These use transaction loops where all items get same treatment
    console.log('\n📝 Pattern A: Simple Bulk Operations (inArray candidates)')

    results.push(
      this.benchmark(
        'updateCoverCachedDate(10)',
        'Pattern A',
        () => this.writeUpdateCoverCache(10),
        15, // Threshold: 15ms for 10 updates
        options
      )
    )

    results.push(
      this.benchmark(
        'updateCoverCachedDate(50)',
        'Pattern A',
        () => this.writeUpdateCoverCache(50),
        50, // Threshold: 50ms for 50 updates
        options
      )
    )

    results.push(
      this.benchmark(
        'updateCoverCachedDate(100)',
        'Pattern A',
        () => this.writeUpdateCoverCache(100),
        100, // Threshold: 100ms for 100 updates
        options
      )
    )

    results.push(
      this.benchmark(
        'clearCachedCoverDate(10)',
        'Pattern A',
        () => this.writeClearCoverCache(10),
        15, // Threshold: 15ms for 10 updates
        options
      )
    )

    results.push(
      this.benchmark(
        'clearCachedCoverDate(50)',
        'Pattern A',
        () => this.writeClearCoverCache(50),
        50, // Threshold: 50ms for 50 updates
        options
      )
    )

    // Pattern B: Complex Per-Item Logic (will use utility)
    // These have conditional logic or different values per item
    console.log('\n📝 Pattern B: Complex Per-Item Logic (utility candidates)')

    results.push(
      this.benchmark(
        'batchUpsertManga(10)',
        'Pattern B',
        () => this.writeBatchUpsert(10),
        25, // Threshold: 25ms for 10 upserts
        options
      )
    )

    results.push(
      this.benchmark(
        'batchUpsertManga(50)',
        'Pattern B',
        () => this.writeBatchUpsert(50),
        100, // Threshold: 100ms for 50 upserts
        options
      )
    )

    results.push(
      this.benchmark(
        'batchDeleteDownloads(10)',
        'Pattern B',
        () => this.writeBatchDelete(10),
        20, // Threshold: 20ms for 10 deletes
        options
      )
    )

    results.push(
      this.benchmark(
        'batchDeleteDownloads(50)',
        'Pattern B',
        () => this.writeBatchDelete(50),
        80, // Threshold: 80ms for 50 deletes
        options
      )
    )

    // Transaction vs Individual Comparison
    console.log('\n📝 Transaction vs Individual Operations')

    results.push(
      this.benchmark(
        'singleUpdate x 3 (individual)',
        'Comparison',
        () => this.writeSingleUpdates(3),
        10, // Threshold: 10ms for 3 individual
        options
      )
    )

    results.push(
      this.benchmark(
        'batchUpdate x 3 (transaction)',
        'Comparison',
        () => this.writeUpdateCoverCache(3),
        5, // Threshold: 5ms for 3 in transaction
        options
      )
    )

    const endTime = performance.now()
    const totalTime = Math.round(endTime - startTime)

    // Calculate summary
    const passed = results.filter((r) => r.status === 'pass').length
    const warnings = results.filter((r) => r.status === 'warn').length
    const failed = results.filter((r) => r.status === 'fail').length

    const summary: WriteBenchmarkSummary = {
      totalOperations: results.length,
      passed,
      warnings,
      failed,
      totalTime,
      results,
      metadata: {
        timestamp: new Date().toISOString(),
        iterations: options.iterations ?? 10,
        notes:
          'Baseline write benchmarks before batch operation refactoring. Pattern A = inArray candidates, Pattern B = utility candidates.'
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
   * Initialize test data references from seeded database
   */
  private initializeTestData(): void {
    // Get sample manga IDs for updates
    const mangaRows = this.db
      .select({ id: schema.manga.mangaId })
      .from(schema.manga)
      .limit(200) // Get enough for 100-item batches
      .all()

    this.testMangaIds = mangaRows.map((row) => row.id)
    this.log(`Loaded ${this.testMangaIds.length} test manga IDs`)

    // Get sample chapter IDs for downloads
    const chapterRows = this.db
      .select({ id: schema.chapterDownloads.chapterId })
      .from(schema.chapterDownloads)
      .limit(100)
      .all()

    this.testChapterIds = chapterRows.map((row) => row.id)
    this.log(`Loaded ${this.testChapterIds.length} test chapter download IDs`)
  }

  /**
   * Pattern A Benchmark: updateCoverCachedDate (transaction loop - CURRENT approach)
   * Matches: MangaRepository.updateCoverCachedDate()
   */
  private writeUpdateCoverCache(count: number): void {
    const now = new Date()
    const mangaIds = this.testMangaIds.slice(0, count)

    // Exact match of current repository implementation
    this.db.transaction((tx) => {
      for (const id of mangaIds) {
        tx.update(schema.manga)
          .set({
            coverCachedAt: now,
            updatedAt: now
          })
          .where(eq(schema.manga.mangaId, id))
          .run()
      }
    })
  }

  /**
   * Pattern A Benchmark: clearCachedCoverDate (transaction loop - CURRENT approach)
   * Matches: MangaRepository.clearCachedCoverDate()
   */
  private writeClearCoverCache(count: number): void {
    const now = new Date()
    const mangaIds = this.testMangaIds.slice(0, count)

    // Exact match of current repository implementation
    this.db.transaction((tx) => {
      for (const id of mangaIds) {
        tx.update(schema.manga)
          .set({
            coverCachedAt: undefined,
            updatedAt: now
          })
          .where(eq(schema.manga.mangaId, id))
          .run()
      }
    })
  }

  /**
   * Pattern B Benchmark: batchUpsertManga (transaction with different values)
   * Matches: MangaRepository.batchUpsertManga()
   */
  private writeBatchUpsert(count: number): void {
    const now = new Date()
    const mangaIds = this.testMangaIds.slice(0, count)

    // Simulate different values for each manga (realistic scenario)
    const mangaData = mangaIds.map((id, index) => ({
      mangaId: id,
      title: `Benchmark Manga ${index}`,
      coverUrl: `https://example.com/cover/${id}.jpg`,
      description: `Description for manga ${index}`,
      status: 'ongoing' as PublicationStatus,
      contentRating: 'safe' as const,
      publicationDemographic: 'shounen' as const
    }))

    // Exact match of current repository implementation
    this.db.transaction((tx) => {
      for (const data of mangaData) {
        tx.insert(schema.manga)
          .values({
            ...data,
            addedAt: now,
            updatedAt: now,
            lastAccessedAt: now
          })
          .onConflictDoUpdate({
            target: schema.manga.mangaId,
            set: {
              ...data,
              updatedAt: now,
              lastAccessedAt: now
            }
          })
          .run()
      }
    })
  }

  /**
   * Pattern B Benchmark: batchDeleteDownloads (conditional per item)
   * Matches: ChapterDownloadsRepository.batchDeleteDownloads()
   */
  private writeBatchDelete(count: number): void {
    const chapterIds = this.testChapterIds.slice(0, count)

    // Simulate mix of permanent and soft deletes (realistic scenario)
    const commands = chapterIds.map((id, index) => ({
      chapterId: id,
      isDeletePermanent: index % 3 === 0 // 33% permanent, 67% soft delete
    }))

    // Exact match of current repository implementation
    this.db.transaction((tx) => {
      for (const command of commands) {
        if (command.isDeletePermanent) {
          tx.delete(schema.chapterDownloads)
            .where(eq(schema.chapterDownloads.chapterId, command.chapterId))
            .run()
        } else {
          tx.update(schema.chapterDownloads)
            .set({ isHidden: true })
            .where(eq(schema.chapterDownloads.chapterId, command.chapterId))
            .run()
        }
      }
    })
  }

  /**
   * Individual Updates (no transaction) - for comparison
   */
  private writeSingleUpdates(count: number): void {
    const now = new Date()
    const mangaIds = this.testMangaIds.slice(0, count)

    // Individual updates outside transaction
    for (const id of mangaIds) {
      this.db
        .update(schema.manga)
        .set({
          coverCachedAt: now,
          updatedAt: now
        })
        .where(eq(schema.manga.mangaId, id))
        .run()
    }
  }

  /**
   * Print benchmark summary to console
   */
  printSummary(summary: WriteBenchmarkSummary): void {
    console.log('\n' + '═'.repeat(70))
    console.log('Write Benchmark Results Summary')
    console.log('═'.repeat(70))

    console.log(`\nTotal Operations: ${summary.totalOperations}`)
    console.log(`✅ Passed:        ${summary.passed}`)
    console.log(`⚠️  Warnings:      ${summary.warnings}`)
    console.log(`❌ Failed:        ${summary.failed}`)
    console.log(`⏱️  Total Time:    ${summary.totalTime}ms`)

    console.log('\n' + '-'.repeat(70))
    console.log('Detailed Results')
    console.log('-'.repeat(70))

    // Group by category
    const categories = ['Pattern A', 'Pattern B', 'Comparison']

    for (const category of categories) {
      const categoryResults = summary.results.filter((r) => r.view === category)
      if (categoryResults.length === 0) continue

      console.log(`\n${category}:`)
      for (const result of categoryResults) {
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

    // Analysis notes
    console.log('\n📊 Analysis Notes:')
    console.log('   - Pattern A operations are candidates for inArray() optimization')
    console.log('   - Pattern B operations will use batch utility wrapper')
    console.log('   - Compare these baseline numbers with post-refactor benchmarks')

    // Overall status
    if (summary.failed > 0) {
      console.log('\n❌ BENCHMARK FAILED: Some operations exceed performance thresholds')
    } else if (summary.warnings > 0) {
      console.log('\n⚠️  BENCHMARK WARNING: Some operations are approaching thresholds')
    } else {
      console.log('\n✅ ALL BENCHMARKS PASSED')
    }

    console.log('═'.repeat(70) + '\n')
  }

  /**
   * Save benchmark results to JSON file
   */
  private saveResults(summary: WriteBenchmarkSummary, filename: string): void {
    try {
      const path = require('node:path')
      const fs = require('node:fs')
      const filePath = path.resolve(filename)
      const dir = path.dirname(filePath)

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const json = JSON.stringify(summary, null, 2)
      fs.writeFileSync(filePath, json, 'utf-8')
      console.log(`\n📁 Baseline results saved to: ${filePath}`)
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
