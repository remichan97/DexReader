/**
 * Write Benchmark CLI Runner
 *
 * Runs write performance benchmarks on the benchmark database to establish
 * baseline before batch operation refactoring.
 *
 * Usage:
 *   npm run benchmark:write                           # Auto-saves to benchmark-results/
 *   npm run benchmark:write -- --iterations 20        # More iterations
 *   npm run benchmark:write -- --output custom.json   # Custom filename
 *   npm run benchmark:write -- --verbose              # Detailed logs
 *
 * Options:
 *   --iterations <count>  Number of iterations per operation (default: 10)
 *   --warmup <count>      Number of warmup iterations (default: 2)
 *   --output <filename>   Save to benchmark-results/ folder (auto-timestamped by default)
 *   --verbose             Show detailed progress logs
 *
 * Note: Requires benchmark database created via 'npm run seed:benchmark'
 */

import { DatabaseTestHelper } from '../shared/database-helpers'
import { WriteBenchmarks } from './write-benchmarks'
import * as schema from '../../../database/schemas'
import { sql } from 'drizzle-orm'
import fs from 'node:fs'

interface ScriptOptions {
  iterations: number
  warmup: number
  output: string // Always has a default (timestamped filename)
  verbose: boolean
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)
  
  // Default output to benchmark-results/ folder with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const defaultOutput = `benchmark-results/write-baseline-${timestamp}.json`
  
  const options: ScriptOptions = {
    iterations: 10,
    warmup: 2,
    output: defaultOutput,
    verbose: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--iterations':
      case '-i':
        options.iterations = Number.parseInt(args[++i], 10)
        break
      case '--warmup':
      case '-w':
        options.warmup = Number.parseInt(args[++i], 10)
        break
      case '--output':
      case '-o':
        options.output = args[++i]
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
Write Benchmark Script

Runs write performance benchmarks to establish baseline before refactoring.
Requires benchmark database created via 'npm run seed:benchmark'.

Usage:
  npm run benchmark:write                              # Use defaults (saves to benchmark-results/)
  npm run benchmark:write -- --iterations 20           # More iterations
  npm run benchmark:write -- --output custom-name.json # Custom filename
  npm run benchmark:write -- --verbose                 # Detailed logs

Options:
  --iterations <count>  Number of iterations per operation (default: 10)
  --warmup <count>      Number of warmup iterations (default: 2)
  --output <filename>   Save results to JSON file in benchmark-results/ folder
                        (default: write-baseline-<timestamp>.json)
  --verbose             Show detailed progress logs
  --help                Show this help message

Examples:
  # Run baseline benchmarks (auto-saves to benchmark-results/)
  npm run benchmark:write

  # Run with custom output name
  npm run benchmark:write -- --output write-optimized.json

  # Compare results
  diff benchmark-results/write-baseline-*.json benchmark-results/write-optimized.json
  `)
}

async function main(): Promise<void> {
  const options = parseArgs()

  console.log('\n🔧 Initializing benchmark database...')

  // Initialize database helper (connects to benchmark DB)
  const dbHelper = new DatabaseTestHelper({
    cleanStart: false // Don't delete existing benchmark database
  })

  // Initialize the database connection
  dbHelper.init()

  // Check if benchmark database exists and has data
  const dbPath = dbHelper.getDbPath()
  if (!fs.existsSync(dbPath)) {
    console.error(`\n❌ Benchmark database not found at: ${dbPath}`)
    console.error('   Run "npm run seed:benchmark" first to create test data.')
    dbHelper.close()
    process.exit(1)
  }

  const db = dbHelper.getDb()

  // Quick sanity check: verify database has data
  const mangaCountResult = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.manga)
    .get()
  const mangaCount = mangaCountResult?.count ?? 0

  const downloadsCountResult = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.chapterDownloads)
    .get()
  const downloadsCount = downloadsCountResult?.count ?? 0

  if (mangaCount === 0) {
    console.error('\n❌ Benchmark database is empty (no manga found)')
    console.error('   Run "npm run seed:benchmark" to populate test data.')
    dbHelper.close()
    process.exit(1)
  }

  if (downloadsCount === 0) {
    console.error('\n⚠️  Warning: No downloads found in database')
    console.error('   Some benchmarks may be skipped.')
  }

  console.log(`✅ Database ready: ${mangaCount} manga, ${downloadsCount} downloads`)

  // Create benchmark suite
  const benchmarkSuite = new WriteBenchmarks(db)

  // Run benchmarks
  console.log('\n🚀 Starting write benchmarks...\n')

  const summary = benchmarkSuite.runAll({
    iterations: options.iterations,
    warmupIterations: options.warmup,
    verbose: options.verbose,
    saveToFile: options.output // Always defined now
  })

  // Close database connection
  dbHelper.close()

  // Exit with appropriate code
  if (summary.failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

// Execute main function
main().catch((error) => {
  console.error('\n❌ Benchmark script failed:')
  console.error(error)
  process.exit(1)
})
