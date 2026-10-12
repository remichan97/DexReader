import { getResumePage, loadResumePage } from './readingProgress'

describe('getResumePage', () => {
  it('resumes at the saved page for a chapter in progress', () => {
    expect(getResumePage({ currentPage: 12, completed: false })).toBe(12)
  })

  it('starts from the beginning when there is no saved progress', () => {
    expect(getResumePage(undefined)).toBeUndefined()
  })

  it('starts from the beginning when the saved page is the first page', () => {
    expect(getResumePage({ currentPage: 0, completed: false })).toBeUndefined()
  })

  it('starts a finished chapter from the beginning rather than on its last page', () => {
    expect(getResumePage({ currentPage: 49, completed: true })).toBeUndefined()
  })
})

describe('loadResumePage', () => {
  const getAllChapterProgress = vi.fn()

  beforeEach(() => {
    getAllChapterProgress.mockReset()
    vi.stubGlobal('progress', { getAllChapterProgress })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const progressFor = (chapterId: string, currentPage: number, completed = false): object => ({
    mangaId: 'manga-1',
    chapterId,
    currentPage,
    completed,
    lastReadAt: 0
  })

  it("resumes at the requested chapter's saved page, ignoring the manga's other chapters", async () => {
    getAllChapterProgress.mockResolvedValue({
      success: true,
      data: [progressFor('chapter-1', 3), progressFor('chapter-2', 20)]
    })

    await expect(loadResumePage('manga-1', 'chapter-2')).resolves.toBe(20)
    expect(getAllChapterProgress).toHaveBeenCalledWith('manga-1')
  })

  it('starts from the beginning when the chapter has no saved progress', async () => {
    getAllChapterProgress.mockResolvedValue({ success: true, data: [progressFor('chapter-1', 3)] })

    await expect(loadResumePage('manga-1', 'chapter-9')).resolves.toBeUndefined()
  })

  it('starts a finished chapter from the beginning', async () => {
    getAllChapterProgress.mockResolvedValue({
      success: true,
      data: [progressFor('chapter-1', 49, true)]
    })

    await expect(loadResumePage('manga-1', 'chapter-1')).resolves.toBeUndefined()
  })

  it('starts from the beginning when the lookup reports failure', async () => {
    getAllChapterProgress.mockResolvedValue({ success: false, error: { message: 'boom' } })

    await expect(loadResumePage('manga-1', 'chapter-1')).resolves.toBeUndefined()
  })

  it('never blocks opening the chapter when the lookup throws', async () => {
    getAllChapterProgress.mockRejectedValue(new Error('IPC unavailable'))

    await expect(loadResumePage('manga-1', 'chapter-1')).resolves.toBeUndefined()
  })
})
