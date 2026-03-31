/**
 * EXPLAIN QUERY PLAN Analysis
 *
 * Analyzes query execution plans to understand index usage and optimization opportunities.
 * Run this after benchmarking to understand WHY queries perform the way they do.
 */

import { DatabaseTestHelper } from '../shared/database-helpers'
import { DownloadStatus } from '../../../database/enums/download-status.enum'
import { sql } from 'drizzle-orm'
import fs from 'node:fs'
import path from 'node:path'

interface QueryPlan {
  query: string
  view: string
  description: string
  planText: string
  analysis: string[]
}

interface AnalysisReport {
  timestamp: string
  queries: QueryPlan[]
  summary: {
    totalQueries: number
    tableScanCount: number
    indexUsageCount: number
    recommendations: string[]
  }
}

function analyzeQueryPlan(): void {
  console.log('═'.repeat(70))
  console.log('EXPLAIN QUERY PLAN Analysis')
  console.log('═'.repeat(70))

  const helper = new DatabaseTestHelper()
  helper.init()
  const db = helper.getDb()

  const queries: QueryPlan[] = []

  // Get a sample manga ID for testing
  const sampleMangaResult = db.all(sql.raw('SELECT manga_id FROM manga LIMIT 1'))
  const testMangaId =
    sampleMangaResult.length > 0 ? (sampleMangaResult[0] as any).manga_id : 'test-id'

  // 1. Library View Queries
  console.log('\n📚 Library View Queries...')

  // Query 1.1: Get all library manga
  const libraryQuery = `
    SELECT
      manga.*,
      COUNT(CASE WHEN chapter_downloads.status = '${DownloadStatus.Completed}' THEN 1 END) as downloadCount
    FROM manga
    LEFT JOIN chapter_downloads ON manga.manga_id = chapter_downloads.manga_id
    WHERE manga.is_favourite = 1 OR chapter_downloads.status = '${DownloadStatus.Completed}'
    GROUP BY manga.manga_id
  `
  const libraryPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${libraryQuery}`))
  queries.push({
    query: 'getLibraryManga()',
    view: 'Library',
    description: 'Get all favourited manga with download counts',
    planText: formatPlan(libraryPlan),
    analysis: analyzePlanDetail(libraryPlan)
  })

  // Query 1.2: Library search
  const librarySearchQuery = `
    SELECT
      manga.*,
      COUNT(CASE WHEN chapter_downloads.status = '${DownloadStatus.Completed}' THEN 1 END) as downloadCount
    FROM manga
    LEFT JOIN chapter_downloads ON manga.manga_id = chapter_downloads.manga_id
    WHERE (manga.is_favourite = 1 OR chapter_downloads.status = '${DownloadStatus.Completed}')
      AND manga.title LIKE '%Dragon%'
    GROUP BY manga.manga_id
  `
  const librarySearchPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${librarySearchQuery}`))
  queries.push({
    query: 'getLibraryManga({ search })',
    view: 'Library',
    description: 'Search library manga by title',
    planText: formatPlan(librarySearchPlan),
    analysis: analyzePlanDetail(librarySearchPlan)
  })

  // 2. History View Queries
  console.log('📖 History View Queries...')

  const historyQuery = `
    SELECT
      manga_progress.manga_id,
      manga_progress.last_chapter_id,
      manga_progress.first_read_at,
      manga_progress.last_read_at,
      manga.title,
      manga.cover_url,
      manga.status,
      chapter.chapter_number as lastChapterNumber,
      chapter.title as lastChapterTitle,
      chapter.volume as lastChapterVolume,
      chapter.language
    FROM manga_progress
    INNER JOIN manga ON manga_progress.manga_id = manga.manga_id
    LEFT JOIN chapter ON manga_progress.last_chapter_id = chapter.chapter_id
    WHERE manga_progress.last_read_at IS NOT NULL
  `
  const historyPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${historyQuery}`))
  queries.push({
    query: 'getAllProgressWithMetadata()',
    view: 'History',
    description: 'Get reading history with manga/chapter metadata',
    planText: formatPlan(historyPlan),
    analysis: analyzePlanDetail(historyPlan)
  })

  // 3. Downloads View Queries
  console.log('📥 Downloads View Queries...')

  const downloadsQuery = `
    SELECT
      chapter_downloads.*,
      manga.title,
      manga.cover_url,
      chapter.chapter_number,
      chapter.title as chapterTitle
    FROM chapter_downloads
    INNER JOIN manga ON chapter_downloads.manga_id = manga.manga_id
    INNER JOIN chapter ON chapter_downloads.chapter_id = chapter.chapter_id
    WHERE chapter_downloads.is_hidden = 0
  `
  const downloadsPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${downloadsQuery}`))
  queries.push({
    query: 'getAllDownloads()',
    view: 'Downloads',
    description: 'Get all downloads with manga/chapter metadata',
    planText: formatPlan(downloadsPlan),
    analysis: analyzePlanDetail(downloadsPlan)
  })

  // 4. Collections View Queries
  console.log('📂 Collections View Queries...')

  const collectionsQuery = `
    SELECT
      collections.id,
      collections.name,
      COUNT(collection_items.manga_id) as mangaCount,
      MAX(manga.cover_url) as coverUrl
    FROM collections
    LEFT JOIN collection_items ON collections.id = collection_items.collection_id
    LEFT JOIN manga ON collection_items.manga_id = manga.manga_id
    GROUP BY collections.id
  `
  const collectionsPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${collectionsQuery}`))
  queries.push({
    query: 'getAllCollectionsWithMetadata()',
    view: 'Collections',
    description: 'Get collections with manga counts',
    planText: formatPlan(collectionsPlan),
    analysis: analyzePlanDetail(collectionsPlan)
  })

  // 5. Reader View Queries
  console.log('📖 Reader View Queries...')

  const readerQuery = `
    SELECT * FROM chapter
    WHERE manga_id = '${testMangaId}'
  `
  const readerPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${readerQuery}`))
  queries.push({
    query: 'getChaptersByMangaId()',
    view: 'Reader',
    description: 'Get all chapters for a manga',
    planText: formatPlan(readerPlan),
    analysis: analyzePlanDetail(readerPlan)
  })

  // 6. Cleanup Queries
  console.log('🧹 Cleanup Queries...')

  const now = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(now.getDate() - 90)

  const cleanupQuery = `
    SELECT manga.manga_id
    FROM manga
    WHERE manga.is_favourite = 0
      AND manga.last_accessed_at < '${thresholdDate.toISOString()}'
      AND NOT EXISTS (
        SELECT 1 FROM chapter_downloads
        WHERE chapter_downloads.manga_id = manga.manga_id
          AND chapter_downloads.status = '${DownloadStatus.Completed}'
      )
  `
  const cleanupPlan = db.all(sql.raw(`EXPLAIN QUERY PLAN ${cleanupQuery}`))
  queries.push({
    query: 'cleanupMangaCache()',
    view: 'Cleanup',
    description: 'Find stale manga for cleanup',
    planText: formatPlan(cleanupPlan),
    analysis: analyzePlanDetail(cleanupPlan)
  })

  // Generate summary
  const summary = generateSummary(queries)

  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    queries,
    summary
  }

  // Print report
  printReport(report)

  // Save to file (in git-ignored folder)
  const outputDir = 'benchmark-results'
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  const outputFile = path.join(outputDir, 'query-plan-analysis.json')
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2))
  console.log(`\n📁 Analysis saved to: ${outputFile}`)

  helper.close()
}

