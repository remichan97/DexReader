import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'

const { batchMarkDownloadsState, markDownloadState, getAllWindows, send } = vi.hoisted(() => ({
  batchMarkDownloadsState: vi.fn(),
  markDownloadState: vi.fn(),
  getAllWindows: vi.fn(() => []),
  send: vi.fn()
}))

vi.mock('../../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: { batchMarkDownloadsState, markDownloadState }
}))

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: (): unknown => getAllWindows() }
}))

vi.mock('../logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

import { DownloadBatchWriter } from './batch-writer'

function command(chapterId: string): MarkDownloadStateCommand {
  return { chapterId, storageSize: 100, totalPages: 5, isDownloaded: true }
}

describe('DownloadBatchWriter', () => {
  let writer: DownloadBatchWriter

  beforeEach(() => {
    vi.clearAllMocks()
    getAllWindows.mockReturnValue([])
    vi.useFakeTimers()
    writer = new DownloadBatchWriter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('scheduleUpdate', () => {
    it('does not write immediately for a single scheduled update', () => {
      writer.scheduleUpdate(command('ch-1'))

      expect(batchMarkDownloadsState).not.toHaveBeenCalled()
    })

    it('flushes automatically once the 500ms interval elapses', () => {
      writer.scheduleUpdate(command('ch-1'))

      vi.advanceTimersByTime(500)

      expect(batchMarkDownloadsState).toHaveBeenCalledWith([command('ch-1')])
    })

    it('flushes automatically once 25 updates have been scheduled, without waiting for the timer', () => {
      for (let i = 0; i < 25; i++) {
        writer.scheduleUpdate(command(`ch-${i}`))
      }

      expect(batchMarkDownloadsState).toHaveBeenCalledTimes(1)
      expect(batchMarkDownloadsState).toHaveBeenCalledWith(
        expect.arrayContaining([command('ch-0'), command('ch-24')])
      )
    })

    it('does not schedule a second timer while one is already pending', () => {
      writer.scheduleUpdate(command('ch-1'))
      writer.scheduleUpdate(command('ch-2'))

      vi.advanceTimersByTime(500)

      expect(batchMarkDownloadsState).toHaveBeenCalledTimes(1)
      expect(batchMarkDownloadsState).toHaveBeenCalledWith([command('ch-1'), command('ch-2')])
    })
  })

  describe('flush', () => {
    it('does nothing when there are no pending updates', () => {
      writer.flush()

      expect(batchMarkDownloadsState).not.toHaveBeenCalled()
    })

    it('clears the pending timer so it does not fire again after an explicit flush', () => {
      writer.scheduleUpdate(command('ch-1'))
      writer.flush()

      vi.advanceTimersByTime(500)

      expect(batchMarkDownloadsState).toHaveBeenCalledTimes(1)
    })

    it('falls back to individual writes when the batch write throws', () => {
      batchMarkDownloadsState.mockImplementation(() => {
        throw new Error('batch failed')
      })
      writer.scheduleUpdate(command('ch-1'))
      writer.scheduleUpdate(command('ch-2'))

      writer.flush()

      expect(markDownloadState).toHaveBeenCalledWith(command('ch-1'))
      expect(markDownloadState).toHaveBeenCalledWith(command('ch-2'))
    })

    it('notifies the renderer when even an individual fallback write fails', () => {
      batchMarkDownloadsState.mockImplementation(() => {
        throw new Error('batch failed')
      })
      markDownloadState.mockImplementation(() => {
        throw new Error('individual write failed')
      })
      getAllWindows.mockReturnValue([{ webContents: { send } }] as never)
      writer.scheduleUpdate(command('ch-1'))

      writer.flush()

      expect(send).toHaveBeenCalledWith(
        'download:database-error',
        expect.objectContaining({ chapterId: 'ch-1' })
      )
    })

    it('clears pending updates so a later flush does not re-send the same batch', () => {
      writer.scheduleUpdate(command('ch-1'))
      writer.flush()

      writer.flush()

      expect(batchMarkDownloadsState).toHaveBeenCalledTimes(1)
    })
  })
})
