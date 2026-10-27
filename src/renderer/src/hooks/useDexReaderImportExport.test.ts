import { act, renderHook } from '@testing-library/react'
import { useDexReaderImportExport } from './useDexReaderImportExport'
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

const removeExportListener = vi.fn()
const removeImportListener = vi.fn()
const onExportLibrary = vi.fn()
const onImportLibrary = vi.fn()
const exportData = vi.fn()
const show = vi.fn()

function fireExport(filePath: string): void {
  const handler = onExportLibrary.mock.calls.at(-1)?.[0] as (path: string) => void
  act(() => handler(filePath))
}

function fireImport(filePath: string): void {
  const handler = onImportLibrary.mock.calls.at(-1)?.[0] as (path: string) => void
  act(() => handler(filePath))
}

const IMPORT_RESULT = {
  importedMangaCount: 3,
  importedCollectionsCount: 1,
  importedMangaProgressCount: 0,
  importedReaderOverridesCount: 0
} as never

beforeEach(() => {
  vi.clearAllMocks()
  releaseBackupLock()
  useToastStore.setState({ ...TOAST_INITIAL_STATE, show }, true)
  onExportLibrary.mockReturnValue(removeExportListener)
  onImportLibrary.mockReturnValue(removeImportListener)
  globalThis.api = { onExportLibrary, onImportLibrary } as unknown as typeof globalThis.api
  globalThis.dexreader = { exportData } as unknown as typeof globalThis.dexreader
})

afterEach(() => {
  releaseBackupLock()
})

describe('listeners', () => {
  it('registers both menu listeners on mount and removes them on unmount', () => {
    const { unmount } = renderHook(() => useDexReaderImportExport())

    expect(onExportLibrary).toHaveBeenCalledWith(expect.any(Function))
    expect(onImportLibrary).toHaveBeenCalledWith(expect.any(Function))

    unmount()

    expect(removeExportListener).toHaveBeenCalled()
    expect(removeImportListener).toHaveBeenCalled()
  })

  it('opens the export dialog with the chosen path', () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    fireExport('C:/backups/library.dexreader')

    expect(result.current.exportDialogOpen).toBe(true)
    expect(result.current.exportFilePath).toBe('C:/backups/library.dexreader')
  })

  it('opens the import dialog with the chosen path', () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    fireImport('C:/backups/library.dexreader')

    expect(result.current.importDialogOpen).toBe(true)
    expect(result.current.importFilePath).toBe('C:/backups/library.dexreader')
  })
})

describe('backup lock', () => {
  it('holds the lock while a dialog is open and releases it when the dialog closes', () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    fireImport('a.dexreader')
    expect(isBackupLockHeld()).toBe(true)

    act(() => result.current.handleCloseImportDialog())

    expect(isBackupLockHeld()).toBe(false)
    expect(result.current.importDialogOpen).toBe(false)
    expect(result.current.importFilePath).toBeNull()
  })

  it('ignores a second request while another backup operation is active, and says so', () => {
    const { result } = renderHook(() => useDexReaderImportExport())
    tryAcquireBackupLock() // e.g. a Mihon import is running

    fireExport('a.dexreader')
    fireImport('b.dexreader')

    expect(result.current.exportDialogOpen).toBe(false)
    expect(result.current.importDialogOpen).toBe(false)
    expect(show).toHaveBeenCalledTimes(2)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'backup.busyTitle', variant: 'warning' })
    )
  })

  it('does not let an import start while an export dialog is open', () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    fireExport('a.dexreader')
    fireImport('b.dexreader')

    expect(result.current.exportDialogOpen).toBe(true)
    expect(result.current.importDialogOpen).toBe(false)
  })

  it('releases the lock if the host unmounts with a dialog open', () => {
    const { unmount } = renderHook(() => useDexReaderImportExport())
    fireExport('a.dexreader')

    unmount()

    expect(isBackupLockHeld()).toBe(false)
  })
})

describe('handleExport', () => {
  it('closes the dialog, releases the lock and reports success', async () => {
    exportData.mockResolvedValue({ success: true, data: { exportedMangaCount: 7 } })
    const { result } = renderHook(() => useDexReaderImportExport())
    fireExport('a.dexreader')

    await act(async () => {
      await result.current.handleExport({} as never)
    })

    expect(exportData).toHaveBeenCalledWith('a.dexreader', {})
    expect(result.current.exportDialogOpen).toBe(false)
    expect(isBackupLockHeld()).toBe(false)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Export Complete', variant: 'success' })
    )
  })

  it('keeps the dialog and the lock when the export fails, showing the error inline', async () => {
    exportData.mockResolvedValue({ success: false, error: { message: 'disk full' } })
    const { result } = renderHook(() => useDexReaderImportExport())
    fireExport('a.dexreader')

    await act(async () => {
      await result.current.handleExport({} as never)
    })

    expect(result.current.exportError).toBe('disk full')
    expect(result.current.exportDialogOpen).toBe(true)
    expect(isBackupLockHeld()).toBe(true)
  })

  it('reports an exception as an inline error', async () => {
    exportData.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useDexReaderImportExport())
    fireExport('a.dexreader')

    await act(async () => {
      await result.current.handleExport({} as never)
    })

    expect(result.current.exportError).toBe('boom')
  })

  it('does nothing without a chosen path', async () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    await act(async () => {
      await result.current.handleExport({} as never)
    })

    expect(exportData).not.toHaveBeenCalled()
  })

  it('cannot be closed while the export is running', async () => {
    let finish: (value: unknown) => void = () => undefined
    exportData.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { result } = renderHook(() => useDexReaderImportExport())
    fireExport('a.dexreader')

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.handleExport({} as never)
    })
    act(() => result.current.handleCloseExportDialog())

    expect(result.current.exportDialogOpen).toBe(true)
    expect(isBackupLockHeld()).toBe(true)

    await act(async () => {
      finish({ success: true, data: { exportedMangaCount: 1 } })
      await pending
    })
  })
})

describe('handleImportComplete', () => {
  it('refreshes the stores and summarises what was imported', async () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    await act(async () => {
      await result.current.handleImportComplete(IMPORT_RESULT)
    })

    expect(refreshAfterImport).toHaveBeenCalledTimes(1)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Complete',
        message: 'Imported: 3 manga, 1 collections',
        variant: 'success'
      })
    )
  })

  it('turns section errors into a warning', async () => {
    const { result } = renderHook(() => useDexReaderImportExport())

    await act(async () => {
      await result.current.handleImportComplete({
        importedMangaCount: 0,
        importedCollectionsCount: 0,
        importedMangaProgressCount: 0,
        importedReaderOverridesCount: 0,
        sectionErrors: { progress: 'x' }
      } as never)
    })

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import Completed with Warnings',
        message: 'Import complete. Progress import had errors',
        variant: 'warning'
      })
    )
  })
})
