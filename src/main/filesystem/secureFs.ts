import fs from 'node:fs/promises'
import { type Stats } from 'node:fs'
import { validatePath } from './pathValidator'
import path from 'node:path'

export const secureFs = {
  async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string | Buffer> {
    const validPath = validatePath(filePath)
    return encoding ? fs.readFile(validPath, { encoding }) : fs.readFile(validPath)
  },

  async mkdir(dirPath: string): Promise<string | undefined> {
    const validPath = validatePath(dirPath)
    return fs.mkdir(validPath, { recursive: true })
  },

  async ensureDir(dirPath: string): Promise<string | undefined> {
    return this.mkdir(dirPath)
  },

  async deleteFile(filePath: string): Promise<void> {
    const validPath = validatePath(filePath)
    return fs.unlink(validPath)
  },

  async deleteDir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    const validPath = validatePath(dirPath)
    return fs.rm(validPath, { recursive: options?.recursive ?? false, force: true })
  },

  async isExists(path: string): Promise<boolean> {
    const validPath = validatePath(path)
    try {
      await fs.access(validPath)
      return true
    } catch {
      return false
    }
  },

  async stat(path: string): Promise<Stats> {
    const validPath = validatePath(path)
    return fs.stat(validPath)
  },

  async readDir(dirPath: string): Promise<string[]> {
    const validPath = validatePath(dirPath)
    return fs.readdir(validPath)
  },

  async copyFile(srcPath: string, destPath: string): Promise<void> {
    const validSrcPath = validatePath(srcPath)
    const validDestPath = validatePath(destPath)

    await this.ensureDir(path.dirname(validDestPath))

    return fs.copyFile(validSrcPath, validDestPath)
  },

  async rename(oldPath: string, newPath: string): Promise<void> {
    const validOldPath = validatePath(oldPath)
    const validNewPath = validatePath(newPath)

    await this.ensureDir(path.dirname(validNewPath))

    return fs.rename(validOldPath, validNewPath)
  },

  async writeFile(
    filePath: string,
    data: string | Buffer,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<void> {
    const validPath = validatePath(filePath)
    await this.ensureDir(path.dirname(validPath))
    return fs.writeFile(validPath, data, { encoding })
  },

  async appendFile(filePath: string, data: string | Buffer): Promise<void> {
    const validPath = validatePath(filePath)
    await this.ensureDir(path.dirname(validPath))
    return fs.appendFile(validPath, data)
  }
}
