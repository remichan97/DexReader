export interface LocalizedString {
  [locale: string]: string
}

export interface EndpointLimit {
  tokens: number
  lastRefill: number
}
