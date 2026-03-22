/**
 * Database Benchmark Script
 *
 * Runs performance benchmarks on the benchmark database.
 * This script does NOT touch the development database (dexreader-dev.db).
 *
 * Usage:
 *   npm run benchmark:db                           # Auto-saves to benchmark-results/
 *   npm run benchmark:db -- --iterations 20        # More iterations
 *   npm run benchmark:db -- --output custom.json   # Custom filename
 *   npm run benchmark:db -- --verbose              # Detailed logs
 *
 * Options:
 *   --iterations <count>  Number of iterations per query (default: 10)
 *   --warmup <count>      Number of warmup iterations (default: 2)
 *   --output <filename>   Save to benchmark-results/ folder (auto-timestamped by default)
 *   --verbose             Show detailed progress logs
 *
 * Note: Requires benchmark database created via 'npm run seed:benchmark'
 */

import { DatabaseTestHelper } from '../shared/database-helpers'
import { DatabaseBenchmark } from './benchmark-suite'
import path from 'node:path'
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
  const defaultOutput = `benchmark-results/read-baseline-${timestamp}.json`

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
Database Benchmark Script

Runs performance benchmarks on the benchmark database.
Requires benchmark database created via 'npm run seed:benchmark'.

Usage:
  npm run benchmark:db                              # Use defaults (saves to benchmark-results/)
  npm run benchmark:db -- --iterations 20           # More iterations
  npm run benchmark:db -- --output custom-name.json # Custom filename
  npm run benchmark:db -- --verbose                 # Detailed logs

Options:
  --iterations <count>  Number of iterations per query (default: 10)
  --warmup <count>      Number of warmup iterations (default: 2)
  --output <filename>   Save results to JSON file in benchmark-results/ folder
                        (default: read-baseline-<timestamp>.json)
  --verbose             Show detailed progress logs
  --help                Show this help message

Examples:
  # Run read benchmarks (auto-saves to benchmark-results/)
  npm run benchmark:db

  # Run with custom output name
  npm run benchmark:db -- --output read-optimized.json

  # Compare results
  diff benchmark-results/read-baseline-*.json benchmark-results/read-optimized.json

  # Run with more iterations for accurate results
  npm run benchmark:db -- --iterations 50 --verbose
`)
}

async function main(): Promise<void> {
  const options = parseArgs()

  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                  Database Benchmark Runner                         ║
╚════════════════════════════════════════════════════════════════════╝
`)

  // Check if benchmark database exists
  const dbPath = path.join(process.cwd(), 'dexreader-benchmark.db')
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Error: Benchmark database not found!')
    console.error(`   Expected: ${dbPath}`)
    console.error(`   Run 'npm run seed:benchmark' first to create test data.`)
    process.exit(1)
  }

  console.log(`Database: ${dbPath}`)
  console.log(`Iterations: ${options.iterations} (warmup: ${options.warmup})`)
  if (options.output) {
    console.log(`Output: ${options.output}`)
  }
  console.log('')

  try {
    // Initialize database helper (don't run migrations, database already seeded)
    const dbHelper = new DatabaseTestHelper({ dbPath, runMigrations: false })
    dbHelper.init({ runMigrations: false })

    const db = dbHelper.getDb()

    // Create benchmark instance
    const benchmark = new DatabaseBenchmark(db)

    // Run all benchmarks
    const summary = benchmark.runAll({
      iterations: options.iterations,
      warmupIterations: options.warmup,
      verbose: options.verbose,
      saveToFile: options.output // Always defined now
    })

    // Close database
    dbHelper.close()

    // Exit with appropriate code
    if (summary.failed > 0) {
      console.error('\n❌ Benchmark suite failed')
      process.exit(1)
    } else if (summary.warnings > 0) {
      console.warn('\n⚠️  Benchmark suite completed with warnings')
      process.exit(0)
    } else {
      console.log('\n✅ Benchmark suite passed')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Benchmark failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the script
main()
