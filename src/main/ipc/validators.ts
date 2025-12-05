import { ValidationError } from './validationError'

export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
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
    throw new ValidationError(
      fieldName,
      `Invalid value for ${fieldName}: unsupported encoding "${path}"`
    )
  }

  return path as BufferEncoding
}
