import { IpcError } from './ipc.error'

// Re-export shared type for convenience
export type { ISerializeError } from '../../../preload/ipc.types'
import type { ISerializeError } from '../../../preload/ipc.types'

export function serializeError(error: unknown): ISerializeError {
  if (error instanceof IpcError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  return {
    name: 'UnknownError',
    message: String(error)
  }
}
