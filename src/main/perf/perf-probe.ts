/**
 * THROWAWAY (perf/baseline-probes branch, never merged).
 *
 * Measurement probes for the performance-optimisation plan (Workstream 0). Active only when
 * DEXREADER_PERF=1. Hotkeys in the main window:
 *   F8  reset all counters (start of a scenario)
 *   F9  dump main + renderer metrics to the console and <data dir>/perf-results.jsonl, then reset
 *       (label comes from `globalThis.__perfLabel` in the renderer console, else scenario-N)
 *   F6  Reader: press ArrowRight 30 times, 400 ms apart (labels the dump 'reader-30-page-turns')
 *   F7  Browse: scroll until 500 results are loaded (labels the dump 'browse-scroll-500')
 */
import { app, BrowserWindow } from 'electron'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { syncBuiltinESMExports } from 'node:module'
import { monitorEventLoopDelay, performance } from 'node:perf_hooks'

export const PERF_ENABLED = process.env.DEXREADER_PERF === '1'

const MAX_SAMPLES = 2000
const LOOP_RESOLUTION_MS = 10
const SLOW_REPO_MS = 5

interface TimingBucket {
  count: number
  totalMs: number
  maxMs: number
  samples: number[]
}

interface TimingSummary {
  key: string
  firstQuarterMeanMs: number
  lastQuarterMeanMs: number
  count: number
  totalMs: number
  meanMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
}

const startupMarks: Array<{ name: string; ms: number }> = []
const ipcStats = new Map<string, TimingBucket>()
const repoStats = new Map<string, TimingBucket>()
const fsCounts = new Map<string, number>()
const fsTimings = new Map<string, TimingBucket>() // synchronous fs calls only: they block main
const loopHistogram = monitorEventLoopDelay({ resolution: LOOP_RESOLUTION_MS })

// Captured before any patching so writing results never feeds the counters
const rawAppendFileSync = fs.appendFileSync.bind(fs)

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index]
}

function record(map: Map<string, TimingBucket>, key: string, ms: number): void {
  let bucket = map.get(key)
  if (!bucket) {
    bucket = { count: 0, totalMs: 0, maxMs: 0, samples: [] }
    map.set(key, bucket)
  }
  bucket.count += 1
  bucket.totalMs += ms
  bucket.maxMs = Math.max(bucket.maxMs, ms)
  if (bucket.samples.length < MAX_SAMPLES) {
    bucket.samples.push(ms)
  }
}

function summarise(map: Map<string, TimingBucket>): TimingSummary[] {
  return [...map.entries()]
    .map(([key, bucket]) => {
      const sorted = bucket.samples.toSorted((a, b) => a - b)
      // Means of the first and last quarter of calls, in call order: shows growth over a run
      const quarter = Math.max(1, Math.floor(bucket.samples.length / 4))
      const mean = (xs: number[]): number =>
        xs.length === 0 ? 0 : round(xs.reduce((sum, x) => sum + x, 0) / xs.length)
      return {
        key,
        firstQuarterMeanMs: mean(bucket.samples.slice(0, quarter)),
        lastQuarterMeanMs: mean(bucket.samples.slice(-quarter)),
        count: bucket.count,
        totalMs: round(bucket.totalMs),
        meanMs: round(bucket.totalMs / bucket.count),
        p50Ms: round(percentile(sorted, 50)),
        p95Ms: round(percentile(sorted, 95)),
        maxMs: round(bucket.maxMs)
      }
    })
    .toSorted((a, b) => b.totalMs - a.totalMs)
}

export function perfMark(name: string): void {
  if (!PERF_ENABLED) return
  const ms = round(performance.now())
  startupMarks.push({ name, ms })
  console.log(`[PERF] mark ${name} @ ${ms} ms since process start`)
}

export function recordIpc(channel: string, ms: number): void {
  if (!PERF_ENABLED) return
  record(ipcStats, channel, ms)
}

export function recordRepo(key: string, ms: number): void {
  if (!PERF_ENABLED) return
  record(repoStats, key, ms)
  if (ms > SLOW_REPO_MS) {
    console.log(`[PERF] slow repo call ${key}: ${round(ms)} ms`)
  }
}

function bumpFs(key: string): void {
  fsCounts.set(key, (fsCounts.get(key) ?? 0) + 1)
}

function categorise(target: unknown): string | undefined {
  if (typeof target !== 'string' && !(target instanceof URL)) return undefined
  const p = String(target)
  if (p.endsWith('settings.json')) return 'settings'
  if (p.includes(`${path.sep}covers`)) return 'covers'
  if (/\.db(-wal|-shm)?$/.test(p)) return 'db'
  if (p.includes(`${path.sep}logs${path.sep}`) || p.endsWith('.log')) return 'logs'
  return undefined
}

function patchFs(owner: object, name: string, label: string): void {
  const target = owner as Record<string, unknown>
  const original = target[name]
  if (typeof original !== 'function') return
  target[name] = function (this: unknown, ...args: unknown[]): unknown {
    const category = categorise(args[0])
    if (!category) return Reflect.apply(original, this, args)
    const key = `${label}:${category}`
    bumpFs(key)
    const start = performance.now()
    const result = Reflect.apply(original, this, args)
    if (name.endsWith('Sync')) record(fsTimings, key, performance.now() - start)
    return result
  }
}

