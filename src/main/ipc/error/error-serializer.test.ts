import { IpcError } from './ipc.error'
import { serializeError } from './error-serializer'

describe('serializeError', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('IpcError', () => {
    it('includes name, message, and code', () => {
      const error = new IpcError('VALIDATION_ERROR', 'Invalid value')

      expect(serializeError(error)).toEqual(
        expect.objectContaining({
          name: 'IpcError',
          message: 'Invalid value',
          code: 'VALIDATION_ERROR'
        })
      )
    })

    it('omits details and stack outside development, so they never reach the renderer', () => {
      process.env.NODE_ENV = 'production'
      const error = new IpcError('VALIDATION_ERROR', 'Invalid value', { field: 'x' })

      const result = serializeError(error)

      expect(result.details).toBeUndefined()
      expect(result.stack).toBeUndefined()
    })

    it('includes details and stack in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new IpcError('VALIDATION_ERROR', 'Invalid value', { field: 'x' })

      const result = serializeError(error)

      expect(result.details).toEqual({ field: 'x' })
      expect(result.stack).toBeDefined()
    })

    it('scrubs a filesystem path embedded in the message down to its basename, using details.path', () => {
      const fullPath = 'C:\\Users\\alice\\AppData\\Roaming\\DexReader\\downloads'
      const error = new IpcError('FS_ERROR', `Cannot access ${fullPath}`, { path: fullPath })

      expect(serializeError(error).message).toBe('Cannot access downloads')
    })

    it('leaves the message untouched when details has no path', () => {
      const error = new IpcError('VALIDATION_ERROR', 'Invalid value', { field: 'x' })

      expect(serializeError(error).message).toBe('Invalid value')
    })
  })

  describe('native Error', () => {
    it('includes name and message', () => {
      const error = new Error('Something broke')

      expect(serializeError(error)).toEqual(
        expect.objectContaining({ name: 'Error', message: 'Something broke' })
      )
    })

    it("scrubs a Node fs error's embedded path down to its basename, using the error's own .path", () => {
      const fullPath = 'C:\\Users\\alice\\secrets.db'
      const error = Object.assign(new Error(`ENOENT: no such file, open '${fullPath}'`), {
        path: fullPath
      })

      expect(serializeError(error).message).toBe("ENOENT: no such file, open 'secrets.db'")
    })

    it('omits stack outside development', () => {
      process.env.NODE_ENV = 'production'

      expect(serializeError(new Error('x')).stack).toBeUndefined()
    })

    it('includes stack in development', () => {
      process.env.NODE_ENV = 'development'

      expect(serializeError(new Error('x')).stack).toBeDefined()
    })
  })

  describe('non-Error values', () => {
    it('falls back to UnknownError with the stringified value', () => {
      expect(serializeError('just a string')).toEqual({
        name: 'UnknownError',
        message: 'just a string'
      })
    })

    it('handles undefined and null', () => {
      expect(serializeError(undefined)).toEqual({ name: 'UnknownError', message: 'undefined' })
      expect(serializeError(null)).toEqual({ name: 'UnknownError', message: 'null' })
    })
  })
})
