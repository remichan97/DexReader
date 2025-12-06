import { useState } from 'react'
import { retry, type RetryOptions } from '@renderer/utils/retry'

interface UseRetryResult<T> {
  execute: () => Promise<T | null>
  isLoading: boolean
  error: Error | null
  attemptCount: number
  retry: () => void
}

/**
 * Hook for retrying async operations with exponential backoff
 *
 * @example
 * const { execute, isLoading, error, retry } = useRetry(
 *   async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   },
 *   { maxAttempts: 3 }
 * )
 */
export function useRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): UseRetryResult<T> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)

  const execute = async (): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    setAttemptCount(0)

    try {
      const result = await retry(fn, {
        ...options,
        onRetry: (attempt, err) => {
          setAttemptCount(attempt)
          options.onRetry?.(attempt, err)
        }
      })
      return result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const retryFn = (): void => {
    void execute()
  }

  return { execute, isLoading, error, attemptCount, retry: retryFn }
}
