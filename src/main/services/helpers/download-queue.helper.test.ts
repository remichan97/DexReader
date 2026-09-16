import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'

const getAllWindows = vi.fn()
const send = vi.fn()

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: (): unknown => getAllWindows() }
}))

import {
  calculateAggregateStats,
  emitOverallProgressEvent,
  emitPermanentFailureNotification,
  getRetryDelay
} from './download-queue.helper'

function download(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'ch-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Completed,
    storageSize: 0,
    downloadedAt: 0,
    downloadsBasePath: '/downloads',
    filePath: '/downloads/ch-1.cbz',
    totalPages: 10,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    title: 'Title',
    chapterNumber: '1',
    chapterTitle: 'Chapter 1',
    language: 'en',
    ...overrides
  }
}

function queuedItem(chapterId: string): QueuedDownloads {
  return {
    chapterId,
    mangaId: 'manga-1',
    language: 'en',
    quality: ImageQuality.High,
    addedAt: new Date()
  }
}

describe('calculateAggregateStats', () => {
  it('counts total chapters as queue + active + completed + failed', () => {
    const stats = calculateAggregateStats([queuedItem('queued-1')], 2, [
      download({ status: DownloadStatus.Completed }),
      download({ status: DownloadStatus.Failed })
    ])

    expect(stats.totalChapters).toBe(1 + 2 + 1 + 1)
    expect(stats.completedChapters).toBe(1)
    expect(stats.failedChapters).toBe(1)
    expect(stats.activeDownloads).toBe(2)
  })

  it('sums pages across all downloads but only completed pages for completed ones', () => {
    const stats = calculateAggregateStats([], 0, [
      download({ status: DownloadStatus.Completed, totalPages: 10 }),
      download({ status: DownloadStatus.Queued, totalPages: 5 })
    ])

    expect(stats.totalPages).toBe(15)
    expect(stats.completedPages).toBe(10)
  })

  it('computes overallPercentage from completed/total pages', () => {
    const stats = calculateAggregateStats([], 0, [
      download({ status: DownloadStatus.Completed, totalPages: 25 }),
      download({ status: DownloadStatus.Queued, totalPages: 75 })
    ])

    expect(stats.overallPercentage).toBe(25)
  })

  it('returns 0 percentage without dividing by zero when there are no downloads', () => {
    const stats = calculateAggregateStats([], 0, [])

    expect(stats.overallPercentage).toBe(0)
    expect(stats.totalChapters).toBe(0)
  })
})

describe('emitPermanentFailureNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllWindows.mockReturnValue([{ webContents: { send } }])
  })

  it('sends a default message when none is provided', () => {
    emitPermanentFailureNotification('ch-1')

    expect(send).toHaveBeenCalledWith(
      'download:permanent-failure',
      expect.objectContaining({ chapterId: 'ch-1', message: expect.stringContaining('ch-1') })
    )
  })

  it('sends the custom message when provided', () => {
    emitPermanentFailureNotification('ch-1', 'Custom failure reason')

    expect(send).toHaveBeenCalledWith(
      'download:permanent-failure',
      expect.objectContaining({ message: 'Custom failure reason' })
    )
  })

  it('does nothing when there is no open window', () => {
    getAllWindows.mockReturnValue([])

    expect(() => emitPermanentFailureNotification('ch-1')).not.toThrow()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('emitOverallProgressEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the stats to the first open window', () => {
    getAllWindows.mockReturnValue([{ webContents: { send } }])
    const stats = calculateAggregateStats([], 0, [])

    emitOverallProgressEvent(stats)

    expect(send).toHaveBeenCalledWith('download:queue-progress', stats)
  })

  it('does nothing when there is no open window', () => {
    getAllWindows.mockReturnValue([])

    expect(() => emitOverallProgressEvent(calculateAggregateStats([], 0, []))).not.toThrow()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('getRetryDelay', () => {
  const delays = [5000, 15000, 45000]

  it('returns the delay for the given attempt (1-indexed)', () => {
    expect(getRetryDelay(1, delays)).toBe(5000)
    expect(getRetryDelay(2, delays)).toBe(15000)
    expect(getRetryDelay(3, delays)).toBe(45000)
  })

  it('falls back to the last delay for an attempt beyond the array', () => {
    expect(getRetryDelay(10, delays)).toBe(45000)
  })

  it('falls back to 5000ms when the delays array is empty', () => {
    expect(getRetryDelay(1, [])).toBe(5000)
  })
})
