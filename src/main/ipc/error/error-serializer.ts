import path from 'node:path'
import { IpcError } from './ipc.error'

// Re-export shared type for convenience
export type { ISerializeError } from '../../../preload/ipc.types'
import type { ISerializeError } from '../../../preload/ipc.types'

// Node's fs errors (ENOENT, EACCES, etc.) embed the full absolute path directly in
// `.message` (and separately on `.path`) - that path would otherwise reach the renderer
// verbatim, leaking local filesystem structure (e.g. the OS username). Replace it with
// just the file/directory name wherever it appears in the message.
function scrubPath(message: string, filePath: unknown): string {
  if (typeof filePath !== 'string' || !filePath) {
    return message
  }
  return message.replaceAll(filePath, path.basename(filePath))
}

function getDetailsPath(details: unknown): unknown {
  return typeof details === 'object' && details !== null && 'path' in details
    ? (details as { path: unknown }).path
    : undefined
}

export function serializeError(error: unknown): ISerializeError {
  if (error instanceof IpcError) {
    return {
      name: error.name,
      message: scrubPath(error.message, getDetailsPath(error.details)),
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: scrubPath(error.message, (error as NodeJS.ErrnoException).path),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  return {
    name: 'UnknownError',
    message: String(error)
  }
}
