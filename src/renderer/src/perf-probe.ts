/**
 * THROWAWAY (perf/baseline-probes branch, never merged).
 *
 * Renderer half of the measurement probes. The main-process probe calls
 * `globalThis.__perfCollect()` on F9 and `globalThis.__perfReset()` on F8/after a dump.
 *
 * Console helpers (open DevTools with F12 in `npm run start`):
 *   __perfLabel = 'reader-30-pages'          label the next dump
 *   await __perfScripts.turnPages(30, 400)   press ArrowRight n times, ms apart (Reader)
 *   await __perfScripts.scrollBrowse(500)    scroll Browse until >= n results (or no more)
 */
import { useLibraryStore, useProgressStore, useSearchStore } from '@renderer/stores'

interface FrameStats {
  count: number
  over20ms: number
  over50ms: number
  maxMs: number
  deltas: number[]
}

interface LongTaskStats {
  count: number
  totalMs: number
  maxMs: number
}

const MAX_DELTAS = 20000

let storeUpdates: Record<string, number> = { progress: 0, search: 0, library: 0 }
let frames: FrameStats = { count: 0, over20ms: 0, over50ms: 0, maxMs: 0, deltas: [] }
let longTasks: LongTaskStats = { count: 0, totalMs: 0, maxMs: 0 }

function resetCounters(): void {
  storeUpdates = { progress: 0, search: 0, library: 0 }
  frames = { count: 0, over20ms: 0, over50ms: 0, maxMs: 0, deltas: [] }
  longTasks = { count: 0, totalMs: 0, maxMs: 0 }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

useProgressStore.subscribe(() => {
  storeUpdates.progress += 1
})
useSearchStore.subscribe(() => {
  storeUpdates.search += 1
})
useLibraryStore.subscribe(() => {
  storeUpdates.library += 1
})

try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      longTasks.count += 1
      longTasks.totalMs += entry.duration
      longTasks.maxMs = Math.max(longTasks.maxMs, entry.duration)
    }
  }).observe({ entryTypes: ['longtask'] })
} catch {
  // longtask not supported, ignore
}

let lastFrame = performance.now()
function onFrame(now: number): void {
  const delta = now - lastFrame
  lastFrame = now
  frames.count += 1
  if (delta > 20) frames.over20ms += 1
  if (delta > 50) frames.over50ms += 1
  frames.maxMs = Math.max(frames.maxMs, delta)
  if (frames.deltas.length < MAX_DELTAS) frames.deltas.push(delta)
  requestAnimationFrame(onFrame)
}
requestAnimationFrame(onFrame)

interface PerfGlobals {
  __perfLabel?: string
  __perfCollect?: () => unknown
  __perfReset?: () => void
  __perfScripts?: unknown
}

const perfGlobals = globalThis as unknown as PerfGlobals

perfGlobals.__perfCollect = (): unknown => {
  const sorted = frames.deltas.toSorted((a, b) => a - b)
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0
  const heap = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  const paint = Object.fromEntries(
    performance.getEntriesByType('paint').map((entry) => [entry.name, round(entry.startTime)])
  )
  return {
    label: perfGlobals.__perfLabel,
    storeUpdates,
    longTasks: { ...longTasks, totalMs: round(longTasks.totalMs), maxMs: round(longTasks.maxMs) },
    frames: {
      count: frames.count,
      over20ms: frames.over20ms,
      over50ms: frames.over50ms,
      maxMs: round(frames.maxMs),
      p95Ms: round(p95)
    },
    domNodes: document.getElementsByTagName('*').length,
    jsHeapMB: heap ? round(heap.usedJSHeapSize / 1048576) : undefined,
    paintMsSinceNavigation: paint,
    resultsInSearchStore: useSearchStore.getState().results.length
  }
}

perfGlobals.__perfReset = resetCounters

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

perfGlobals.__perfScripts = {
  async turnPages(count: number, intervalMs: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await sleep(intervalMs)
    }
  },
  async scrollBrowse(target: number): Promise<number> {
    let stalled = 0
    let previous = -1
    while (useSearchStore.getState().results.length < target && stalled < 5) {
      document.querySelector('.browse-view__sentinel')?.scrollIntoView()
      await sleep(900)
      const now = useSearchStore.getState().results.length
      stalled = now === previous ? stalled + 1 : 0
      previous = now
    }
    return useSearchStore.getState().results.length
  }
}
