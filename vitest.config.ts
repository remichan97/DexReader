import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['./vitest/vitest.main.config.ts', './vitest/vitest.renderer.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      reportsDirectory: './coverage',
      // Scoped to .ts/.tsx so non-code assets alongside source (css, svg, sql migrations,
      // .proto schemas, component READMEs) are never picked up as "uncovered" files.
      include: [
        'src/main/**/*.{ts,tsx}',
        'src/preload/**/*.{ts,tsx}',
        'src/renderer/src/**/*.{ts,tsx}',
        'src/shared/**/*.{ts,tsx}'
      ],
      exclude: ['src/main/database/migrations/**'],
      thresholds: {
        // Only the areas with established suites are gated. The renderer views/components
        // tier is intentionally left ungated for now - it's a much larger, lower-value-per-file
        // surface (see project memory on the test-coverage effort) better suited to integration
        // tests than unit tests, and gating it today would either be meaningless (near-zero) or
        // block unrelated work. Numbers below sit a few points under current actual coverage so
        // normal day-to-day changes don't trip the gate on minor fluctuation.
        'src/main/**': { statements: 70, branches: 70, functions: 65, lines: 70 },
        'src/preload/**': { statements: 95, branches: 95, functions: 95, lines: 95 },
        'src/shared/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/renderer/src/stores/**': { statements: 75, branches: 65, functions: 90, lines: 75 }
      }
    }
  }
})
