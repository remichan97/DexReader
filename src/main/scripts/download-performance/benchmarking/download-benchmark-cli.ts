/**
 * Download Performance Benchmark Script
 *
 * Runs performance benchmarks on the download system at various concurrency levels.
 * Uses mock API responses for consistent, reproducible results.
 *
 * Usage:
 *   npm run benchmark:downloads                          # Run with defaults
 *   npm run benchmark:downloads -- --iterations 5        # More iterations for accuracy
 *   npm run benchmark:downloads -- --verbose             # Show detailed progress
 *   npm run benchmark:downloads -- --chapters 50         # Test with 50 chapters
 *   npm run benchmark:downloads -- --real-api            # Use real API (not recommended)
 *
 * Options:
 *   --iterations <count>  Number of iterations per concurrency level (default: 3)
 *   --warmup <count>      Number of warmup iterations (default: 1)
 *   --verbose             Show detailed progress logs
 *   --chapters <count>    Number of chapters to download per test (default: 20)
 *   --real-api            Use real MangaDex API instead of mocks (slower, variable)
 *
 * Output: benchmark-results/download-benchmarks.json (git-ignored)
 * Note: Mock mode ensures consistent results independent of network conditions
 */

import { DownloadBenchmark } from './download-benchmarks'
import path from 'node:path'

interface ScriptOptions {
  iterations: number
  warmup: number
  verbose: boolean
  chapters: number
  mockMode: boolean
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)

  const options: ScriptOptions = {
    iterations: 3,
    warmup: 1,
    verbose: false,
    chapters: 20,
    mockMode: true
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
      case '--chapters':
      case '-c':
        options.chapters = Number.parseInt(args[++i], 10)
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--real-api':
        options.mockMode = false
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
Download Performance Benchmark Script

Runs performance benchmarks on the download system at various concurrency levels.
Tests with mock API responses for consistent, reproducible results.

Usage:
  npm run benchmark:downloads                              # Use defaults
  npm run benchmark:downloads -- --iterations 5            # More iterations
  npm run benchmark:downloads -- --verbose                 # Detailed logs
  npm run benchmark:downloads -- --chapters 50             # Test 50 chapters
  npm run benchmark:downloads -- --real-api                # Use real API (not recommended)

Options:
  --iterations, -i <count>   Number of iterations per concurrency (default: 3)
  --warmup, -w <count>       Number of warmup iterations (default: 1)
  --chapters, -c <count>     Number of chapters per test (default: 20)
  --verbose, -v              Show detailed progress logs
  --real-api                 Use real MangaDex API instead of mocks
  --help, -h                 Show this help message

Output:
  Results are saved to benchmark-results/download-benchmarks.json (git-ignored)

Examples:
  # Quick test with defaults (3 iterations, 20 chapters, 5 concurrency levels)
  npm run benchmark:downloads

  # Comprehensive test (more iterations, more chapters)
  npm run benchmark:downloads -- --iterations 5 --chapters 50 --verbose

  # Fast test (fewer chapters)
  npm run benchmark:downloads -- --chapters 10

Note:
  - Mock mode (default) ensures consistent results independent of network
  - Real API mode is slower and results vary based on network conditions
  - Benchmark tests concurrency levels: 1, 3, 5, 7, 10
`)
}

async function main(): Promise<void> {
  const options = parseArgs()

  console.log('Download Performance Benchmark Suite')
  console.log('─'.repeat(70))
  console.log(`Mode: ${options.mockMode ? 'Mock API (consistent results)' : 'Real API (variable)'}`)
  console.log(`Iterations: ${options.iterations} (warmup: ${options.warmup})`)
  console.log(`Chapters per test: ${options.chapters}`)
  console.log(`Output: benchmark-results/download-benchmarks.json`)
  console.log('')

  if (!options.mockMode) {
    console.warn(
      '⚠️  WARNING: Real API mode is slower and results will vary with network conditions'
    )
    console.warn('⚠️  Mock mode is recommended for consistent, reproducible benchmarks')
    console.log('')
  }

  try {
    // Create benchmark instance
    const benchmark = new DownloadBenchmark()

    // Run all benchmarks
    const summary = await benchmark.runAll({
      iterations: options.iterations,
      warmupIterations: options.warmup,
      verbose: options.verbose,
      chapterCount: options.chapters,
      mockMode: options.mockMode,
      saveToFile: 'benchmark-results/download-benchmarks.json'
    })

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

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
