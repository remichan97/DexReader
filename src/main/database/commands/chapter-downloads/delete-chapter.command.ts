export interface DeleteChapterCommand {
  chapterId: string
  isDeletePermanent: boolean // If true, this most like means the chapter is being both deleted at local filesystem level, and the database, if false, this likely means that the entry will only be hidden away from the UI (when they clear the completed downloads items), but the files will remain on disk, and WILL be used by the app should they choose to read the chapter again
}
