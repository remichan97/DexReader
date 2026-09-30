import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['./vitest/vitest.main.config.ts', './vitest/vitest.renderer.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/main/**', 'src/preload/**', 'src/renderer/src/**', 'src/shared/**'],
      exclude: ['src/main/database/migrations/**']
    }
  }
})