/**
 * Format query plan for display
 */
function formatPlan(plan: any[]): string {
  return plan.map((row: any) => row.detail || JSON.stringify(row)).join('\n  ')
}

/**
 * Analyze query plan details and extract insights
 */
function analyzePlanDetail(plan: any[]): string[] {
  const insights: string[] = []

  for (const step of plan) {
    const detail = step.detail?.toLowerCase() || ''

    // Check for table scans (bad)
    if (detail.includes('scan table')) {
      const tableName = detail.match(/scan table (\w+)/)?.[1]
      insights.push(`⚠️  SCAN TABLE ${tableName} - No index used (full table scan)`)
    }

    // Check for index usage (good)
    if (detail.includes('search') && detail.includes('using index')) {
      const match = detail.match(/search (\w+) using index (\w+)/)
      if (match) {
        insights.push(`✅ SEARCH ${match[1]} USING INDEX ${match[2]}`)
      }
    }

    // Check for covering index (very good)
    if (detail.includes('using covering index')) {
      const indexName = detail.match(/using covering index (\w+)/)?.[1]
      insights.push(`✨ COVERING INDEX ${indexName} - No table access needed`)
    }

    // Check for automatic index (okay, but custom index would be better)
    if (detail.includes('automatic')) {
      insights.push(`ℹ️  AUTOMATIC INDEX - Consider creating explicit index`)
    }

    // Check for temp B-tree (potentially slow)
    if (detail.includes('use temp b-tree')) {
      insights.push(`⚠️  TEMP B-TREE - Sorting/grouping without index`)
    }
  }

  if (insights.length === 0) {
    insights.push('ℹ️  No significant insights from plan')
  }

  return insights
}

