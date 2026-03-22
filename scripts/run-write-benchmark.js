#!/usr/bin/env node
/**
 * Run Write Benchmarks - Electron Runner
 *
 * Runs the write benchmark script through Electron's Node.js runtime.
 * This ensures better-sqlite3 (compiled for Electron) works correctly.
 *
 * Why this is needed:
 * - better-sqlite3 is a native Node.js addon compiled specifically for Electron
 * - Running it in pure Node.js (v22/v24) causes NODE_MODULE_VERSION mismatch
 * - Solution: Use Electron's bundled Node.js runtime via ELECTRON_RUN_AS_NODE
 *
 * Usage:
 *   npm run benchmark:write                           # Auto-saves to benchmark-results/
 *   npm run benchmark:write -- --iterations 20        # More iterations
 *   npm run benchmark:write -- --output custom.json   # Custom filename
 *   npm run benchmark:write -- --verbose              # Detailed logs
 */

const { spawn } = require('child_process')
const path = require('path')

// Electron executable
const electron = require('electron')

// Script to run
const scriptPath = path.join(
  __dirname,
  '..',
  'src',
  'main',
  'scripts',
  'database-performance',
  'benchmarking',
  'write-benchmark-cli.ts'
)

// Forward all CLI arguments
const args = process.argv.slice(2)

// Use tsx through Electron's Node.js runtime
const proc = spawn(
  electron,
  [
    // Run tsx CLI
    require.resolve('tsx/cli'),
    scriptPath,
    ...args
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1'
    },
    shell: false
  }
)

proc.on('exit', (code) => {
  process.exit(code || 0)
})
