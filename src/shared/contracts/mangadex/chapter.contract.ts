export interface ChapterContract {
  id: string
  title?: string
  volume?: string
  chapter?: string
  pages: number
  translatedLanguage: string
  externalUrl?: string
  publishAt: string
  isUnavailable: boolean
  scanlationGroup: Record<string, string>
}
