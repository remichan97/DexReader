import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['./vitest/vitest.main.config.ts', './vitest/vitest.renderer.config.ts']
  }
})
