import { ChapterCacheTier } from '../../enums/settings/chapter-cache-tier.enum'

export interface ReaderPerformanceSettings {
  cacheTier: ChapterCacheTier
  customCacheSize?: number // in bytes, only applicable if cacheTier is Custom
}
