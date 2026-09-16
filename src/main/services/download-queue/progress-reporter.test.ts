import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'

const { getAllDownloads, getAllWindows, send } = vi.hoisted(() => ({
  getAllDownloads: vi.fn<() => ChapterDownloadContract[]>(() => []),
  getAllWindows: vi.fn(() => [{ webContents: { send: vi.fn() } }]),
  send: vi.fn()
}))

vi.mock('../../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: { getAllDownloads }
}))

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: (): unknown => getAllWindows() }
}))

import { DownloadProgressReporter } from './progress-reporter'

describe('DownloadProgressReporter', () => {
  let reporter: DownloadProgressReporter

  beforeEach(() => {
    vi.clearAllMocks()
    getAllDownloads.mockReturnValue([])
    getAllWindows.mockReturnValue([{ webContents: { send } }] as never)
    vi.useFakeTimers()
    vi.setSystemTime(0)
    reporter = new DownloadProgressReporter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The reporter's constructor stamps `lastEmit` at construction time (t=0 here), so the
  // throttle window is already "active" immediately after construction - every test
  // advances past the 100ms interval first to get a real, un-throttled emit to observe.

  it('emits once the throttle interval has elapsed since construction', () => {
    vi.setSystemTime(100)
    reporter.emitIfDue([], 0)

    expect(send).toHaveBeenCalledWith('download:queue-progress', expect.any(Object))
  })

  it('throttles: does not emit again within 100ms of the last emit', () => {
    vi.setSystemTime(100)
    reporter.emitIfDue([], 0)
    send.mockClear()

    vi.setSystemTime(150)
    reporter.emitIfDue([], 0)

    expect(send).not.toHaveBeenCalled()
  })

  it('emits again once the throttle interval has elapsed since the last emit', () => {
    vi.setSystemTime(100)
    reporter.emitIfDue([], 0)
    send.mockClear()

    vi.setSystemTime(250)
    reporter.emitIfDue([], 0)

    expect(send).toHaveBeenCalledTimes(1)
  })

  it('caches getAllDownloads for a second, not re-querying on every throttled-through emit', () => {
    vi.setSystemTime(100)
    reporter.emitIfDue([], 0)
    expect(getAllDownloads).toHaveBeenCalledTimes(1)

    vi.setSystemTime(300)
    reporter.emitIfDue([], 0)

    expect(getAllDownloads).toHaveBeenCalledTimes(1)
  })

  it('re-queries getAllDownloads once the 1-second cache has expired', () => {
    vi.setSystemTime(100)
    reporter.emitIfDue([], 0)
    expect(getAllDownloads).toHaveBeenCalledTimes(1)

    vi.setSystemTime(1200)
    reporter.emitIfDue([], 0)

    expect(getAllDownloads).toHaveBeenCalledTimes(2)
  })
})
