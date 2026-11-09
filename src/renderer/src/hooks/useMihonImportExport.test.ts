import { act, renderHook } from '@testing-library/react'
import { useMihonImportExport } from './useMihonImportExport'
import { useToastStore } from '@renderer/stores'
import {
  isBackupLockHeld,
  releaseBackupLock,
  tryAcquireBackupLock
} from '@renderer/utils/backupOperationLock'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))
vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const refreshAfterImport = vi.fn()
vi.mock('@renderer/utils/refreshAfterImport', () => ({
  refreshAfterImport: () => refreshAfterImport()
}))

const TOAST_INITIAL_STATE = useToastStore.getState()

const removeImportListener = vi.fn()
const removeExportListener = vi.fn()
const onImportTachiyomi = vi.fn()
const onExportTachiyomi = vi.fn()
const importBackup = vi.fn()
const exportBackup = vi.fn()
const cancelImport = vi.fn()
const show = vi.fn()

async function fireImport(filePath: string): Promise<void> {
  const handler = onImportTachiyomi.mock.calls.at(-1)?.[0] as (path: string) => Promise<void>
  await act(async () => {
    await handler(filePath)
  })
}

async function fireExport(filePath: string): Promise<void> {
  const handler = onExportTachiyomi.mock.calls.at(-1)?.[0] as (path: string) => Promise<void>
  await act(async () => {
    await handler(filePath)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  releaseBackupLock()
  useToastStore.setState({ ...TOAST_INITIAL_STATE, show }, true)
  onImportTachiyomi.mockReturnValue(removeImportListener)
  onExportTachiyomi.mockReturnValue(removeExportListener)
  globalThis.api = { onImportTachiyomi, onExportTachiyomi } as unknown as typeof globalThis.api
  globalThis.mihon = {
    importBackup,
    exportBackup,
    cancelImport
  } as unknown as typeof globalThis.mihon
})

afterEach(() => {
  releaseBackupLock()
})

describe('listeners', () => {
  it('registers both menu listeners on mount and removes them on unmount', () => {
    const { unmount } = renderHook(() => useMihonImportExport())

    expect(onImportTachiyomi).toHaveBeenCalledWith(expect.any(Function))
    expect(onExportTachiyomi).toHaveBeenCalledWith(expect.any(Function))

    unmount()

    expect(removeImportListener).toHaveBeenCalled()
    expect(removeExportListener).toHaveBeenCalled()
  })
})

describe('import', () => {
  it('imports the chosen file, refreshes the stores and exposes the result', async () => {
    const data = { importedMangaCount: 4, skippedMangaCount: 1, failedMangaCount: 0 }
    importBackup.mockResolvedValue({ success: true, data })
    const { result } = renderHook(() => useMihonImportExport())

    await fireImport('C:/backups/library.tachibk')

    expect(importBackup).toHaveBeenCalledWith('C:/backups/library.tachibk')
    expect(refreshAfterImport).toHaveBeenCalledTimes(1)
    expect(result.current.importResult).toEqual(data)
    expect(result.current.isImporting).toBe(false)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Complete',
        message: 'Imported 4 manga, skipped 1, failed 0',
        variant: 'success'
      })
    )
  })

  it('warns when some entries failed', async () => {
    importBackup.mockResolvedValue({
      success: true,
      data: { importedMangaCount: 1, skippedMangaCount: 0, failedMangaCount: 2 }
    })
    renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ variant: 'warning' }))
  })

  it('shows the error and refreshes nothing when the import is rejected', async () => {
    importBackup.mockResolvedValue({ success: false, error: { message: 'bad file' } })
    const { result } = renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(refreshAfterImport).not.toHaveBeenCalled()
    expect(result.current.importResult).toBeNull()
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import Failed', message: 'bad file', variant: 'error' })
    )
  })

  it('reports an exception and still releases the lock', async () => {
    importBackup.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(result.current.isImporting).toBe(false)
    expect(isBackupLockHeld()).toBe(false)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import Failed', variant: 'error' })
    )
  })

  it('shows progress while importing and releases the lock afterwards', async () => {
    let finish: (value: unknown) => void = () => undefined
    importBackup.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { result } = renderHook(() => useMihonImportExport())
    const handler = onImportTachiyomi.mock.calls.at(-1)?.[0] as (path: string) => Promise<void>

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = handler('a.tachibk')
    })

    expect(result.current.isImporting).toBe(true)
    expect(isBackupLockHeld()).toBe(true)

    await act(async () => {
      finish({
        success: true,
        data: { importedMangaCount: 0, skippedMangaCount: 0, failedMangaCount: 0 }
      })
      await pending
    })

    expect(result.current.isImporting).toBe(false)
    expect(isBackupLockHeld()).toBe(false)
  })

  it('ignores a second import while one is running', async () => {
    tryAcquireBackupLock()
    renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(importBackup).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'backup.busyTitle', variant: 'warning' })
    )
  })

  it('clears the result on request', async () => {
    importBackup.mockResolvedValue({
      success: true,
      data: { importedMangaCount: 1, skippedMangaCount: 0, failedMangaCount: 0 }
    })
    const { result } = renderHook(() => useMihonImportExport())
    await fireImport('a.tachibk')

    act(() => result.current.clearImportResult())

    expect(result.current.importResult).toBeNull()
  })
})

