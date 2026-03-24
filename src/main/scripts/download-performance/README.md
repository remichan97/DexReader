# Download Performance Benchmarking

Performance benchmarking infrastructure for the DexReader download system.

## Overview

This directory contains tools to benchmark download performance at various concurrency levels, helping identify optimal settings for production use.

**Purpose**: Measure download throughput, resource usage, and error handling to ensure production-grade performance (<10 minutes for 100 chapters at optimal concurrency).

**When to Use**:

- When optimizing download concurrency settings
- After changes to download queue, retry logic, or batch operations
- Before production releases to validate performance
- When investigating download performance issues

---

## Quick Start

### 1. Run Benchmarks with Defaults

```bash
npm run benchmark:downloads
```

**What it does**:

- Tests 20 chapters at 5 different concurrency levels (1, 3, 5, 7, 10)
- Runs 3 iterations per concurrency level
- Uses mock API responses for consistent results
- Saves results to `benchmark-results/download-benchmarks.json`
- Recommends optimal concurrency setting

**Expected Runtime**: ~2-3 minutes

### 2. Run All Performance Benchmarks

```bash
npm run benchmark:all
```

Runs database, write, and download benchmarks sequentially.

---

## Benchmark Scenarios

### Concurrency Testing (Default)

Tests download performance at different concurrency levels to find the sweet spot:

**Concurrency Levels**: 1, 3, 5, 7, 10 concurrent downloads
**Chapters per Test**: 20 (configurable with `--chapters`)
**Success Criteria**:

- Optimal concurrency achieves highest throughput with acceptable memory usage
- All tests complete within threshold times
- No database lock contention (zero SQLITE_BUSY errors)
- Memory usage stays below 250 MB peak

**Measured Metrics**:

- **Time**: Average, min, max, P95 completion time (seconds)
- **Throughput**: Chapters downloaded per minute
- **Memory**: Average and peak memory usage (MB)
- **Errors**: Database lock errors, network failures

---

## Options

### Iterations

```bash
npm run benchmark:downloads -- --iterations 5
```

More iterations = more accurate results, but longer runtime.

- **Default**: 3 iterations
- **Recommended**: 3-5 for reliable results
- **Use Case**: Use 5+ iterations for final validation before production

### Chapter Count

```bash
npm run benchmark:downloads -- --chapters 50
```

Test with more chapters for realistic load simulation.

- **Default**: 20 chapters
- **Recommended**: 20 for quick tests, 50-100 for comprehensive profiling
- **Use Case**: Test 100 chapters to validate <10 minute target at optimal concurrency

### Verbose Logging

```bash
npm run benchmark:downloads -- --verbose
```

Shows detailed progress during each iteration.

- **Default**: Off (summary only)
- **Use Case**: Debugging benchmark issues or understanding performance patterns

### Real API Mode (Manual Testing Only)

```bash
npm run benchmark:downloads -- --real-api
```

**⚠️ NOT RECOMMENDED FOR REGULAR USE**

Use real MangaDex API instead of mocks.

- **Default**: Mock mode (consistent, reproducible results)
- **Why avoid**: Results vary wildly based on network speed, geographic location, storage speed, system load
- **Ethical concern**: Hammers MangaDex infrastructure with thousands of requests
- **Use Case**: One-time manual validation only (5-10 chapters max), not for benchmarking

### Combined Options

```bash
npm run benchmark:downloads -- --iterations 5 --chapters 50 --verbose
```

---

## Interpreting Results

### Summary Output

```
Download Benchmark Results Summary
══════════════════════════════════════════════════════════════════════
Total Scenarios: 5
✅ Passed:        5
⚠️  Warnings:      0
❌ Failed:        0
⏱️  Total Time:    45.3s
🎯 Optimal Concurrency: 5

Detailed Results by Concurrency
──────────────────────────────────────────────────────────────────────
✅ Concurrency  1 | Time:  80.25s | Throughput:  14.9 ch/min | Memory:  145MB | Errors: 0
✅ Concurrency  3 | Time:  28.15s | Throughput:  42.6 ch/min | Memory:  180MB | Errors: 0
✅ Concurrency  5 | Time:  18.42s | Throughput:  65.2 ch/min | Memory:  215MB | Errors: 0
⚠️ Concurrency  7 | Time:  15.88s | Throughput:  75.5 ch/min | Memory:  248MB | Errors: 1
❌ Concurrency 10 | Time:  14.21s | Throughput:  84.5 ch/min | Memory:  285MB | Errors: 3

💡 Recommendation:
   Set maxConcurrentDownloads to 5 for optimal performance
   Expected: 65.2 chapters/min, 215MB peak memory
```

