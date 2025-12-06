interface RetryOptions {
  maxAttempts?: number
  delay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Retry a promise-based function with exponential backoff
 *
 * @example
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3, delay: 1000, exponentialBackoff: true }
 * )
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delay = 1000, exponentialBackoff = true, onRetry } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError)
        const waitTime = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  // At this point, all attempts failed
  if (!lastError) {
    throw new Error('Retry failed with no error captured')
  }
  throw lastError
}

export type { RetryOptions }