/**
 * Generate summary statistics and recommendations
 */
function generateSummary(queries: QueryPlan[]): AnalysisReport['summary'] {
  let tableScanCount = 0
  let indexUsageCount = 0
  const recommendations: string[] = []

  for (const query of queries) {
    for (const insight of query.analysis) {
      if (insight.includes('SCAN TABLE')) {
        tableScanCount++
      }
      if (insight.includes('USING INDEX') || insight.includes('COVERING INDEX')) {
        indexUsageCount++
      }
    }
  }

  // Generate recommendations
  if (tableScanCount > 0) {
    recommendations.push(
      `Found ${tableScanCount} table scans - consider adding indexes on frequently queried columns`
    )
  }

  if (indexUsageCount < queries.length) {
    recommendations.push(
      'Not all queries are using indexes - review query plans for optimization opportunities'
    )
  }

  // Check for specific optimization opportunities
  const libraryQuery = queries.find((q) => q.query === 'getLibraryManga()')
  if (libraryQuery?.analysis.some((a) => a.includes('SCAN TABLE'))) {
    recommendations.push(
      'Library query: Consider composite index on manga(isFavourite, lastAccessedAt)'
    )
  }

  const downloadsQuery = queries.find((q) => q.query === 'getAllDownloads()')
  if (downloadsQuery?.analysis.some((a) => a.includes('SCAN TABLE'))) {
    recommendations.push(
      'Downloads query: Consider indexes on chapter_downloads(mangaId, status, isHidden)'
    )
  }

  return {
    totalQueries: queries.length,
    tableScanCount,
    indexUsageCount,
    recommendations
  }
}

/**
 * Print formatted report to console
 */
function printReport(report: AnalysisReport): void {
  console.log('\n' + '═'.repeat(70))
  console.log('Query Plan Analysis Report')
  console.log('═'.repeat(70))

  // Print each query's plan
  for (const query of report.queries) {
    console.log(`\n${query.view}: ${query.query}`)
    console.log(`Description: ${query.description}`)
    console.log('Analysis:')
    for (const insight of query.analysis) {
      console.log(`  ${insight}`)
    }
    console.log('\nDetailed Plan:')
    console.log(`  ${query.planText}`)
  }

  // Print summary
  console.log('\n' + '═'.repeat(70))
  console.log('Summary')
  console.log('═'.repeat(70))
  console.log(`Total Queries Analyzed: ${report.summary.totalQueries}`)
  console.log(`Table Scans: ${report.summary.tableScanCount}`)
  console.log(`Index Usage: ${report.summary.indexUsageCount}`)

  if (report.summary.recommendations.length > 0) {
    console.log('\n📋 Recommendations:')
    for (const rec of report.summary.recommendations) {
      console.log(`  • ${rec}`)
    }
  } else {
    console.log('\n✅ All queries are well-optimized!')
  }

  console.log('═'.repeat(70))
}

// Run analysis
analyzeQueryPlan()
