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
