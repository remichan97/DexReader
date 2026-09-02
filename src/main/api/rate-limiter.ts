import { ApiConfig } from './constants/api-config.constant'
import { EndpointConfig, EndpointLimit } from './shared/common-types.shared'

export class RateLimiter {
  private globalTokens: number = ApiConfig.GLOBAL_RATE_LIMIT
  private readonly globalCapacity: number = ApiConfig.GLOBAL_RATE_LIMIT
  private readonly globalRefillRate: number = ApiConfig.GLOBAL_RATE_LIMIT
  private lastGlobalRefill: number = Date.now()
  private readonly endpointLimits: Map<string, EndpointLimit> = new Map()
  private readonly endpointConfigs: Record<string, EndpointConfig> = {
    'at-home/server': {
      capacity: 40,
      refillRatePerSecond: 40 / 60 // 40 requests per minute = 0.67 per second
    },
    'network/report': {
      capacity: 20,
      refillRatePerSecond: 20 / 60 // 20 requests per minute = 0.33 per second
    }
  }

  /**
   * Refill global tokens (and the given endpoint's, if any) based on elapsed time.
   * Returns the endpoint's limit entry, creating it at full capacity on first use.
   */
  private refill(endpoint?: string): EndpointLimit | undefined {
    const now = Date.now()

    const globalElapsed = now - this.lastGlobalRefill
    const globalTokensToAdd = Math.floor((globalElapsed / 1000) * this.globalRefillRate)
    if (globalTokensToAdd > 0) {
      this.globalTokens = Math.min(this.globalTokens + globalTokensToAdd, this.globalCapacity)
      this.lastGlobalRefill = now
    }

    if (!endpoint) return undefined

    const config = this.endpointConfigs[endpoint]
    const capacity = config?.capacity ?? ApiConfig.GLOBAL_RATE_LIMIT
    const refillRate = config?.refillRatePerSecond ?? ApiConfig.GLOBAL_RATE_LIMIT

    let endpointLimit = this.endpointLimits.get(endpoint)
    if (!endpointLimit) {
      endpointLimit = { tokens: capacity, lastRefill: now }
      this.endpointLimits.set(endpoint, endpointLimit)
      return endpointLimit
    }

    const endpointElapsed = now - endpointLimit.lastRefill
    const endpointTokensToAdd = Math.floor((endpointElapsed / 1000) * refillRate)
    if (endpointTokensToAdd > 0) {
      endpointLimit.tokens = Math.min(endpointLimit.tokens + endpointTokensToAdd, capacity)
      endpointLimit.lastRefill = now
    }

    return endpointLimit
  }

  // Refill accumulates tokens via Math.floor((elapsedMs / 1000) * refillRate) - for rates
  // that aren't a whole number per second (e.g. 20/60 = 0.3333...), the exact theoretical
  // wait time undershoots that floor() threshold by a hair due to floating-point
  // imprecision, which would otherwise make waitForToken wait a second full cycle instead
  // of converging in one. This buffer guarantees the actual elapsed time comfortably
  // clears the threshold.
  private static readonly REFILL_ROUNDING_BUFFER_MS = 5

  /**
   * Milliseconds until at least one token is available in both the global bucket and
   * (if given) the endpoint bucket - whichever is longer. Zero if a token is already
   * available in both right now.
   */
  private msUntilToken(endpointLimit: EndpointLimit | undefined, endpoint?: string): number {
    const globalWaitMs =
      this.globalTokens > 0
        ? 0
        : (1 / this.globalRefillRate) * 1000 -
          (Date.now() - this.lastGlobalRefill) +
          RateLimiter.REFILL_ROUNDING_BUFFER_MS

    if (!endpointLimit || !endpoint) {
      return Math.max(globalWaitMs, 0)
    }

    const refillRate = this.endpointConfigs[endpoint]?.refillRatePerSecond ?? this.globalRefillRate
    const endpointWaitMs =
      endpointLimit.tokens > 0
        ? 0
        : (1 / refillRate) * 1000 -
          (Date.now() - endpointLimit.lastRefill) +
          RateLimiter.REFILL_ROUNDING_BUFFER_MS

    return Math.max(globalWaitMs, endpointWaitMs, 0)
  }

  async waitForToken(endpoint?: string): Promise<void> {
    let endpointLimit = this.refill(endpoint)

    // A single computed sleep almost always suffices; loop only guards against a
    // concurrent caller consuming the token that just became available underneath us.
    while (this.globalTokens <= 0 || (endpointLimit && endpointLimit.tokens <= 0)) {
      const waitMs = this.msUntilToken(endpointLimit, endpoint)
      await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 1)))
      endpointLimit = this.refill(endpoint)
    }

    this.globalTokens--
    if (endpointLimit) {
      endpointLimit.tokens--
    }
  }

  handleRateLimitResponse(retryAfter?: number): number {
    // Return delay in milliseconds based on Retry-After header or default value
    // If no header is provided, use exponential backoff

    const delay = retryAfter ? retryAfter * 1000 : 1000

    // Reduce tokens to zero to enforce wait
    this.globalTokens = 0
    this.lastGlobalRefill = Date.now() + delay

    // Also reset all endpoint limits
    for (const endpointLimit of this.endpointLimits.values()) {
      endpointLimit.tokens = 0
      endpointLimit.lastRefill = Date.now() + delay
    }

    return delay
  }
}
