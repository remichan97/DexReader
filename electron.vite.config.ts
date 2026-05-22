import fs from 'node:fs/promises'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: [
          // Exclude scripts directory from production build
          /^.*\/scripts\/.*/
        ]
      },
      externalizeDeps: true
    },
    plugins: [
      {
        name: 'copy-migrations',
        async writeBundle() {
          // Copy migrations folder to output directory
          const src = path.resolve(__dirname, 'src/main/database/migrations')
          const dest = path.resolve(__dirname, 'out/main/database/migrations')

          // Create destination directory
          await fs.mkdir(dest, { recursive: true })

          // Copy all files
          const files = await fs.readdir(src)
          files.forEach(async (file: string) => {
            const srcPath = path.join(src, file)
            const destPath = path.join(dest, file)

            if ((await fs.stat(srcPath)).isDirectory()) {
              // Copy directory recursively (for meta folder)
              fs.cp(srcPath, destPath, { recursive: true })
            } else if (file.endsWith('.sql') || file.endsWith('.json')) {
              // Copy migration files
              fs.copyFile(srcPath, destPath)
            }
          })
        }
      },
      {
        name: 'copy-protobuf-schema',
        async writeBundle() {
          const src = path.resolve(__dirname, 'src/main/services/protobuf/schemas')
          const dest = path.resolve(__dirname, 'out/main/services/protobuf/schemas')

          await fs.mkdir(dest, { recursive: true })

          const files = await fs.readdir(src, { recursive: true })
          files.forEach(async (file: string) => {
            const srcPath = path.join(src, file)
            const destPath = path.join(dest, file)

            if ((await fs.stat(srcPath)).isDirectory()) {
              fs.cp(srcPath, destPath, { recursive: true })
            } else if (file.endsWith('.proto')) {
              fs.copyFile(srcPath, destPath)
            }
          })
        }
      },
      {
        name: 'copy-locales',
        async writeBundle() {
          const src = path.resolve(__dirname, 'src/locales')
          const dest = path.resolve(__dirname, 'out/locales')

          await fs.mkdir(dest, { recursive: true })

          const files = await fs.readdir(src)
          for (const file of files) {
            const srcPath = path.join(src, file)
            const destPath = path.join(dest, file)

            if ((await fs.stat(srcPath)).isDirectory()) {
              // Copy language directory, but only JSON files
              await fs.mkdir(destPath, { recursive: true })
              const langFiles = await fs.readdir(srcPath)
              for (const langFile of langFiles) {
                if (langFile.endsWith('.json')) {
                  await fs.copyFile(path.join(srcPath, langFile), path.join(destPath, langFile))
                }
              }
            } else if (file.endsWith('.json')) {
              // Copy root-level JSON files (if any)
              await fs.copyFile(srcPath, destPath)
            }
          }
        }
      }
    ]
  },
  preload: {
    build: {
      // IMPORTANT: Must bundle dependencies for sandbox mode
      // Sandboxed preload cannot access node_modules at runtime
      externalizeDeps: false,
      rollupOptions: {
        output: {
          format: 'cjs' // Preload must be CommonJS (Electron requirement)
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': path.resolve('src/renderer/src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split React core (including scheduler) into its own chunk
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-vendor'
            }
            // Split React Router
            if (
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/@remix-run/')
            ) {
              return 'router-vendor'
            }
            // Split Fluent Icons and Zustand
            if (id.includes('node_modules/@fluentui/') || id.includes('node_modules/zustand/')) {
              return 'ui-vendor'
            }
            // App code stays in main chunk (don't split other node_modules to avoid circular deps)
            return undefined
          }
        }
      }
    },
    plugins: [react()]
  }
})
