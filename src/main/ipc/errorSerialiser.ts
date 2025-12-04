import { IpcError } from './error'

interface ISerialiseError {
  name: string
  message: string
  code?: string
  details?: unknown
  stack?: string
}

export function serialiseError(error: unknown): ISerialiseError {
  if (error instanceof IpcError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
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
