/**
 * Cache Performance Analysis Script
 *
 * This script analyzes the image cache performance by:
 * 1. Starting the Electron app
 * 2. Simulating user workflows
 * 3. Collecting cache metrics via IPC
 * 4. Generating a performance report
 *
 * Usage: node scripts/analyze-cache-performance.js
 */

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const WORKFLOWS = {
  browseLibrary: {
    name: 'Browse Library',
    description: 'Scroll through library with 100+ manga',
    duration: 30000, // 30 seconds
    expectedImages: 100
  },
  readChapterSingle: {
    name: 'Read Chapter (Single Page)',
    description: 'Read a 30-page chapter in single page mode',
    duration: 60000, // 60 seconds
    expectedImages: 30
  },
  readChapterVertical: {
    name: 'Read Chapter (Vertical Scroll)',
    description: 'Read a 30-page chapter in vertical scroll mode',
    duration: 45000, // 45 seconds
    expectedImages: 30
  },
  switchChapters: {
    name: 'Switch Between Chapters',
    description: 'Navigate between 5 chapters back and forth',
    duration: 120000, // 2 minutes
    expectedImages: 150
  }
}

class CacheAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      workflows: {},
      summary: {}
    }
  }

  /**
   * Start Electron app in test mode
   */
  async startApp() {
    console.log('📦 Starting Electron app...')

    // For now, this is a manual process
    // User should:
    // 1. Add an IPC handler in main process to expose imageProxy.collectMetrics()
    // 2. Add a renderer-side function to collect and log metrics
    // 3. Run the app manually and perform the workflows

    console.log('\n⚠️  MANUAL TESTING REQUIRED')
    console.log('This script currently requires manual testing. Please:')
    console.log(
      '1. Add IPC handler: ipcMain.handle("image-proxy:get-metrics", () => imageProxy.collectMetrics())'
    )
    console.log('2. Build and run the app: npm run dev')
    console.log('3. Open DevTools Console')
    console.log('4. Run: window.api.getImageCacheMetrics().then(console.log)')
    console.log('5. Perform each workflow and collect metrics')
    console.log('6. Copy the metrics to baseline JSON file')
    console.log('')

    return null
  }

  /**
   * Simulate a workflow
   */
  async simulateWorkflow(workflowKey) {
    const workflow = WORKFLOWS[workflowKey]
    console.log(`\n🎬 Simulating: ${workflow.name}`)
    console.log(`   ${workflow.description}`)
    console.log(`   Duration: ${workflow.duration / 1000}s`)

    // In a real implementation, this would use Electron remote control
    // For now, return placeholder data
    return {
      name: workflow.name,
      duration: workflow.duration,
      expectedImages: workflow.expectedImages,
      metrics: {
        chapterCache: {
          memoryHit: 0,
          diskHit: 0,
          miss: 0,
          lruEviction: 0,
          expiryCleanup: 0,
          totalRequests: 0,
          currentSize: 0,
          maxSize: 30 * 1024 * 1024,
          hitRate: 0,
          memoryHitRate: 0,
          diskHitRate: 0
        },
        coverCache: {
          memoryHit: 0,
          diskHit: 0,
          miss: 0,
          lruEviction: 0,
          expiryCleanup: 0,
          totalRequests: 0,
          currentSize: 0,
          maxSize: 20 * 1024 * 1024,
          hitRate: 0,
          memoryHitRate: 0,
          diskHitRate: 0
        }
      }
    }
  }

  /**
   * Analyze a workflow result
   */
  analyzeWorkflow(workflowKey, result) {
    const { chapterCache, coverCache } = result.metrics

    const analysis = {
      workflow: result.name,
      duration: result.duration,
      chapterCache: {
        totalRequests: chapterCache.totalRequests,
        memoryHits: chapterCache.memoryHit,
        diskHits: chapterCache.diskHit,
        misses: chapterCache.miss,
        hitRate: chapterCache.hitRate?.toFixed(2) + '%',
        memoryHitRate: chapterCache.memoryHitRate?.toFixed(2) + '%',
        diskHitRate: chapterCache.diskHitRate?.toFixed(2) + '%',
        lruEvictions: chapterCache.lruEviction,
        expiryCleanups: chapterCache.expiryCleanup,
        cacheSize: `${(chapterCache.currentSize / 1024 / 1024).toFixed(2)} MB`,
        maxSize: `${(chapterCache.maxSize / 1024 / 1024).toFixed(2)} MB`
      },
      coverCache: {
        totalRequests: coverCache.totalRequests,
        memoryHits: coverCache.memoryHit,
        diskHits: coverCache.diskHit,
        misses: coverCache.miss,
        hitRate: coverCache.hitRate?.toFixed(2) + '%',
        memoryHitRate: coverCache.memoryHitRate?.toFixed(2) + '%',
        diskHitRate: coverCache.diskHitRate?.toFixed(2) + '%',
        lruEvictions: coverCache.lruEviction,
        expiryCleanups: coverCache.expiryCleanup,
        cacheSize: `${(coverCache.currentSize / 1024 / 1024).toFixed(2)} MB`,
        maxSize: `${(coverCache.maxSize / 1024 / 1024).toFixed(2)} MB`
      }
    }

    // Calculate recommendations
    analysis.recommendations = []

    if (chapterCache.hitRate < 80) {
      analysis.recommendations.push({
        issue: 'Low chapter cache hit rate',
        current: `${chapterCache.hitRate?.toFixed(2)}%`,
        target: '80%+',
        suggestions: [
          'Increase chapter cache size (currently 30MB)',
          'Implement directional preloading',
          'Adjust TTL (currently 15 minutes)'
        ]
      })
    }

    if (coverCache.diskHitRate > 50) {
      analysis.recommendations.push({
        issue: 'High disk cache reliance',
        current: `${coverCache.diskHitRate?.toFixed(2)}%`,
        suggestion: 'Increase in-memory cover cache size (currently 20MB) to reduce disk I/O'
      })
    }

    if (chapterCache.lruEviction > chapterCache.totalRequests * 0.1) {
      analysis.recommendations.push({
        issue: 'Frequent LRU evictions',
        current: `${chapterCache.lruEviction} evictions`,
        suggestion: 'Cache size too small for usage pattern - consider increasing to 40-50MB'
      })
    }

    return analysis
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const allWorkflows = Object.values(this.results.workflows)

    if (allWorkflows.length === 0) {
      return {
        message: 'No workflow data collected yet',
        instructions: 'Run workflows manually and collect metrics'
      }
    }

    // Calculate averages
    const avgChapterHitRate =
      allWorkflows.reduce((sum, w) => sum + parseFloat(w.chapterCache.hitRate), 0) /
      allWorkflows.length

    const avgCoverHitRate =
      allWorkflows.reduce((sum, w) => sum + parseFloat(w.coverCache.hitRate), 0) /
      allWorkflows.length

    const totalEvictions = allWorkflows.reduce(
      (sum, w) => sum + w.chapterCache.lruEvictions + w.coverCache.lruEvictions,
      0
    )

    return {
      overallPerformance: {
        avgChapterHitRate: `${avgChapterHitRate.toFixed(2)}%`,
        avgCoverHitRate: `${avgCoverHitRate.toFixed(2)}%`,
        totalEvictions,
        status:
          avgChapterHitRate >= 80 && avgCoverHitRate >= 80 ? 'GOOD ✅' : 'NEEDS OPTIMIZATION ⚠️'
      },
      keyFindings: this.generateKeyFindings(allWorkflows),
      nextSteps: this.generateNextSteps(allWorkflows)
    }
  }

  /**
   * Generate key findings from all workflows
   */
  generateKeyFindings(workflows) {
    const findings = []

    // Check for patterns across workflows
    const lowHitRateWorkflows = workflows.filter((w) => parseFloat(w.chapterCache.hitRate) < 80)

    if (lowHitRateWorkflows.length > 0) {
      findings.push({
        finding: 'Multiple workflows show low hit rates',
        affected: lowHitRateWorkflows.map((w) => w.workflow).join(', '),
        impact: 'Users experiencing slower loading times due to network fetches'
      })
    }

    const highEvictionWorkflows = workflows.filter((w) => w.chapterCache.lruEvictions > 10)

    if (highEvictionWorkflows.length > 0) {
      findings.push({
        finding: 'Cache thrashing detected',
        affected: highEvictionWorkflows.map((w) => w.workflow).join(', '),
        impact: 'Cache too small, frequently evicting useful entries'
      })
    }

    return findings
  }

  /**
   * Generate next steps based on analysis
   */
  generateNextSteps(workflows) {
    const steps = []

    const avgHitRate =
      workflows.reduce((sum, w) => sum + parseFloat(w.chapterCache.hitRate), 0) / workflows.length

    if (avgHitRate < 80) {
      steps.push({
        priority: 'HIGH',
        action: 'Proceed with Phase 2: Cover Image Optimization',
        reason: 'Hit rate below 80% target'
      })
      steps.push({
        priority: 'HIGH',
        action: 'Proceed with Phase 3: Chapter Image Optimization',
        reason: 'Implement directional preloading and priority caching'
      })
    } else {
      steps.push({
        priority: 'LOW',
        action: 'Cache already performing well',
        reason: `Hit rate ${avgHitRate.toFixed(2)}% exceeds 80% target`
      })
    }

    return steps
  }

  /**
   * Save results to JSON file
   */
  saveResults(filename = 'cache-performance-baseline.json') {
    const outputPath = path.join(__dirname, '..', 'benchmark-results', filename)

    const summary = this.generateSummary()
    const fullReport = {
      ...this.results,
      summary
    }

    writeFileSync(outputPath, JSON.stringify(fullReport, null, 2))
    console.log(`\n📊 Results saved to: ${outputPath}`)

    return fullReport
  }

  /**
   * Print results to console
   */
  printResults() {
    console.log('\n' + '='.repeat(70))
    console.log('📊 CACHE PERFORMANCE ANALYSIS REPORT')
    console.log('='.repeat(70))
    console.log(`Generated: ${this.results.timestamp}\n`)

    Object.values(this.results.workflows).forEach((workflow) => {
      console.log(`\n📍 ${workflow.workflow}`)
      console.log('─'.repeat(70))
      console.log(`   Duration: ${workflow.duration / 1000}s`)
      console.log(`\n   Chapter Cache:`)
      console.log(`   • Total Requests: ${workflow.chapterCache.totalRequests}`)
      console.log(`   • Hit Rate: ${workflow.chapterCache.hitRate}`)
      console.log(
        `     - Memory Hits: ${workflow.chapterCache.memoryHits} (${workflow.chapterCache.memoryHitRate})`
      )
      console.log(
        `     - Disk Hits: ${workflow.chapterCache.diskHits} (${workflow.chapterCache.diskHitRate})`
      )
      console.log(`     - Misses: ${workflow.chapterCache.misses}`)
      console.log(
        `   • Evictions: ${workflow.chapterCache.lruEvictions} LRU, ${workflow.chapterCache.expiryCleanups} TTL`
      )
      console.log(
        `   • Cache Size: ${workflow.chapterCache.cacheSize} / ${workflow.chapterCache.maxSize}`
      )

      console.log(`\n   Cover Cache:`)
      console.log(`   • Total Requests: ${workflow.coverCache.totalRequests}`)
      console.log(`   • Hit Rate: ${workflow.coverCache.hitRate}`)
      console.log(
        `     - Memory Hits: ${workflow.coverCache.memoryHits} (${workflow.coverCache.memoryHitRate})`
      )
      console.log(
        `     - Disk Hits: ${workflow.coverCache.diskHits} (${workflow.coverCache.diskHitRate})`
      )
      console.log(`     - Misses: ${workflow.coverCache.misses}`)
      console.log(`   • Evictions: ${workflow.coverCache.lruEvictions}`)
      console.log(
        `   • Cache Size: ${workflow.coverCache.cacheSize} / ${workflow.coverCache.maxSize}`
      )

      if (workflow.recommendations.length > 0) {
        console.log(`\n   ⚠️  Recommendations:`)
        workflow.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.issue}`)
          if (rec.suggestions) {
            rec.suggestions.forEach((s) => console.log(`      - ${s}`))
          } else if (rec.suggestion) {
            console.log(`      ${rec.suggestion}`)
          }
        })
      }
    })

    const summary = this.generateSummary()

    console.log('\n' + '='.repeat(70))
    console.log('📈 OVERALL SUMMARY')
    console.log('='.repeat(70))

    if (summary.overallPerformance) {
      console.log(`\n   Status: ${summary.overallPerformance.status}`)
      console.log(`   Avg Chapter Hit Rate: ${summary.overallPerformance.avgChapterHitRate}`)
      console.log(`   Avg Cover Hit Rate: ${summary.overallPerformance.avgCoverHitRate}`)
      console.log(`   Total Evictions: ${summary.overallPerformance.totalEvictions}`)
    }

    if (summary.keyFindings && summary.keyFindings.length > 0) {
      console.log(`\n   🔍 Key Findings:`)
      summary.keyFindings.forEach((finding, i) => {
        console.log(`   ${i + 1}. ${finding.finding}`)
        console.log(`      Affected: ${finding.affected}`)
        console.log(`      Impact: ${finding.impact}`)
      })
    }

    if (summary.nextSteps && summary.nextSteps.length > 0) {
      console.log(`\n   ✅ Next Steps:`)
      summary.nextSteps.forEach((step, i) => {
        console.log(`   ${i + 1}. [${step.priority}] ${step.action}`)
        console.log(`      Reason: ${step.reason}`)
      })
    }

    console.log('\n' + '='.repeat(70) + '\n')
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Cache Performance Analysis Tool')
  console.log('====================================\n')

  const analyzer = new CacheAnalyzer()

  console.log('\n📋 MANUAL TESTING GUIDE')
  console.log('========================\n')

  console.log('STEP 1: Add IPC Handler to main process')
  console.log('Add this to src/main/ipc/handlers/settings.handlers.ts:\n')
  console.log(`ipcMain.handle('image-proxy:get-metrics', () => {
  return imageProxy.collectMetrics()
})\n`)

  console.log('STEP 2: Add API to preload')
  console.log('Add this to src/preload/index.ts:\n')
  console.log(`getImageCacheMetrics: () => ipcRenderer.invoke('image-proxy:get-metrics')\n`)

  console.log('STEP 3: Run the application')
  console.log('npm run dev\n')

  console.log('STEP 4: For each workflow, perform the actions and collect metrics:')
  console.log('')

  Object.entries(WORKFLOWS).forEach(([key, workflow], index) => {
    console.log(`   Workflow ${index + 1}: ${workflow.name}`)
    console.log(`   ${workflow.description}`)
    console.log(`   Duration: ${workflow.duration / 1000}s\n`)
    console.log(`   Actions:`)

    if (key === 'browseLibrary') {
      console.log(`   1. Navigate to Library view`)
      console.log(`   2. Ensure you have 100+ manga in library`)
      console.log(`   3. Slowly scroll through the entire library`)
      console.log(`   4. Wait ${workflow.duration / 1000}s`)
    } else if (key === 'readChapterSingle') {
      console.log(`   1. Open a 30-page chapter`)
      console.log(`   2. Set reading mode to Single Page`)
      console.log(`   3. Navigate through all pages`)
      console.log(`   4. Wait ${workflow.duration / 1000}s`)
    } else if (key === 'readChapterVertical') {
      console.log(`   1. Open a 30-page chapter`)
      console.log(`   2. Set reading mode to Vertical Scroll`)
      console.log(`   3. Scroll through all pages`)
      console.log(`   4. Wait ${workflow.duration / 1000}s`)
    } else if (key === 'switchChapters') {
      console.log(`   1. Open Chapter 1`)
      console.log(`   2. Navigate to Chapter 2, then back to Chapter 1`)
      console.log(`   3. Navigate to Chapter 3, back to Chapter 1`)
      console.log(`   4. Repeat with Chapters 4 and 5`)
      console.log(`   5. Wait ${workflow.duration / 1000}s`)
    }

    console.log(`\n   5. Open DevTools Console`)
    console.log(`   6. Run: await window.api.getImageCacheMetrics()`)
    console.log(`   7. Copy the output to a JSON file: workflow-${key}.json\n`)
    console.log('   ' + '-'.repeat(68) + '\n')
  })

  console.log('STEP 5: Create baseline JSON file')
  console.log('Combine all workflow results into benchmark-results/cache-performance-baseline.json')
  console.log('')
  console.log('Example structure:')
  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        workflows: {
          browseLibrary: {
            /* metrics */
          },
          readChapterSingle: {
            /* metrics */
          },
          readChapterVertical: {
            /* metrics */
          },
          switchChapters: {
            /* metrics */
          }
        }
      },
      null,
      2
    )
  )

  console.log('\n\n📚 For automated baseline comparison after optimization:')
  console.log('node scripts/analyze-cache-performance.js --compare\n')
}

main().catch(console.error)
