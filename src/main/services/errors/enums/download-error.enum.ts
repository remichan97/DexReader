export enum DownloadErrorCategory {
  /** Network timeouts, connection errors → Retry with exponential backoff */
  TRANSIENT_NETWORK = 'transient_network',

  /** 5xx server errors, temporary API issues → Retry with standard delay */
  TRANSIENT_SERVER = 'transient_server',

  /** 429 Too Many Requests → Retry with API-specified delay */
  RATE_LIMIT = 'rate_limit',

  /** 404 Not Found, 410 Gone, 403 Forbidden → Don't retry, chapter unavailable */
  PERMANENT_API = 'permanent_api',

  /** Disk full, permission denied → Don't retry, show actionable message */
  PERMANENT_FILESYSTEM = 'permanent_filesystem',

  /** Data validation errors, invalid chapter ID → Don't retry */
  PERMANENT_DATA = 'permanent_data',

  /** Unknown error type → Retry conservatively (default behavior) */
  UNKNOWN = 'unknown'
}
