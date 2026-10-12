import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineProject({
  plugins: [react()],
  // @fluentui/react-icons' ESM build uses extensionless relative imports internally (e.g.
  // './contexts/index' instead of './contexts/index.js'), which Vite's real dev/build
  // transform tolerates but Vitest 4's module runner (built on Vite's SSR module runner)
  // rejects once a dependency is externalized to Node's native resolver - which is the
  // default for anything in node_modules. Several @fluentui/react-* packages pull icons
  // in transitively (Checkbox's checkmark, Spinner's internals, etc.), so any component
  // tree that renders one breaks under test even though it renders fine in the real app.
  // ssr.noExternal forces the whole @fluentui/@griffel dependency tree through Vite's
  // transform instead of Node's loader, which resolves it correctly. (Vitest's own
  // `deps.inline`/`server.deps.inline`/`optimizeDeps` options and plain `resolve.alias`
  // were all tried first and had no effect - this is the one that actually works.)
  ssr: {
    noExternal: [/@fluentui\//, /@griffel\//]
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, '../src/renderer/src'),
      '@shared': resolve(__dirname, '../src/shared')
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
