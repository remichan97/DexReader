import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineProject({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, '../src/renderer/src')
    }
  },
  test: {
    root: resolve(__dirname, '..'),
    name: 'renderer',
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest/setup.renderer.ts'],
    include: ['src/renderer/**/*.{test,spec}.{ts,tsx}']
  }
})
