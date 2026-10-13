// Builds the Markdown report posted on pull requests by the `run-tests` job in
// .github/workflows/pr-checks.yaml. Run directly by Node (native TypeScript support).
//
// Inputs (all produced by the preceding "Run unit tests with coverage" step):
//   test-results.json              Vitest JSON reporter output
//   coverage/coverage-summary.json Vitest `json-summary` coverage reporter output
//   VITEST_OUTCOME                 outcome of the Vitest step (success | failure)
//
// Outputs:
//   test-report.md                 comment body (also appended to the job summary)
//   $GITHUB_OUTPUT                 tests_passed, coverage_passed (true | false)
//
// Coverage thresholds are read from vitest.config.ts so there is a single source of truth.

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, sep } from 'node:path'
import config from '../../vitest.config.ts'

// Must match the marker the workflow uses to find and delete the previous comment
const REPORT_MARKER = '<!-- dexreader-test-report -->'

const RESULTS_PATH = 'test-results.json'
const COVERAGE_PATH = 'coverage/coverage-summary.json'
const REPORT_PATH = 'test-report.md'
const METRICS = ['statements', 'branches', 'functions', 'lines'] as const
const MAX_FAILURES_SHOWN = 20
const MAX_MESSAGE_LENGTH = 800
// GitHub rejects comments over 65,536 characters
const MAX_REPORT_LENGTH = 60000

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g

type Metric = (typeof METRICS)[number]

interface AssertionResult {
  status: string
  fullName: string
  failureMessages?: string[]
}

interface FileResult {
  name: string
  status: string
  message?: string
  endTime?: number
  assertionResults?: AssertionResult[]
}

interface VitestResults {
  success: boolean
  startTime: number
  numTotalTests?: number
  numPassedTests?: number
  numFailedTests?: number
  numPendingTests?: number
  numTodoTests?: number
  testResults?: FileResult[]
}

interface CoverageCounts {
  total: number
  covered: number
}

type CoverageEntry = Record<Metric, CoverageCounts>

interface Failure {
  title: string
  message: string | undefined
}

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return undefined
  }
}

function toRelativePath(path: string): string {
  return relative(process.cwd(), path).split(sep).join('/')
}

