export interface DeleteChapterCommand {
  chapterId: string
  isDeletePermanent: boolean // Whether to permanently delete files or just hide it away in DownloadsView
}
