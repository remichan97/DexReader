#!/usr/bin/env node
/**
 * Seed Benchmark Database - Electron Runner
 *
 * Runs the database seeding script through Electron's Node.js runtime.
 * This ensures better-sqlite3 (compiled for Electron) works correctly.
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
  'seeding',
  'seed-cli.ts'
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
