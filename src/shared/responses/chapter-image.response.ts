export interface ChapterImagesResponse {
  result: 'ok' | 'error'
  baseUrl: string // Base URL for image server, only works for 15 minutes
  chapter: {
    hash: string
    data: string[]
    dataSaver: string[]
  }
}
