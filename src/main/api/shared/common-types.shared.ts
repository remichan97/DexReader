export interface LocalizedString {
  [locale: string]: string
}

export interface EndpointLimit {
  tokens: number
  lastRefill: number
}

export interface EndpointConfig {
  capacity: number
  refillRatePerSecond: number
}
