// Shared IPC types for main, preload, and renderer processes

export interface ISerialiseError {
  name: string
  message: string
  code?: string
  details?: unknown
  stack?: string
}

export interface ReadFileRequest {
  filePath: string
  encoding?: BufferEncoding
}

export interface WriteFileRequest {
  filePath: string
  data: string | Buffer
  encoding?: BufferEncoding
}

export interface FileStats {
  isFile: boolean
  isDirectory: boolean
  size: number
  createdAt: Date
  modifiedAt: Date
}

export interface AllowedPaths {
  appData: string
  downloads: string
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ISerialiseError
}

export interface FolderSelectResult {
  cancelled: boolean
  filePath?: string
}
