/**
 * Electron Runtime Wrapper for EXPLAIN QUERY PLAN Analysis
 *
 * Purpose: Run query plan analysis in Electron context to access better-sqlite3
 * compiled for Electron's Node.js version.
 *
 * Usage: npm run analyze:plans
 */

const { spawn } = require('child_process')
const path = require('path')

const electronPath = require('electron')
const scriptPath = path.join(
  __dirname,
  '..',
  'src',
  'main',
  'scripts',
  'database-performance',
  'analysis',
  'analyze-query-plans.ts'
)

console.log('Starting query plan analysis in Electron context...\n')

const child = spawn(
  electronPath,
  [
    // Run tsx through Electron's Node.js (ELECTRON_RUN_AS_NODE=1)
    require.resolve('tsx/cli'),
    scriptPath
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1', // Critical: Run as Node.js instead of opening window
      NODE_ENV: 'development'
    }
  }
)

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Query plan analysis complete')
    process.exit(0)
  } else {
    console.error(`\n❌ Analysis failed with exit code ${code}`)
    process.exit(code)
  }
})

child.on('error', (err) => {
  console.error('Failed to start analysis:', err)
  process.exit(1)
})