describe('export', () => {
  it('exports to the chosen path and reports the count', async () => {
    exportBackup.mockResolvedValue({ success: true, data: { exportedCount: 9 } })
    renderHook(() => useMihonImportExport())

    await fireExport('C:/backups/library.tachibk')

    expect(exportBackup).toHaveBeenCalledWith('C:/backups/library.tachibk')
    expect(isBackupLockHeld()).toBe(false)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export Complete',
        message: 'Exported 9 manga to Mihon backup',
        variant: 'success'
      })
    )
  })

  it('shows the error when the export is rejected', async () => {
    exportBackup.mockResolvedValue({ success: false, error: { message: 'no manga' } })
    renderHook(() => useMihonImportExport())

    await fireExport('a.tachibk')

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Export Failed', message: 'no manga', variant: 'error' })
    )
  })

  it('reports an exception and still releases the lock', async () => {
    exportBackup.mockRejectedValue(new Error('boom'))
    renderHook(() => useMihonImportExport())

    await fireExport('a.tachibk')

    expect(isBackupLockHeld()).toBe(false)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Export Failed', variant: 'error' })
    )
  })

  it('is refused while another backup operation is active', async () => {
    tryAcquireBackupLock()
    renderHook(() => useMihonImportExport())

    await fireExport('a.tachibk')

    expect(exportBackup).not.toHaveBeenCalled()
  })
})

describe('import failures', () => {
  it.each([
    'MIHON_BACKUP_JSON',
    'MIHON_BACKUP_EMPTY',
    'MIHON_BACKUP_UNRECOGNISED',
    'MIHON_BACKUP_FILE_MISSING'
  ])('shows the translated message for %s', async (code) => {
    importBackup.mockResolvedValue({ success: false, error: { code, message: 'raw message' } })
    renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Failed',
        message: `dialogs:mihonImport.errors.${code}`
      })
    )
  })

  it('shows the raw message for an error it does not know', async () => {
    importBackup.mockResolvedValue({
      success: false,
      error: { code: 'EACCES', message: 'permission denied' }
    })
    renderHook(() => useMihonImportExport())

    await fireImport('a.tachibk')

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ message: 'permission denied' }))
  })
})

