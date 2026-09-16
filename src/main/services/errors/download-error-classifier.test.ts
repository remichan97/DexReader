import { MangaDexApiError, MangaDexNetworkError } from '../../api/shared/error.shared'
import { DownloadErrorCategory } from './enums/download-error.enum'
import { classifyDownloadError, getErrorSummary } from './download-error-classifier'

function fsError(code: string, message = 'fs error'): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException
  error.code = code
  return error
}

describe('classifyDownloadError', () => {
  describe('MangaDexNetworkError', () => {
    it('classifies as retryable transient network', () => {
      const result = classifyDownloadError(
        new MangaDexNetworkError('timeout', 'https://example.com')
      )

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.TRANSIENT_NETWORK,
          isRetryable: true
        })
      )
    })
  })

  describe('MangaDexApiError', () => {
    it('classifies a 429 as a retryable rate limit, using retryAfterSeconds as the suggested delay', () => {
      const error = new MangaDexApiError('too many requests', undefined, undefined, 429, 30)

      const result = classifyDownloadError(error)

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.RATE_LIMIT,
          isRetryable: true,
          suggestedDelayMs: 30000
        })
      )
    })

    it('classifies a 429 without retryAfterSeconds with no suggested delay', () => {
      const error = new MangaDexApiError('too many requests', undefined, undefined, 429)

      expect(classifyDownloadError(error).suggestedDelayMs).toBeUndefined()
    })

    it.each([404, 410])('classifies status %d as permanent and not retryable', (statusCode) => {
      const error = new MangaDexApiError('gone', undefined, undefined, statusCode)

      const result = classifyDownloadError(error)

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.PERMANENT_API,
          isRetryable: false
        })
      )
    })

    it('classifies a 403 as permanent and not retryable', () => {
      const error = new MangaDexApiError('forbidden', undefined, undefined, 403)

      expect(classifyDownloadError(error).isRetryable).toBe(false)
    })

    it.each([500, 502, 503])(
      'classifies a %d server error as retryable transient server',
      (statusCode) => {
        const error = new MangaDexApiError('server error', undefined, undefined, statusCode)

        const result = classifyDownloadError(error)

        expect(result).toEqual(
          expect.objectContaining({
            category: DownloadErrorCategory.TRANSIENT_SERVER,
            isRetryable: true
          })
        )
      }
    )

    it('classifies an error status embedded in the API error payload the same as a top-level statusCode', () => {
      const error = new MangaDexApiError('not found', {
        result: 'error',
        errors: [{ id: '1', status: '404', title: 'Not Found', detail: '' }]
      })

      expect(classifyDownloadError(error).category).toBe(DownloadErrorCategory.PERMANENT_API)
    })

    it('defaults an unrecognised API error to retryable transient server', () => {
      const error = new MangaDexApiError('weird error', undefined, undefined, 418)

      const result = classifyDownloadError(error)

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.TRANSIENT_SERVER,
          isRetryable: true
        })
      )
    })
  })

  describe('Node.js filesystem errors', () => {
    it.each(['ENOSPC', 'EPERM', 'EACCES', 'EROFS', 'ENOENT'])(
      'classifies %s as permanent filesystem, requiring user action',
      (code) => {
        const result = classifyDownloadError(fsError(code))

        expect(result).toEqual(
          expect.objectContaining({
            category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
            isRetryable: false,
            requiresUserAction: true
          })
        )
      }
    )

    it.each(['EMFILE', 'ENFILE'])('classifies %s as retryable transient server', (code) => {
      const result = classifyDownloadError(fsError(code))

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.TRANSIENT_SERVER,
          isRetryable: true
        })
      )
    })

    it('classifies an unrecognised error code conservatively as permanent, not retried', () => {
      const result = classifyDownloadError(fsError('EWEIRD'))

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
          isRetryable: false
        })
      )
    })
  })

  describe('generic errors classified by message content', () => {
    it('detects a rate-limit message', () => {
      expect(classifyDownloadError(new Error('HTTP 429 received')).category).toBe(
        DownloadErrorCategory.RATE_LIMIT
      )
      expect(classifyDownloadError(new Error('Rate limit exceeded')).category).toBe(
        DownloadErrorCategory.RATE_LIMIT
      )
    })

    it('detects a not-found message as permanent, not retryable', () => {
      const result = classifyDownloadError(new Error('404 chapter not found'))

      expect(result).toEqual(
        expect.objectContaining({
          category: DownloadErrorCategory.PERMANENT_API,
          isRetryable: false
        })
      )
    })

    it('detects a disk-space message as permanent filesystem', () => {
      expect(classifyDownloadError(new Error('write failed: ENOSPC')).category).toBe(
        DownloadErrorCategory.PERMANENT_FILESYSTEM
      )
    })

    it('detects permission-related messages as permanent filesystem', () => {
      expect(classifyDownloadError(new Error('EACCES: permission denied')).isRetryable).toBe(false)
      expect(classifyDownloadError(new Error('EPERM: operation not permitted')).isRetryable).toBe(
        false
      )
    })

    it('falls back to unknown but retryable for an unrecognised message', () => {
      const result = classifyDownloadError(new Error('something weird happened'))

      expect(result).toEqual(
        expect.objectContaining({ category: DownloadErrorCategory.UNKNOWN, isRetryable: true })
      )
    })

    it('falls back to unknown but retryable for a non-Error thrown value', () => {
      const result = classifyDownloadError('a plain string error')

      expect(result).toEqual(
        expect.objectContaining({ category: DownloadErrorCategory.UNKNOWN, isRetryable: true })
      )
    })
  })
})

describe('getErrorSummary', () => {
  it('includes the classification category and the error name/message for an Error', () => {
    expect(getErrorSummary(new Error('boom'))).toBe('[unknown] Error: boom')
  })

  it('stringifies a non-Error object value', () => {
    expect(getErrorSummary({ foo: 'bar' })).toBe('[unknown] {"foo":"bar"}')
  })

  it('stringifies a primitive non-Error value', () => {
    expect(getErrorSummary(42)).toBe('[unknown] 42')
  })
})
