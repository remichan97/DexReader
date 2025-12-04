import { IpcError } from './error'

export class ThemeError extends IpcError {
  constructor(operation: string, originalError: unknown) {
    super('THEME_ERROR', `Theme operation ${operation} failed`, {
      operation,
      originalError
    })
  }
}