describe('addSkippedToLibrary', () => {
  const FIRST_RESULT = {
    importedMangaCount: 4,
    skippedMangaCount: 1,
    failedMangaCount: 0,
    errors: [],
    importedMangaIds: ['a', 'b', 'c', 'd'],
    skippedOtherLanguage: [
      { mangaId: 'vi-1', title: 'One' },
      { mangaId: 'vi-2', title: 'Two' }
    ],
    ignoredOtherSourceCount: 3
  }

  const ADD_BACK_RESULT = {
    importedMangaCount: 1,
    skippedMangaCount: 0,
    failedMangaCount: 0,
    importedMangaIds: ['vi-1'],
    skippedOtherLanguage: [{ mangaId: 'vi-2', title: 'Two' }]
  }

  // Import once, so there is a result (and a file) to add skipped titles back from
  async function renderWithResult(): Promise<{
    result: { current: ReturnType<typeof useMihonImportExport> }
  }> {
    importBackup.mockResolvedValueOnce({ success: true, data: FIRST_RESULT })
    const rendered = renderHook(() => useMihonImportExport())
    await fireImport('C:/backups/library.tachibk')
    refreshAfterImport.mockClear()
    importBackup.mockClear()
    show.mockClear()
    return rendered
  }

  it('re-imports the same file with the chosen ids', async () => {
    const { result } = await renderWithResult()
    importBackup.mockResolvedValue({ success: true, data: ADD_BACK_RESULT })

    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(importBackup).toHaveBeenCalledWith('C:/backups/library.tachibk', ['vi-1'])
    expect(refreshAfterImport).toHaveBeenCalledTimes(1)
  })

  it('folds the result into the original and keeps only what is still left out', async () => {
    const { result } = await renderWithResult()
    importBackup.mockResolvedValue({ success: true, data: ADD_BACK_RESULT })

    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(result.current.importResult).toMatchObject({
      importedMangaCount: 5,
      skippedMangaCount: 1,
      importedMangaIds: ['a', 'b', 'c', 'd', 'vi-1'],
      skippedOtherLanguage: [{ mangaId: 'vi-2', title: 'Two' }],
      // The first pass's count stays; the second pass doesn't report one
      ignoredOtherSourceCount: 3
    })
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'dialogs:importResult.skippedLanguages.addedTitle',
        variant: 'success'
      })
    )
  })

  it('shows progress while adding, and releases the lock afterwards', async () => {
    const { result } = await renderWithResult()
    let finish: (value: unknown) => void = () => undefined
    importBackup.mockReturnValue(new Promise((resolve) => (finish = resolve)))

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(result.current.isAddingSkipped).toBe(true)
    expect(isBackupLockHeld()).toBe(true)

    await act(async () => {
      finish({ success: true, data: ADD_BACK_RESULT })
      await pending
    })

    expect(result.current.isAddingSkipped).toBe(false)
    expect(isBackupLockHeld()).toBe(false)
  })

  it('tells the user when the file has moved, and keeps the list as it was', async () => {
    const { result } = await renderWithResult()
    importBackup.mockResolvedValue({
      success: false,
      error: { code: 'MIHON_BACKUP_FILE_MISSING', message: 'The backup file could not be found' }
    })

    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'dialogs:importResult.skippedLanguages.addFailedTitle',
        message: 'dialogs:mihonImport.errors.MIHON_BACKUP_FILE_MISSING',
        variant: 'error'
      })
    )
    expect(result.current.importResult?.skippedOtherLanguage).toHaveLength(2)
    expect(refreshAfterImport).not.toHaveBeenCalled()
  })

  it('reports an exception and still releases the lock', async () => {
    const { result } = await renderWithResult()
    importBackup.mockRejectedValue(new Error('boom'))

    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(isBackupLockHeld()).toBe(false)
    expect(result.current.isAddingSkipped).toBe(false)
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
  })

  it('is refused while another backup operation is active', async () => {
    const { result } = await renderWithResult()
    tryAcquireBackupLock()

    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(importBackup).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ title: 'backup.busyTitle' }))
  })

  it('does nothing without a result, or without any chosen titles', async () => {
    const empty = renderHook(() => useMihonImportExport())
    await act(async () => {
      await empty.result.current.addSkippedToLibrary(['vi-1'])
    })
    expect(importBackup).not.toHaveBeenCalled()

    const { result } = await renderWithResult()
    await act(async () => {
      await result.current.addSkippedToLibrary([])
    })
    expect(importBackup).not.toHaveBeenCalled()
  })

  it('forgets the file once the result is dismissed', async () => {
    const { result } = await renderWithResult()

    act(() => result.current.clearImportResult())
    await act(async () => {
      await result.current.addSkippedToLibrary(['vi-1'])
    })

    expect(importBackup).not.toHaveBeenCalled()
  })
})

describe('handleCancelImport', () => {
  it('tells the main process and confirms to the user', async () => {
    cancelImport.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useMihonImportExport())

    await act(async () => {
      await result.current.handleCancelImport()
    })

    expect(cancelImport).toHaveBeenCalled()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Import Cancelled' }))
  })

  it('stays quiet when the cancel fails', async () => {
    cancelImport.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useMihonImportExport())

    await act(async () => {
      await result.current.handleCancelImport()
    })

    expect(show).not.toHaveBeenCalled()
  })
})
