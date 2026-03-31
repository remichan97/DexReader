/**
 * Database Seeding Script
 *
 * Seeds a separate benchmark database with realistic test data.
 * This script does NOT touch the development database (dexreader-dev.db).
 *
 * Usage:
 *   npm run seed:benchmark -- --manga 1000 --chapters 10000
 *   npm run seed:benchmark -- --clean
 *
 * Options:
 *   --manga <count>       Number of manga to generate (default: 1000)
 *   --chapters <count>    Number of chapters to generate (default: 10000)
 *   --collections <count> Number of collections (default: 5)
 *   --downloads <count>   Number of downloads (default: 200)
 *   --progress <count>    Number of manga with progress (default: 300)
 *   --clean               Clean start (delete existing database)
 *   --verbose             Show detailed progress logs
 */

import { DatabaseTestHelper } from '../shared/database-helpers'
import { DatabaseSeeder } from './seed-database'
import path from 'node:path'

interface ScriptOptions {
  manga: number
  chapters: number
  collections: number
  downloads: number
  progress: number
  clean: boolean
  verbose: boolean
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)
  const options: ScriptOptions = {
    manga: 1000,
    chapters: 10000,
    collections: 5,
    downloads: 200,
    progress: 300,
    clean: false,
    verbose: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--manga':
        options.manga = Number.parseInt(args[++i], 10)
        break
      case '--chapters':
        options.chapters = Number.parseInt(args[++i], 10)
        break
      case '--collections':
        options.collections = Number.parseInt(args[++i], 10)
        break
      case '--downloads':
        options.downloads = Number.parseInt(args[++i], 10)
        break
      case '--progress':
        options.progress = Number.parseInt(args[++i], 10)
        break
      case '--clean':
        options.clean = true
        break
      case '--verbose':
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
Database Seeding Script

Seeds a separate benchmark database with realistic test data.
Database location: ./dexreader-benchmark.db

Usage:
  npm run seed:benchmark                              # Use defaults
  npm run seed:benchmark -- --manga 500 --chapters 5000  # Custom counts
  npm run seed:benchmark -- --clean                  # Clean start

Options:
  --manga <count>       Number of manga to generate (default: 1000)
  --chapters <count>    Number of chapters to generate (default: 10000)
  --collections <count> Number of collections (default: 5)
  --downloads <count>   Number of downloads (default: 200)
  --progress <count>    Number of manga with progress (default: 300)
  --clean               Clean start (delete existing database)
  --verbose             Show detailed progress logs
  --help, -h            Show this help message

Examples:
  npm run seed:benchmark
  npm run seed:benchmark -- --manga 2000 --chapters 20000 --verbose
  npm run seed:benchmark -- --clean --verbose
`)
}

async function main(): Promise<void> {
  console.log('='.repeat(80))
  console.log('DATABASE SEEDING SCRIPT')
  console.log('='.repeat(80))
  console.log('')

  const options = parseArgs()

  // Validate options
  if (options.manga < 1 || options.chapters < 1) {
    console.error('Error: Manga and chapter counts must be at least 1')
    process.exit(1)
  }

  if (options.chapters < options.manga) {
    console.error('Error: Chapters count should be >= manga count for realistic distribution')
    process.exit(1)
  }

  console.log('Configuration:')
  console.log(`  Manga:       ${options.manga}`)
  console.log(`  Chapters:    ${options.chapters}`)
  console.log(`  Collections: ${options.collections}`)
  console.log(`  Downloads:   ${options.downloads}`)
  console.log(`  Progress:    ${options.progress}`)
  console.log(`  Clean Start: ${options.clean}`)
  console.log(`  Verbose:     ${options.verbose}`)
  console.log('')

  // Initialize database
  console.log('Initializing benchmark database...')
  const dbHelper = new DatabaseTestHelper({
    dbPath: path.join(process.cwd(), 'dexreader-benchmark.db'),
    cleanStart: options.clean,
    runMigrations: true
  })

  try {
    dbHelper.init()
    console.log('')

    // Create seeder
    const seeder = new DatabaseSeeder(dbHelper.getDb())

    // Run seeding
    const results = await seeder.seed({
      manga: options.manga,
      chapters: options.chapters,
      collections: options.collections,
      downloads: options.downloads,
      progress: options.progress,
      statistics: true,
      clearExisting: !options.clean, // If not clean start, clear data before seeding
      verbose: options.verbose
    })

    // Display results
    console.log('')
    console.log('='.repeat(80))
    console.log('SEEDING COMPLETED SUCCESSFULLY')
    console.log('='.repeat(80))
    console.log('')
    console.log('Results:')
    console.log(`  Manga:              ${results.manga}`)
    console.log(`  Chapters:           ${results.chapters}`)
    console.log(`  Collections:        ${results.collections}`)
    console.log(`  Collection Items:   ${results.collectionItems}`)
    console.log(`  Downloads:          ${results.downloads}`)
    console.log(`  Manga Progress:     ${results.mangaProgress}`)
    console.log(`  Chapter Progress:   ${results.chapterProgress}`)
    console.log(`  Statistics:         ${results.statistics}`)
    console.log(`  Duration:           ${results.duration}ms`)
    console.log('')

    // Verify record counts
    console.log('Verifying database...')
    const counts = dbHelper.getRecordCounts()
    console.log('Database record counts:')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(25)} ${count}`)
    })
    console.log('')

    console.log(`Database location: ${dbHelper.getDbPath()}`)
    console.log('')
    console.log('Next steps:')
    console.log('  1. Run benchmarks: npm run benchmark:db')
    console.log('  2. Inspect database with DB viewer (e.g., DataGrip, DB Browser for SQLite)')
    console.log('')

    // Close database
    dbHelper.close()

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('='.repeat(80))
    console.error('SEEDING FAILED')
    console.error('='.repeat(80))
    console.error('')
    console.error('Error:', error)
    console.error('')

    dbHelper.close()
    process.exit(1)
  }
}

// Run the script
// eslint-disable-next-line promise/prefer-await-to-then
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