export function initPerfProbe(): void {
  if (!PERF_ENABLED) return

  patchFs(fs, 'readFileSync', 'readFileSync')
  patchFs(fs, 'writeFileSync', 'writeFileSync')
  patchFs(fs, 'writeFile', 'writeFile')
  patchFs(fs, 'appendFile', 'appendFile')
  patchFs(fsp, 'readFile', 'readFile')
  patchFs(fsp, 'writeFile', 'writeFile')
  patchFs(fsp, 'readdir', 'readdir')
  patchFs(fsp, 'stat', 'stat')
  syncBuiltinESMExports()

  loopHistogram.enable()
  perfMark('probe-initialised')
}

/** Wraps every prototype method of each repository so its duration is recorded. */
export function instrumentObjects(objects: Record<string, object>): void {
  if (!PERF_ENABLED) return
  for (const [label, instance] of Object.entries(objects)) {
    const proto = Object.getPrototypeOf(instance) as object
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue
      // Read the descriptor, not the property: accessors such as the repos' `db` getter
      // would otherwise run now, before the database is open.
      const descriptor = Object.getOwnPropertyDescriptor(proto, name)
      const original = descriptor?.value as unknown
      if (typeof original !== 'function') continue
      ;(instance as Record<string, unknown>)[name] = function (...args: unknown[]): unknown {
        const start = performance.now()
        const key = `${label}.${name}`
        const result: unknown = Reflect.apply(original, instance, args)
        // Async methods (the disk cache) must be timed until they settle, not until they return
        if (result instanceof Promise) {
          return result.finally(() => recordRepo(key, performance.now() - start))
        }
        recordRepo(key, performance.now() - start)
        return result
      }
    }
  }
}

function resetMainCounters(): void {
  ipcStats.clear()
  repoStats.clear()
  fsCounts.clear()
  fsTimings.clear()
  loopHistogram.reset()
}

async function collectRenderer(win: BrowserWindow): Promise<unknown> {
  try {
    return await win.webContents.executeJavaScript(
      'globalThis.__perfCollect ? globalThis.__perfCollect() : null'
    )
  } catch (error) {
    return { error: String(error) }
  }
}

export async function perfReset(win: BrowserWindow): Promise<void> {
  resetMainCounters()
  try {
    await win.webContents.executeJavaScript('globalThis.__perfReset && globalThis.__perfReset()')
  } catch {
    // renderer not ready, ignore
  }
  console.log('[PERF] counters reset (F8)')
}

let dumpCounter = 0

export async function perfDump(win: BrowserWindow): Promise<void> {
  dumpCounter += 1
  const renderer = (await collectRenderer(win)) as { label?: string } | null
  const label = renderer?.label ?? `scenario-${dumpCounter}`
  const memory = process.memoryUsage()
  const toMs = (ns: number): number => round(Math.max(0, ns / 1e6 - LOOP_RESOLUTION_MS))

  const result = {
    label,
    at: new Date().toISOString(),
    sinceProcessStartMs: round(performance.now()),
    startupMarks,
    eventLoopStallMs: {
      mean: toMs(loopHistogram.mean),
      p50: toMs(loopHistogram.percentile(50)),
      p99: toMs(loopHistogram.percentile(99)),
      max: toMs(loopHistogram.max)
    },
    mainMemoryMB: {
      rss: round(memory.rss / 1048576),
      heapUsed: round(memory.heapUsed / 1048576)
    },
    fsCounts: Object.fromEntries([...fsCounts.entries()].toSorted()),
    fsSyncTimings: summarise(fsTimings),
    ipc: summarise(ipcStats),
    repo: summarise(repoStats),
    renderer
  }

  const file = path.join(
    process.env.DEXREADER_DATA_DIR ?? app.getPath('userData'),
    'perf-results.jsonl'
  )
  rawAppendFileSync(file, JSON.stringify(result) + '\n')

  console.log(`[PERF] ===== DUMP "${label}" (F9) -> ${file}`)
  console.log('[PERF] event-loop stall (ms):', result.eventLoopStallMs)
  console.log('[PERF] fs counts:', result.fsCounts)
  console.table(result.ipc.slice(0, 15))
  console.table(result.repo.slice(0, 15))
  console.log('[PERF] renderer:', JSON.stringify(renderer))

  resetMainCounters()
  try {
    await win.webContents.executeJavaScript('globalThis.__perfReset && globalThis.__perfReset()')
  } catch {
    // ignore
  }
}

export function attachPerfHotkeys(win: BrowserWindow): void {
  if (!PERF_ENABLED) return
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F8') {
      event.preventDefault()
      void perfReset(win)
    } else if (input.key === 'F9') {
      event.preventDefault()
      void perfDump(win)
    } else if (input.key === 'F6') {
      // Reader: 30 page turns, 400 ms apart (no DevTools needed)
      event.preventDefault()
      void win.webContents.executeJavaScript(
        "globalThis.__perfLabel = 'reader-30-page-turns'; globalThis.__perfScripts.turnPages(30, 400)"
      )
    } else if (input.key === 'F7') {
      // Browse: scroll until 500 results are loaded (no DevTools needed)
      event.preventDefault()
      void win.webContents.executeJavaScript(
        "globalThis.__perfLabel = 'browse-scroll-500'; globalThis.__perfScripts.scrollBrowse(500)"
      )
    }
  })
  win.webContents.on('did-finish-load', () => perfMark('renderer-did-finish-load'))
  win.once('ready-to-show', () => perfMark('window-ready-to-show'))
}
