/**
 * Console Test Helper for Cache Metrics
 *
 * Paste this into DevTools Console to test the cache metrics API.
 *
 * Usage:
 * 1. Open DexReader
 * 2. Open DevTools (F12 or Ctrl+Shift+I)
 * 3. Paste this entire file into the Console
 * 4. Use the functions below
 */

// Pretty print cache metrics
async function printCacheMetrics() {
  try {
    const response = await window.storage.getImageCacheMetrics()

    if (!response.success || !response.data) {
      console.error('❌ Failed to get cache metrics:', response.error)
      return
    }

    const metrics = response.data

    console.clear()
    console.log('%c📊 IMAGE CACHE METRICS', 'font-size: 20px; font-weight: bold; color: #4CAF50;')
    console.log('')

    // Chapter Cache
    console.log('%c📖 CHAPTER CACHE', 'font-size: 16px; font-weight: bold; color: #2196F3;')
    console.log('─'.repeat(70))
    console.table({
      'Total Requests': metrics.chapterCache.totalRequests,
      'Memory Hits': `${metrics.chapterCache.memoryHit} (${metrics.chapterCache.memoryHitRate?.toFixed(2)}%)`,
      'Disk Hits': `${metrics.chapterCache.diskHit} (${metrics.chapterCache.diskHitRate?.toFixed(2)}%)`,
      'Network Misses': metrics.chapterCache.miss,
      'Overall Hit Rate': `${metrics.chapterCache.hitRate?.toFixed(2)}%`,
      'LRU Evictions': metrics.chapterCache.lruEviction,
      'TTL Cleanups': metrics.chapterCache.expiryCleanup,
      'Cache Size': `${(metrics.chapterCache.currentSize / 1024 / 1024).toFixed(2)} MB / ${(metrics.chapterCache.maxSize / 1024 / 1024).toFixed(2)} MB`
    })

    console.log('')

    // Cover Cache
    console.log('%c🖼️  COVER CACHE', 'font-size: 16px; font-weight: bold; color: #FF9800;')
    console.log('─'.repeat(70))
    console.table({
      'Total Requests': metrics.coverCache.totalRequests,
      'Memory Hits': `${metrics.coverCache.memoryHit} (${metrics.coverCache.memoryHitRate?.toFixed(2)}%)`,
      'Disk Hits': `${metrics.coverCache.diskHit} (${metrics.coverCache.diskHitRate?.toFixed(2)}%)`,
      'Network Misses': metrics.coverCache.miss,
      'Overall Hit Rate': `${metrics.coverCache.hitRate?.toFixed(2)}%`,
      'LRU Evictions': metrics.coverCache.lruEviction,
      'Cache Size': `${(metrics.coverCache.currentSize / 1024 / 1024).toFixed(2)} MB / ${(metrics.coverCache.maxSize / 1024 / 1024).toFixed(2)} MB`
    })

    console.log('')

    // Analysis
    console.log('%c🔍 QUICK ANALYSIS', 'font-size: 16px; font-weight: bold; color: #9C27B0;')
    console.log('─'.repeat(70))

    const chapterHitRate = metrics.chapterCache.hitRate || 0
    const coverHitRate = metrics.coverCache.hitRate || 0

    if (chapterHitRate >= 80 && coverHitRate >= 80) {
      console.log('✅ %cPerformance: EXCELLENT', 'color: #4CAF50; font-weight: bold;')
      console.log('   Cache hit rates above 80% target. No optimization needed.')
    } else if (chapterHitRate >= 60 || coverHitRate >= 60) {
      console.log('⚠️  %cPerformance: GOOD', 'color: #FF9800; font-weight: bold;')
      console.log('   Cache hit rates acceptable but could be improved.')
      if (chapterHitRate < 80) {
        console.log('   • Chapter cache: Consider increasing size or improving preload strategy')
      }
      if (coverHitRate < 80) {
        console.log('   • Cover cache: Consider increasing memory/disk cache size')
      }
    } else {
      console.log('❌ %cPerformance: POOR', 'color: #F44336; font-weight: bold;')
      console.log('   Cache hit rates below 60%. Optimization highly recommended.')
      console.log('   • Increase cache sizes')
      console.log('   • Implement directional preloading')
      console.log('   • Verify cache eviction strategy')
    }

    console.log('')

    // Return raw data for further analysis
    return metrics
  } catch (error) {
    console.error('❌ Error fetching cache metrics:', error)
  }
}

// Simplified version - just the numbers
async function getCacheMetrics() {
  const response = await window.storage.getImageCacheMetrics()
  return response.success ? response.data : null
}

// Monitor metrics over time
async function monitorCacheMetrics(intervalSeconds = 10, durationSeconds = 60) {
  console.log(
    `📊 Monitoring cache metrics for ${durationSeconds}s (sampling every ${intervalSeconds}s)...`
  )
  console.log('')

  const samples = []
  const startTime = Date.now()
  const endTime = startTime + durationSeconds * 1000

  const interval = setInterval(async () => {
    const now = Date.now()

    if (now >= endTime) {
      clearInterval(interval)

      console.log(
        '%c✅ Monitoring complete!',
        'font-size: 16px; font-weight: bold; color: #4CAF50;'
      )
      console.log('')
      console.log('Sample data:')
      console.table(
        samples.map((s, i) => ({
          'Time (s)': i * intervalSeconds,
          'Chapter Hits': s.chapterCache.memoryHit + s.chapterCache.diskHit,
          'Chapter Misses': s.chapterCache.miss,
          'Chapter Hit %': s.chapterCache.hitRate?.toFixed(2) + '%',
          'Cover Hits': s.coverCache.memoryHit + s.coverCache.diskHit,
          'Cover Misses': s.coverCache.miss,
          'Cover Hit %': s.coverCache.hitRate?.toFixed(2) + '%',
          'Cache Size': `${((s.chapterCache.currentSize + s.coverCache.currentSize) / 1024 / 1024).toFixed(2)} MB`
        }))
      )

      return
    }

    const metrics = await getCacheMetrics()
    if (metrics) {
      samples.push(metrics)
      console.log(
        `[${samples.length}/${Math.ceil(durationSeconds / intervalSeconds)}] ` +
          `Chapter: ${metrics.chapterCache.hitRate?.toFixed(1)}% | ` +
          `Cover: ${metrics.coverCache.hitRate?.toFixed(1)}%`
      )
    }
  }, intervalSeconds * 1000)

  // Return stop function
  return () => {
    clearInterval(interval)
    console.log('⏸️  Monitoring stopped')
  }
}

// Export globally
window.cacheMetrics = {
  print: printCacheMetrics,
  get: getCacheMetrics,
  monitor: monitorCacheMetrics
}

console.log(
  '%c✅ Cache Metrics Test Helper Loaded!',
  'font-size: 16px; font-weight: bold; color: #4CAF50;'
)
console.log('')
console.log('Available functions:')
console.log('  • window.cacheMetrics.print() - Pretty print current metrics')
console.log('  • window.cacheMetrics.get() - Get raw metrics data')
console.log('  • window.cacheMetrics.monitor(intervalSeconds, durationSeconds) - Monitor over time')
console.log('')
console.log('Quick start:')
console.log('  await window.cacheMetrics.print()')
console.log('')
