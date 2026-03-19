# Database Performance Testing

**Status**: ✅ Production-Ready (Validated: 19 March 2026)

This directory contains tools for validating database query performance. These are **one-time validation tools**, not ongoing CI/CD checks.

## Performance Validation Results

**Baseline Established**: 19 March 2026

| Query View | Method | Avg Time | Status | Index Usage |
|------------|--------|----------|--------|-------------|
| Library | getLibraryManga() | 5.97ms | ✅ Pass | idx_chapter_manga_downloads |
| Library | getLibraryManga({search}) | 2.04ms | ✅ Pass | idx_chapter_manga_downloads |
| History | getAllProgressWithMetadata() | 1.45ms | ✅ Pass | Primary keys (manga, chapter) |
| Downloads | getAllDownloads() | 1.21ms | ✅ Pass | Primary keys (manga, chapter) |
| Collections | getAllCollectionsWithMetadata() | 0.80ms | ✅ Pass | COVERING INDEX (optimal!) |
| Reader | getChaptersByMangaId() | 0.32ms | ✅ Pass | idx_chapter_manga |
| Cleanup | cleanupMangaCache() | 0.86ms | ✅ Pass | idx_manga_favourite, idx_chapter_status_downloads |

**Key Findings:**

- ✅ 100% index usage - zero table scans
- ✅ All queries 88-99% faster than thresholds
- ✅ One covering index for optimal performance
- ✅ Production-ready for large datasets (1000+ manga, 10,000+ chapters)

**Artifacts** (saved to `benchmark-results/` - git-ignored):

- `benchmark-results/benchmark-baseline.json` - Baseline performance measurements
- `benchmark-results/query-plan-analysis.json` - EXPLAIN QUERY PLAN analysis

---

## Directory Structure

```
database-performance/
├── seeding/              # Test data generation
│   ├── seed-database.ts  # DatabaseSeeder class (reusable)
│   └── seed-cli.ts       # CLI runner for seeding
├── benchmarking/         # Performance measurement
│   ├── benchmark-suite.ts # DatabaseBenchmark class (reusable)
│   └── benchmark-cli.ts   # CLI runner for benchmarks
├── analysis/             # Query plan analysis
│   └── analyze-query-plans.ts # EXPLAIN QUERY PLAN tool
├── shared/               # Common utilities
│   └── database-helpers.ts    # DatabaseTestHelper class
└── README.md             # This file
```

**Electron Wrappers** (root `/scripts/`):

- `run-seed.js` - Electron wrapper for seeding
- `run-benchmark.js` - Electron wrapper for benchmarks
- `run-analyze-plans.js` - Electron wrapper for query analysis

---

## Usage

### Quick Start

```bash
# 1. Seed test database (17 seconds)
npm run seed:benchmark

# 2. Run benchmarks (0.4 seconds)
npm run benchmark:db

# 3. Analyze query plans
npm run analyze:plans
```

### Detailed Options

#### Seeding

```bash
# Default: 1000 manga, 10,000 chapters
npm run seed:benchmark

# Custom dataset
npm run seed:benchmark -- --manga 5000 --chapters 50000

# Clean start (delete existing database)
npm run seed:benchmark -- --clean

# Verbose output
npm run seed:benchmark -- --verbose
```

**Options:**

- `--manga <count>` - Number of manga (default: 1000)
- `--chapters <count>` - Number of chapters (default: 10000)
- `--collections <count>` - Number of collections (default: 5)
- `--downloads <count>` - Download records (default: 200)
- `--progress <count>` - Progress records (default: 300)
- `--clean` - Delete existing database
- `--verbose` - Show detailed logs

#### Benchmarking

```bash
# Run with default settings (10 iterations)
npm run benchmark:db

# Save to benchmark-results folder (git-ignored)
npm run benchmark:db -- --output benchmark-results/my-benchmark.json

# More iterations for accuracy
npm run benchmark:db -- --iterations 20

# Verbose output
npm run benchmark:db -- --verbose
```

**Options:**

- `--output <file>` - Save results to JSON (default: none, use benchmark-results/ folder)
- `--iterations <count>` - Test iterations (default: 10)
- `--warmup <count>` - Warmup runs (default: 2)
- `--verbose` - Show detailed progress

#### Query Plan Analysis

```bash
# Analyze all queries and save report
npm run analyze:plans
```

**Output:**

- Console: Formatted analysis with index usage
- File: `benchmark-results/query-plan-analysis.json`

---

## When to Re-run

These are **one-time validation tools**. Re-run when:

