import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineProject } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineProject({
  test: {
    root: resolve(__dirname, '..'),
    name: 'main',
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest/setup.main.ts'],
    include: ['src/main/**/*.{test,spec}.ts', 'src/preload/**/*.{test,spec}.ts']
  }
})
