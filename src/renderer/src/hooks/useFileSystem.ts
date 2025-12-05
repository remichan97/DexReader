/*
 * Custom hook for secure file system operations via IPC
 * Using `window` instead of `globalThis` is conventional in Electron renderer
 * TypeScript ESLint prefers globalThis but window is standard for Electron
 */
import { useState, useCallback } from 'react'
import { isIpcSuccess, isIpcError } from '../utils/ipcTypeGuards'
import type {
  IpcResponse,
  FileStats,
  AllowedPaths,
  FolderSelectResult
} from '../../../preload/ipc.types'

interface UseFileSystemError {
  message: string
  code?: string
  details?: unknown
}

/**
 * Custom hook for file system operations with built-in error handling and loading states.
 * Wraps the IPC file system API with type guards and consistent error handling.
 *
 * @example
 * ```tsx
 * const { readFile, error, isLoading } = useFileSystem()
 *
 * const loadSettings = async () => {
 *   const content = await readFile('/path/to/settings.json', 'utf-8')
 *   if (content) {
 *     setSettings(JSON.parse(content as string))
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useFileSystem() {
  const [error, setError] = useState<UseFileSystemError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((response: IpcResponse<unknown>) => {
    if (isIpcError(response)) {
      setError({
        message: response.error.message,
        code: response.error.code,
        details: response.error.details
      })
    }
  }, [])

  /**
   * Read file contents from a validated path.
   *
   * @param filePath - Absolute path to the file
   * @param encoding - Text encoding (utf-8, ascii, etc.)
   * @returns File contents as string or Buffer, or null on error
   */
  const readFile = useCallback(
    async (filePath: string, encoding: BufferEncoding): Promise<string | Buffer | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.readFile(filePath, encoding)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return null
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Write data to a file.
   *
   * @param filePath - Absolute path to the file
   * @param data - Data to write (string or Buffer)
   * @param encoding - Text encoding
   * @returns true on success, false on error
   */
  const writeFile = useCallback(
    async (filePath: string, data: string | Buffer, encoding: BufferEncoding): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.writeFile(filePath, data, encoding)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Check if a file or directory exists.
   *
   * @param filePath - Path to check
   * @returns true if exists, false otherwise
   */
  const exists = useCallback(
    async (filePath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.isExists(filePath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Get file or directory statistics.
   *
   * @param path - Path to check
   * @returns FileStats object or null on error
   */
  const stat = useCallback(
    async (path: string): Promise<FileStats | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.stat(path)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return null
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Read directory contents.
   *
   * @param dirPath - Directory path
   * @returns Array of file/directory names, or empty array on error
   */
  const readdir = useCallback(
    async (dirPath: string): Promise<string[]> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.readdir(dirPath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return []
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Copy a file from source to destination.
   *
   * @param srcPath - Source file path
   * @param destPath - Destination file path
   * @returns true on success, false on error
   */
  const copyFile = useCallback(
    async (srcPath: string, destPath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.copyFile(srcPath, destPath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Rename a file or directory.
   *
   * @param oldPath - Current path
   * @param newPath - New path
   * @returns true on success, false on error
   */
  const rename = useCallback(
    async (oldPath: string, newPath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.rename(oldPath, newPath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Create a directory.
   *
   * @param dirPath - Directory path to create
   * @returns true on success, false on error
   */
  const mkdir = useCallback(
    async (dirPath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.mkdir(dirPath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Delete a file.
   *
   * @param filePath - File path to delete
   * @returns true on success, false on error
   */
  const unlink = useCallback(
    async (filePath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.unlink(filePath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Delete a directory.
   *
   * @param dirPath - Directory path to delete
   * @returns true on success, false on error
   */
  const rmdir = useCallback(
    async (dirPath: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.rmdir(dirPath)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  /**
   * Get allowed filesystem paths (AppData and Downloads).
   *
   * @returns AllowedPaths object or null on error
   */
  const getAllowedPaths = useCallback(async (): Promise<AllowedPaths | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await window.fileSystem.getAllowedPaths()

      if (isIpcSuccess(response)) {
        return response.data
      } else {
        handleError(response)
        return null
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  /**
   * Open a folder selection dialog for downloads folder.
   *
   * @returns FolderSelectResult or null on error
   */
  const selectDownloadsFolder = useCallback(async (): Promise<FolderSelectResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await window.fileSystem.selectDownloadsFolder()

      if (isIpcSuccess(response)) {
        return response.data
      } else {
        handleError(response)
        return null
      }
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  /**
   * Append data to a file.
   *
   * @param filePath - File path
   * @param data - Data to append
   * @returns true on success, false on error
   */
  const appendFile = useCallback(
    async (filePath: string, data: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await window.fileSystem.appendFile(filePath, data)

        if (isIpcSuccess(response)) {
          return response.data
        } else {
          handleError(response)
          return false
        }
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  return {
    // File operations
    readFile,
    writeFile,
    appendFile,
    copyFile,
    rename,
    unlink,

    // Directory operations
    mkdir,
    rmdir,
    readdir,

    // Query operations
    exists,
    stat,
    getAllowedPaths,

    // UI operations
    selectDownloadsFolder,

    // State
    error,
    isLoading,
    clearError
  }
}
