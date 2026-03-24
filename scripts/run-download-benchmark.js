#!/usr/bin/env node
/**
 * Run Download Benchmarks - Electron Runner
 *
 * Runs the download benchmark script through Electron's Node.js runtime.
 * This ensures better-sqlite3 (compiled for Electron) works correctly.
 *
 * Why this is needed:
 * - better-sqlite3 is a native Node.js addon compiled specifically for Electron
 * - Running it in pure Node.js (v22/v24) causes NODE_MODULE_VERSION mismatch
 * - Solution: Use Electron's bundled Node.js runtime via ELECTRON_RUN_AS_NODE
 *
 * Usage:
 *   npm run benchmark:downloads                    # Auto-saves to benchmark-results/
 *   npm run benchmark:downloads -- --iterations 5  # More iterations
 *   npm run benchmark:downloads -- --verbose       # Detailed logs
 *   npm run benchmark:downloads -- --chapters 50   # Test with more chapters
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
  'download-performance',
  'benchmarking',
  'download-benchmark-cli.ts'
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
