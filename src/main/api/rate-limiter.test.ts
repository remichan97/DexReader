import { RateLimiter } from './rate-limiter'

/**
 * Awaits waitForToken() under fake timers, advancing the clock in small steps until it
 * resolves - robust regardless of how long the call actually needs to wait (e.g. because
 * it's also gated by the shared global bucket, not just the endpoint-specific one).
 */
async function drain(limiter: RateLimiter, endpoint?: string): Promise<void> {
  const promise = limiter.waitForToken(endpoint)
  let resolved = false
  promise.then(() => {
    resolved = true
  })

  for (let i = 0; i < 1000 && !resolved; i++) {
    await vi.advanceTimersByTimeAsync(50)
  }

  await promise
}

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves immediately while tokens remain in the global bucket', async () => {
    const limiter = new RateLimiter()

    // GLOBAL_RATE_LIMIT is 5 - all 5 should be grantable with no wait.
    for (let i = 0; i < 5; i++) {
      await limiter.waitForToken()
    }
  })

  it('waits for the bucket to refill once tokens are exhausted, without busy-polling', async () => {
    const limiter = new RateLimiter()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    for (let i = 0; i < 5; i++) {
      await limiter.waitForToken()
    }
    setTimeoutSpy.mockClear()

    let resolved = false
    const pending = limiter.waitForToken().then(() => {
      resolved = true
    })

    // No token available yet - must not resolve synchronously.
    await Promise.resolve()
    expect(resolved).toBe(false)

    // A single computed sleep should be scheduled - not a tight 50ms poll loop.
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
    const [, scheduledDelay] = setTimeoutSpy.mock.calls[0]
    expect(scheduledDelay).toBeGreaterThan(50)
    expect(scheduledDelay).toBeLessThanOrEqual(1000)

    await vi.advanceTimersByTimeAsync(1000)
    await pending
    expect(resolved).toBe(true)
  })

  it('enforces the endpoint-specific bucket independently of the global one', async () => {
    const limiter = new RateLimiter()

    // 'network/report' has its own much smaller capacity (20 per minute) and every call
    // also draws from the shared global bucket (capacity 5) - draining 20 of them means
    // waiting out several global refills too, not just the endpoint's.
    for (let i = 0; i < 20; i++) {
      await drain(limiter, 'network/report')
    }

    let resolved = false
    limiter.waitForToken('network/report').then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    for (let i = 0; i < 200 && !resolved; i++) {
      await vi.advanceTimersByTimeAsync(50)
    }
    expect(resolved).toBe(true)
  })

  it('handleRateLimitResponse forces subsequent calls to wait out the delay', async () => {
    const limiter = new RateLimiter()
    const delay = limiter.handleRateLimitResponse(2)
    expect(delay).toBe(2000)

    let resolved = false
    const pending = limiter.waitForToken().then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    // handleRateLimitResponse pushes lastGlobalRefill 2000ms into the future, so the
    // clock must reach that point *and then* accumulate one more token (200ms at the
    // global 5/sec rate) before a call can proceed - not just wait out the 2000ms alone.
    await vi.advanceTimersByTimeAsync(2300)
    await pending
    expect(resolved).toBe(true)
  })
})