function truncate(text: string, length: number): string {
  const clean = text.replace(ANSI_PATTERN, '').trim()
  return clean.length > length ? `${clean.slice(0, length)}…` : clean
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function collectFailures(results: VitestResults): Failure[] {
  const failures: Failure[] = []
  for (const file of results.testResults ?? []) {
    const path = toRelativePath(file.name)
    const failed = (file.assertionResults ?? []).filter((test) => test.status === 'failed')
    for (const test of failed) {
      failures.push({ title: `${path} › ${test.fullName}`, message: test.failureMessages?.[0] })
    }
    // A suite can fail without any failed test (e.g. an import error)
    if (file.status === 'failed' && failed.length === 0) {
      failures.push({ title: `${path} (suite failed to run)`, message: file.message })
    }
  }
  return failures
}

function buildTestsSection(results: VitestResults | undefined, testsPassed: boolean): string[] {
  if (!results) {
    return [
      '## ❌ Unit tests',
      '',
      'Vitest did not produce a results file, so the run most likely crashed before completing. ' +
        'See the workflow logs.'
    ]
  }

  const total = results.numTotalTests ?? 0
  const passed = results.numPassedTests ?? 0
  const failed = results.numFailedTests ?? 0
  const skipped = (results.numPendingTests ?? 0) + (results.numTodoTests ?? 0)
  const endTimes = (results.testResults ?? []).map((file) => file.endTime ?? 0)
  const duration = endTimes.length > 0 ? Math.max(...endTimes) - results.startTime : 0

  const lines = [
    `## ${testsPassed ? '✅' : '❌'} Unit tests`,
    '',
    '| Total | Passed | Failed | Skipped | Duration |',
    '| ---: | ---: | ---: | ---: | ---: |',
    `| ${total} | ${passed} | ${failed} | ${skipped} | ${formatDuration(Math.max(duration, 0))} |`
  ]

  const failures = collectFailures(results)
  if (failures.length > 0) {
    lines.push('', '<details open>', `<summary>${failures.length} failure(s)</summary>`, '')
    for (const failure of failures.slice(0, MAX_FAILURES_SHOWN)) {
      const message = truncate(failure.message ?? '', MAX_MESSAGE_LENGTH)
      lines.push(`**${failure.title}**`, '', '```text', message, '```', '')
    }
    if (failures.length > MAX_FAILURES_SHOWN) {
      lines.push(`…and ${failures.length - MAX_FAILURES_SHOWN} more. See the workflow logs.`, '')
    }
    lines.push('</details>')
  }
  return lines
}

// Mirrors how Vitest combines the files matched by a threshold glob: sum covered and total
// counts across the files, then take the percentage (floored to 2 d.p., like istanbul).
function summariseArea(
  summary: Record<string, CoverageEntry>,
  prefix: string
): Record<Metric, number> {
  const totals = Object.fromEntries(
    METRICS.map((metric) => [metric, { covered: 0, total: 0 }])
  ) as Record<Metric, CoverageCounts>
  for (const [file, entry] of Object.entries(summary)) {
    if (file === 'total' || !toRelativePath(file).startsWith(`${prefix}/`)) continue
    for (const metric of METRICS) {
      totals[metric].covered += entry[metric].covered
      totals[metric].total += entry[metric].total
    }
  }
  return Object.fromEntries(
    METRICS.map((metric) => {
      const { covered, total } = totals[metric]
      return [metric, total === 0 ? 100 : Math.floor((covered / total) * 10000) / 100]
    })
  ) as Record<Metric, number>
}

function buildCoverageSection(testsPassed: boolean, coveragePassed: boolean): string[] {
  const thresholds: object = config.test?.coverage?.thresholds ?? {}
  const summary = readJson<Record<string, CoverageEntry>>(COVERAGE_PATH)
  const icon = !testsPassed ? '⚪' : coveragePassed ? '✅' : '❌'
  const lines = [`## ${icon} Coverage`, '']

  if (!testsPassed || !summary) {
    lines.push('Coverage was not evaluated because the unit tests did not complete successfully.')
    return lines
  }

  lines.push(
    '| Area | Statements | Branches | Functions | Lines |',
    '| --- | ---: | ---: | ---: | ---: |'
  )
  for (const [glob, value] of Object.entries(thresholds)) {
    if (typeof value !== 'object' || value === null || !glob.endsWith('/**')) continue
    const minimums = value as Partial<Record<Metric, number>>
    const actual = summariseArea(summary, glob.slice(0, -3))
    const cells = METRICS.map((metric) => {
      const minimum = minimums[metric]
      if (minimum === undefined) return `${actual[metric]}%`
      const met = actual[metric] >= minimum
      return `${met ? '' : '❌ '}${actual[metric]}% (min ${minimum}%)`
    })
    lines.push(`| \`${glob}\` | ${cells.join(' | ')} |`)
  }

  if (!coveragePassed) {
    lines.push(
      '',
      'Coverage is below the minimum set in `vitest.config.ts`. Add tests for the new or ' +
        'changed code; only lower a threshold deliberately, and explain why in the PR.'
    )
  }
  return lines
}

function main(): void {
  const results = readJson<VitestResults>(RESULTS_PATH)
  const vitestPassed = process.env.VITEST_OUTCOME === 'success'
  const testsPassed = results?.success === true
  // Vitest exits non-zero for a threshold breach even when every test passed
  const coveragePassed = testsPassed && vitestPassed

  const sections = [
    REPORT_MARKER,
    ...buildTestsSection(results, testsPassed),
    '',
    ...buildCoverageSection(testsPassed, coveragePassed),
    '',
    '---',
    `<sub>Commit ${process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown'}` +
      (process.env.RUN_URL ? ` · [workflow run](${process.env.RUN_URL})` : '') +
      '</sub>'
  ]

  let report = sections.join('\n')
  if (report.length > MAX_REPORT_LENGTH) {
    report = `${report.slice(0, MAX_REPORT_LENGTH)}\n\n…report truncated. See the workflow logs.`
  }
  writeFileSync(REPORT_PATH, report)

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report.replace(REPORT_MARKER, '')}\n`)
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `tests_passed=${testsPassed}\ncoverage_passed=${coveragePassed}\n`
    )
  }
  console.log(report)
}

main()
