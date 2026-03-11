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
    }
  }

  async waitForToken(endpoint?: string): Promise<void> {
    // Refill global tokens based on elapsed time
    // Check whether the endpoint has its own limit
    // Wait till both global and endpoint tokens are available
    // Return when a request can proceed

    // Refill global tokens
    const now = Date.now()
    const elapsed = now - this.lastGlobalRefill
    const tokensToAdd = Math.floor((elapsed / 1000) * this.globalRefillRate)
    if (tokensToAdd > 0) {
      this.globalTokens = Math.min(this.globalTokens + tokensToAdd, this.globalCapacity)
      this.lastGlobalRefill = now
    }

    // Refill endpoint tokens
    let endpointLimit: EndpointLimit | undefined
    let endpointCapacity: number = ApiConfig.GLOBAL_RATE_LIMIT
    let endpointRefillRate: number = ApiConfig.GLOBAL_RATE_LIMIT

    if (endpoint) {
      const config = this.endpointConfigs[endpoint]
      endpointCapacity = config?.capacity ?? ApiConfig.GLOBAL_RATE_LIMIT
      endpointRefillRate = config?.refillRatePerSecond ?? ApiConfig.GLOBAL_RATE_LIMIT

      endpointLimit = this.endpointLimits.get(endpoint)
      if (endpointLimit) {
        const endpointElapsed = now - endpointLimit.lastRefill
        const endpointTokensToAdd = Math.floor((endpointElapsed / 1000) * endpointRefillRate)
        if (endpointTokensToAdd > 0) {
          endpointLimit.tokens = Math.min(
            endpointLimit.tokens + endpointTokensToAdd,
            endpointCapacity
          )
          endpointLimit.lastRefill = now
        }
      } else {
        endpointLimit = {
          tokens: endpointCapacity,
          lastRefill: now
        }
        this.endpointLimits.set(endpoint, endpointLimit)
      }
    }

    // Wait until tokens are available
    while (this.globalTokens <= 0 || (endpointLimit && endpointLimit.tokens <= 0)) {
      await new Promise((resolve) => setTimeout(resolve, 50))

      const now = Date.now()
      const elapsed = now - this.lastGlobalRefill
      const tokensToAdd = Math.floor((elapsed / 1000) * this.globalRefillRate)
      if (tokensToAdd > 0) {
        this.globalTokens = Math.min(this.globalTokens + tokensToAdd, this.globalCapacity)
        this.lastGlobalRefill = now
      }

      if (endpointLimit) {
        const endpointElapsed = now - endpointLimit.lastRefill
        const endpointTokensToAdd = Math.floor((endpointElapsed / 1000) * endpointRefillRate)
        if (endpointTokensToAdd > 0) {
          endpointLimit.tokens = Math.min(
            endpointLimit.tokens + endpointTokensToAdd,
            endpointCapacity
          )
          endpointLimit.lastRefill = now
        }
      }
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