### Status Indicators

- ✅ **Pass**: Meets performance threshold, acceptable resource usage
- ⚠️ **Warning**: Near threshold limit OR elevated error count
- ❌ **Fail**: Exceeds threshold OR frequent errors

### Optimal Concurrency

The benchmark automatically recommends optimal concurrency based on:

1. **Throughput**: Higher is better (chapters/minute)
2. **Memory Usage**: Lower is better (<250 MB acceptable)
3. **Error Rate**: Lower is better (DB lock contention, network failures)

**Scoring Formula**: `(throughput / 50 * 100) - (memory / 250 * 50) - (errors * 10)`

### Target Performance

**Production Goal**: Download 100 chapters in <10 minutes with 5 concurrent downloads

**Calculation**:

- 100 chapters / 10 minutes = 10 chapters/minute minimum
- At concurrency 5, expect ~50-70 chapters/minute = <2 minutes for 100 chapters ✅

---

## Output Files

### benchmark-results/download-benchmarks.json

**Format**: JSON with complete benchmark results

```json
{
  "totalScenarios": 5,
  "passed": 5,
  "warnings": 0,
  "failed": 0,
  "totalTime": 45302,
  "optimalConcurrency": 5,
  "results": [
    {
      "scenario": "Download 20 chapters",
      "concurrency": 5,
      "chapterCount": 20,
      "avgTime": 18.42,
      "throughput": 65.2,
      "metadata": {
        "avgMemoryMB": 210,
        "peakMemoryMB": 215,
        "dbErrors": 0,
        "networkErrors": 0
      }
    }
  ]
}
```

**Use Cases**:

- Compare performance across code changes
- Track performance regressions over time
- Generate performance reports
- CI/CD integration (future)

---

## File Structure

```
download-performance/
├── benchmarking/
│   ├── download-benchmarks.ts       # Main benchmark class
│   └── download-benchmark-cli.ts    # CLI runner with arg parsing
└── README.md                         # This file
```

**Related Files**:

- `scripts/run-download-benchmark.js` - Electron wrapper (runs in Electron context)
- `benchmark-results/download-benchmarks.json` - Output file (git-ignored)

---

## When to Re-run Benchmarks

### Always Re-run After

1. **Download System Changes**:
   - Modifications to `DownloadQueueService`
   - Changes to retry logic or concurrency handling
   - Batch operation optimizations
   - Rate limiter adjustments

2. **Database Changes**:
   - Schema changes affecting `chapter_downloads` table
   - Index modifications
   - Batch operation refactoring

3. **Configuration Changes**:
   - Adjusting `maxConcurrentDownloads` default
   - Modifying batch thresholds or timeouts
   - Changing progress update intervals

### Recommended Schedule

- **Before Production Releases**: Validate performance hasn't regressed
- **After Major Refactoring**: Ensure optimizations worked as expected
- **Monthly**: Track performance trends over time

---

## Comparing Results

### Before vs After Changes

1. Save baseline: `npm run benchmark:downloads`
2. Save baseline results: `cp benchmark-results/download-benchmarks.json benchmark-results/download-baseline.json`
3. Make code changes
4. Run benchmarks again: `npm run benchmark:downloads`
5. Compare `download-benchmarks.json` vs `download-baseline.json`

**Key Metrics to Compare**:

- Throughput (higher is better)
- Average time (lower is better)
- Peak memory (lower is better, <250 MB target)
- Error count (should be zero)

---

## Mock Mode vs Real API

### Mock Mode (Default, Recommended)

**What It Tests**:

- ✅ Download queue management and concurrency control
- ✅ Database write performance (chapter_downloads table)
- ✅ Batch operation efficiency
- ✅ Retry logic and error handling
- ✅ Progress tracking and event throttling
- ✅ Memory usage from application state

**What It Doesn't Test**:

