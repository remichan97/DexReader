import { ValidationError } from './error/validation.error'
import { mainLog } from '../services/logging/main-logging.service'

export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    mainLog.warn(
      `[IPC Validator] Type validation failed for '${fieldName}': expected string, got ${typeof value}`
    )
    throw new ValidationError(
      fieldName,
      `Invalid type for ${fieldName}: expected string, but got ${typeof value}`
    )
  }
  return value
}

export function validatePath(value: unknown, fieldName: string): string {
  const path = validateString(value, fieldName)

  if (path.length === 0) {
    mainLog.warn(`[IPC Validator] Empty path validation failed for '${fieldName}'`)
    throw new ValidationError(fieldName, `Invalid value for ${fieldName}: path cannot be empty`)
  }

  return path
}

export function validateEncoding(value: unknown, fieldName: string): BufferEncoding | undefined {
  if (value === undefined) return undefined

  const path = validateString(value, fieldName)

  const validEncodings: BufferEncoding[] = [
    'ascii',
    'utf8',
    'utf-8',
    'utf16le',
    'ucs2',
    'base64',
    'latin1',
    'binary',
    'hex'
  ]

  if (!validEncodings.includes(path as BufferEncoding)) {
    mainLog.warn(`[IPC Validator] Invalid encoding '${path}' for '${fieldName}'`)
    throw new ValidationError(
      fieldName,
      `Invalid value for ${fieldName}: unsupported encoding "${path}"`
    )
  }

  return path as BufferEncoding
}
