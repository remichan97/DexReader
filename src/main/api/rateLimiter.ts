import { ApiConfig } from './constants/api-config.constant'
import { EndpointLimit } from './shared/common-types.shared'

export class RateLimiter {
  private globalTokens: number = ApiConfig.GLOBAL_RATE_LIMIT
  private readonly globalCapacity: number = ApiConfig.GLOBAL_RATE_LIMIT
  private readonly globalRefillRate: number = ApiConfig.GLOBAL_RATE_LIMIT
  private lastGlobalRefill: number = Date.now()
  private readonly endpointLimits: Map<string, EndpointLimit> = new Map()

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
    if (endpoint) {
      endpointLimit = this.endpointLimits.get(endpoint)
      if (endpointLimit) {
        const endpointElapsed = now - endpointLimit.lastRefill
        const endpointTokensToAdd = Math.floor(
          (endpointElapsed / 1000) * ApiConfig.GLOBAL_RATE_LIMIT
        )
        if (endpointTokensToAdd > 0) {
          endpointLimit.tokens = Math.min(
            endpointLimit.tokens + endpointTokensToAdd,
            ApiConfig.GLOBAL_RATE_LIMIT
          )
          endpointLimit.lastRefill = now
        }
      } else {
        endpointLimit = {
          tokens: ApiConfig.GLOBAL_RATE_LIMIT,
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
        const endpointTokensToAdd = Math.floor(
          (endpointElapsed / 1000) * ApiConfig.GLOBAL_RATE_LIMIT
        )
        if (endpointTokensToAdd > 0) {
          endpointLimit.tokens = Math.min(
            endpointLimit.tokens + endpointTokensToAdd,
            ApiConfig.GLOBAL_RATE_LIMIT
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
