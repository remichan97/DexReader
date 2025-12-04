import { IpcError } from './error'

export class FileSystemError extends IpcError {
  constructor(operation: string, path: string, originalError?: unknown) {
    super('FS_ERROR', `File operation ${operation} failed on path: ${path}`, {
      operation,
      path,
      originalError
    })
  }
}
