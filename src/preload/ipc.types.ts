// IPC types for main, preload, and renderer processes.
// ISerializeError/IpcResponse are re-exported here for convenience (renderer code
// imports them from this file) but their canonical definition lives in
// @shared/contracts/ipc/ipc-response.contract - that's what lets main import them
// too without reaching into src/preload.
export type { ISerializeError, IpcResponse } from '@shared/contracts/ipc/ipc-response.contract'

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

export interface FolderSelectResult {
  cancelled: boolean
  filePath?: string
}