- ❌ Network latency and throughput
- ❌ MangaDex API rate limiting
- ❌ Filesystem I/O (disk write speed)
- ❌ Image processing overhead

**Why This Is The Right Approach**:

- **Reproducible**: Same results across runs, devices, locations
- **Fast**: ~2-3 minutes for full suite
- **Ethical**: Doesn't hammer MangaDex servers
- **Actionable**: Measures YOUR code performance, not external factors
- **CI/CD Ready**: Can be automated without external dependencies

### Real API Mode (Manual Validation Only)

**⚠️ Important Limitations**:

- Results vary by **internet speed** (10 Mbps vs 1 Gbps = 100x variance)
- Results vary by **storage speed** (HDD vs NVMe SSD = 10x variance)
- Results vary by **geographic location** (CDN distance affects latency)
- Results vary by **time of day** (network congestion, system load)
- **Not suitable for performance benchmarking** - measures hardware/network, not code

**Ethical Concerns**:

- 100-chapter test = ~1,500-3,000 image requests to MangaDex CDN
- Repeated benchmarking would abuse their infrastructure
- Violates good citizenship principles

**Recommendation**:

- **Use mock mode for all benchmarking** - it measures what matters (your code)
- **Real API for validation only** - one-time test with 5-10 chapters to verify integration works
- **Never automate real API tests** - would be irresponsible and unethical

---

## Troubleshooting

### "Failed to run download benchmarks"

**Cause**: TypeScript compilation error or missing dependencies

**Solution**:

```bash
npm run build
npm run benchmark:downloads
```

### Results Show High Error Rates

**Cause**: Database lock contention or network issues

**Investigation**:

1. Check if concurrency is too high (reduce to 3-5)
2. Review database write benchmark results (`npm run benchmark:write`)
3. Ensure no other processes are using the database

### Memory Usage Exceeds 250 MB

**Cause**: Concurrency too high or memory leak

**Investigation**:

1. Lower concurrency (test with 3-5)
2. Review P5-T02 memory profiling results
3. Check for missing cleanup in download service

### Throughput Lower Than Expected

**Cause**: Network throttling, database bottleneck, or sub-optimal concurrency

**Investigation**:

1. Test different concurrency levels (the benchmark does this automatically)
2. Check database performance (`npm run benchmark:db`)
3. Review rate limiter configuration

---

## Integration with CI/CD (Future)

### Planned Features

- Automated benchmarks on pull requests
- Performance regression detection
- Baseline comparison reports
- Historical performance tracking

### P5-T12 Integration

These benchmarks will be integrated into the unit testing framework (Vitest) planned for P5-T12, allowing:

- Automated performance testing in CI pipeline
- Performance assertions in test suites
- Regression prevention

---

## Related Documentation

- **P5-T03 Plan**:Is The Right Tool

**Performance benchmarking should measure YOUR code, not external factors.**

Mock mode isolates what you control:

- Queue concurrency management → Your DownloadQueueService logic
- Database write patterns → Your batch operations and transactions
- Memory management → Your state tracking and cleanup
- Error handling → Your retry logic and circuit breakers

Real API would add noise from things you DON'T control:

- User's internet speed (10 Mbps vs 1 Gbps)
- User's storage speed (HDD vs SSD)
- Geographic distance to CDN
- Network congestion at test time
- MangaDex server load at test time

**Result**: Mock mode gives actionable insights. Real API gives meaningless variance

### Why Electron Context?

Download services use `better-sqlite3` which is compiled specifically for Electron's Node.js version. Running benchmarks in native Node.js would fail with binary compatibility errors.

### Why Mock Mode by Default?

Real API testing introduces variability that makes it difficult to:

- Identify performance regressions (is it our code or the network?)
- Compare results across runs (network speed varies)
- Run in CI/CD pipelines (requires network, may hit rate limits)

Mock mode provides consistent, reproducible results for reliable performance tracking.

### Warmup Iterations

The first iteration may be slower due to:

- JIT compilation warm-up
- Database query plan caching
- Memory allocation patterns

Warmup iterations (default: 1) are excluded from timing to ensure accurate results.

---

**Created**: 23 March 2026 (P5-T03 Phase 1)
**Last Updated**: 23 March 2026
**Status**: Active (baseline benchmarks pending)