### ✅ Recommended Times

1. **Before Major Releases** (quarterly)
   - Validate no performance regressions
   - Update baseline if changes are acceptable
   - Document any intentional changes

2. **Major Database Refactoring**
   - Schema redesigns
   - Migration from SQLite to different database
   - Changing ORM framework

3. **Adding Complex New Features**
   - New views with multiple JOINs
   - Aggregation-heavy features
   - Large dataset operations

4. **Performance Issues Reported**
   - User reports slowness
   - Validate with realistic data
   - Compare to baseline

### ❌ Don't Run For

- ❌ Every commit (maintenance overhead too high)
- ❌ Every PR (benchmarks drift from code changes)
- ❌ CI/CD pipeline (better alternatives exist)

---

## Why Not CI/CD Integration?

**Decision**: Tests remain **local/on-demand only**

**Reasons:**

1. **Maintenance Burden** - Benchmarks must be manually updated when repository code changes
2. **Drift Risk** - Easy for benchmarks to become outdated and show misleading results
3. **Database is Stable** - Already validated, unlikely to regress without schema changes
4. **Better Alternatives Exist**:
   - Integration tests with query counting (catches N+1 problems)
   - Migration reviews (catches missing indexes)
   - Production monitoring (tracks real-world performance)

**Better ROI**: Focus testing effort on integration tests (P5-T12) and production monitoring.

---

## Technical Notes

### Electron Runtime Requirement

**Why**: better-sqlite3 is a native addon compiled for Electron's Node.js version (v24, MODULE_VERSION 145). Cannot run in pure Node.js context.

**Solution**: Electron wrappers use `ELECTRON_RUN_AS_NODE=1` to spawn tsx through Electron's bundled Node.js.

### Benchmark Accuracy

**Critical**: Benchmark queries **must match** actual repository implementations, including:

- Complex JOINs (LEFT JOIN, INNER JOIN)
- Aggregations (COUNT, MAX)
- GROUP BY clauses
- Explicit column selection
- WHERE conditions

**Lesson Learned**: Initial benchmarks used simplified queries (SELECT * from single tables) which showed misleading performance. All queries were rewritten to match production complexity.

### Database Schema

SQLite uses **snake_case** column names (`manga_id`, `is_favourite`) while Drizzle ORM uses **camelCase** in TypeScript (`mangaId`, `isFavourite`). When writing raw SQL, use snake_case.

---

## Integration with Testing (Future)

These tools are designed to be reusable:

**Phase 5 - T12 (Testing & Quality Assurance)**:

- `DatabaseSeeder` → Can be imported by integration tests
- `DatabaseBenchmark` → Can be integrated into test suites
- `DatabaseTestHelper` → Shared test database utilities

**Example Integration**:

```typescript
// In integration tests
import { DatabaseSeeder } from '@/main/scripts/database-performance/seeding/seed-database'
import { DatabaseTestHelper } from '@/main/scripts/database-performance/shared/database-helpers'

describe('MangaRepository Performance', () => {
  const helper = new DatabaseTestHelper()
  const seeder = new DatabaseSeeder(helper.getDb())

  beforeAll(() => {
    helper.init()
    seeder.seed({ manga: 100, chapters: 1000 })
  })

  it('should not have N+1 query problem', () => {
    // Test implementation
  })
})
```

---

## Artifacts Location

**Generated files** (saved to `benchmark-results/` - git-ignored for local reference):

- `dexreader-benchmark.db` - Test database (root)
- `benchmark-results/benchmark-baseline.json` - Baseline performance measurements
- `benchmark-results/query-plan-analysis.json` - Query plan analysis
- `benchmark-results/*.json` - Any custom benchmark outputs

**Why git-ignored?**
Benchmark results are local reference data that can be regenerated anytime. Keeping them out of version control reduces repository size and avoids unnecessary commits when re-running validations.

---

## References

- **Task**: P5-T01 Database Query Optimization & Indexing
- **Plan**: `.github/copilot-plans/p5-t01-database-optimization-plan.md`
- **Completion Report**: `.github/memory-bank/p5-t01-baseline-complete.md`
- **Date Completed**: 19 March 2026

---

## Quick Reference

```bash
# Complete validation workflow
npm run seed:benchmark                                              # ~17 seconds
npm run benchmark:db -- --output benchmark-results/baseline.json    # ~0.4 seconds
npm run analyze:plans                                                # ~1 second

# Compare results
# (Manual comparison of JSON files in benchmark-results/)
```

**Expected Results**: All queries should be <10ms with 100% index usage.
