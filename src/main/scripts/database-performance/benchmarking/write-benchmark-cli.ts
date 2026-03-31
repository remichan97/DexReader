/**
 * Write Benchmark CLI Runner
 *
 * Runs write performance benchmarks on the benchmark database.
 * Results are automatically saved to benchmark-results/write-benchmarks.json
 *
 * Usage:
 *   npm run benchmark:write                    # Run benchmarks with defaults
 *   npm run benchmark:write -- --iterations 20 # More iterations for accuracy
 *   npm run benchmark:write -- --verbose       # Show detailed progress
 *
 * Options:
 *   --iterations <count>  Number of iterations per operation (default: 10)
 *   --warmup <count>      Number of warmup iterations (default: 2)
 *   --verbose             Show detailed progress logs
 *
 * Output: benchmark-results/write-benchmarks.json (git-ignored)
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
  verbose: boolean
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)

  const options: ScriptOptions = {
    iterations: 10,
    warmup: 2,
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

Runs write performance benchmarks for batch operations.
Results are automatically saved to benchmark-results/write-benchmarks.json

Requires benchmark database created via 'npm run seed:benchmark'.

Usage:
  npm run benchmark:write                    # Run with defaults
  npm run benchmark:write -- --iterations 20 # More iterations for accuracy
  npm run benchmark:write -- --verbose       # Show detailed progress

Options:
  --iterations <count>  Number of iterations per operation (default: 10)
  --warmup <count>      Number of warmup iterations (default: 2)
  --verbose             Show detailed progress logs
  --help                Show this help message

Output:
  Results saved to: benchmark-results/write-benchmarks.json (git-ignored)

Examples:
  # Run write benchmarks with defaults
  npm run benchmark:write

  # Run with more iterations for accuracy
  npm run benchmark:write -- --iterations 50
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
    saveToFile: 'benchmark-results/write-benchmarks.json'
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
