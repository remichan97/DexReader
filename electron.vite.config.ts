import fs from 'node:fs/promises'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
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
      }
    ]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': path.resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
