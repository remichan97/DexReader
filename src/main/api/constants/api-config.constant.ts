const BASE_API_URL = 'https://api.mangadex.org'
const BASE_CDN_URL = 'https://uploads.mangadex.org'

export const ApiConfig = {
  BASE_API_URL,
  BASE_CDN_URL,
  HEALTH_CHECK_URL: `${BASE_API_URL}/ping`,
  NETWORK_REPORT_URL: `https://api.mangadex.network/report`,
  REQUEST_USER_AGENT: 'DexReader/1.0.0 (https://github.com/remichan97/DexReader)',
  API_TIMEOUT_MS: 15000,
  IMAGE_TIMEOUT_MS: 30000,
  GLOBAL_RATE_LIMIT: 5,
  AT_HOME_RATE_LIMIT: 40,
  MAX_LIMIT: 100, // Max limit per request
  MAX_FEED_LIMIT: 500, // Max limit for feed requests
  MAX_OFFSET_PLUS_LIMIT: 10000 // Max offset + limit per request
} as const
