import { act, renderHook, waitFor } from '@testing-library/react'
import { useFileSystem } from './useFileSystem'
import type { IpcResponse } from '../../../preload/ipc.types'

type FileSystemMock = {
  [K in keyof typeof globalThis.fileSystem]: ReturnType<typeof vi.fn>
}

function mockFileSystem(): FileSystemMock {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    isExists: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    getAllowedPaths: vi.fn(),
    selectDownloadsFolder: vi.fn(),
    openDownloadsFolder: vi.fn(),
    copyFile: vi.fn(),
    appendFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    rmdir: vi.fn()
  }
}

function okResponse<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

function errorResponse<T>(): IpcResponse<T> {
  return { success: false, error: { name: 'Error', message: 'boom', code: 'ERR_BOOM' } }
}

interface Case {
  name: string
  ipcMethod: keyof FileSystemMock
  call: (fs: ReturnType<typeof useFileSystem>) => Promise<unknown>
  ipcArgs: unknown[]
  successData: unknown
  fallback: unknown
}

const CASES: Case[] = [
  {
    name: 'readFile',
    ipcMethod: 'readFile',
    call: (fs) => fs.readFile('/f.txt', 'utf-8'),
    ipcArgs: ['/f.txt', 'utf-8'],
    successData: 'file contents',
    fallback: null
  },
  {
    name: 'writeFile',
    ipcMethod: 'writeFile',
    call: (fs) => fs.writeFile('/f.txt', 'data', 'utf-8'),
    ipcArgs: ['/f.txt', 'data', 'utf-8'],
    successData: true,
    fallback: false
  },
  {
    name: 'exists',
    ipcMethod: 'isExists',
    call: (fs) => fs.exists('/f.txt'),
    ipcArgs: ['/f.txt'],
    successData: true,
    fallback: false
  },
  {
    name: 'stat',
    ipcMethod: 'stat',
    call: (fs) => fs.stat('/f.txt'),
    ipcArgs: ['/f.txt'],
    successData: {
      isFile: true,
      isDirectory: false,
      size: 10,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    fallback: null
  },
  {
    name: 'readdir',
    ipcMethod: 'readdir',
    call: (fs) => fs.readdir('/dir'),
    ipcArgs: ['/dir'],
    successData: ['a.txt', 'b.txt'],
    fallback: []
  },
  {
    name: 'copyFile',
    ipcMethod: 'copyFile',
    call: (fs) => fs.copyFile('/a.txt', '/b.txt'),
    ipcArgs: ['/a.txt', '/b.txt'],
    successData: true,
    fallback: false
  },
  {
    name: 'rename',
    ipcMethod: 'rename',
    call: (fs) => fs.rename('/old.txt', '/new.txt'),
    ipcArgs: ['/old.txt', '/new.txt'],
    successData: true,
    fallback: false
  },
  {
    name: 'mkdir',
    ipcMethod: 'mkdir',
    call: (fs) => fs.mkdir('/dir'),
    ipcArgs: ['/dir'],
    successData: true,
    fallback: false
  },
  {
    name: 'unlink',
    ipcMethod: 'unlink',
    call: (fs) => fs.unlink('/f.txt'),
    ipcArgs: ['/f.txt'],
    successData: true,
    fallback: false
  },
  {
    name: 'rmdir',
    ipcMethod: 'rmdir',
    call: (fs) => fs.rmdir('/dir'),
    ipcArgs: ['/dir'],
    successData: true,
    fallback: false
  },
  {
    name: 'getAllowedPaths',
    ipcMethod: 'getAllowedPaths',
    call: (fs) => fs.getAllowedPaths(),
    ipcArgs: [],
    successData: { appData: '/appdata', downloads: '/downloads' },
    fallback: null
  },
  {
    name: 'selectDownloadsFolder',
    ipcMethod: 'selectDownloadsFolder',
    call: (fs) => fs.selectDownloadsFolder(),
    ipcArgs: [],
    successData: { cancelled: false, filePath: '/downloads' },
    fallback: null
  },
  {
    name: 'appendFile',
    ipcMethod: 'appendFile',
    call: (fs) => fs.appendFile('/f.txt', 'more text'),
    ipcArgs: ['/f.txt', 'more text'],
    successData: true,
    fallback: false
  }
]

let fsMock: FileSystemMock

beforeEach(() => {
  fsMock = mockFileSystem()
  globalThis.fileSystem = fsMock as unknown as typeof globalThis.fileSystem
})

describe.each(CASES)('$name', ({ ipcMethod, call, ipcArgs, successData, fallback }) => {
  it('returns the response data and forwards args to the IPC channel on success', async () => {
    fsMock[ipcMethod].mockResolvedValue(okResponse(successData))
    const { result } = renderHook(() => useFileSystem())

    const returned = await act(async () => call(result.current))

    expect(fsMock[ipcMethod]).toHaveBeenCalledWith(...ipcArgs)
    expect(returned).toEqual(successData)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns the fallback value and sets the error state on an unsuccessful response', async () => {
    fsMock[ipcMethod].mockResolvedValue(errorResponse())
    const { result } = renderHook(() => useFileSystem())

    const returned = await act(async () => call(result.current))

    expect(returned).toEqual(fallback)
    expect(result.current.error).toEqual({
      message: 'boom',
      code: 'ERR_BOOM',
      details: undefined
    })
  })
})

it('toggles isLoading to true while the IPC call is in flight', async () => {
  let resolveCall: (value: IpcResponse<boolean>) => void = () => {}
  fsMock.mkdir.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveCall = resolve
      })
  )
  const { result } = renderHook(() => useFileSystem())

  let callPromise!: Promise<unknown>
  act(() => {
    callPromise = result.current.mkdir('/dir')
  })

  await waitFor(() => expect(result.current.isLoading).toBe(true))

  await act(async () => {
    resolveCall(okResponse(true))
    await callPromise
  })

  expect(result.current.isLoading).toBe(false)
})

it('clears a previously set error on the next call, before the response resolves', async () => {
  fsMock.mkdir.mockResolvedValue(errorResponse())
  const { result } = renderHook(() => useFileSystem())
  await act(async () => {
    await result.current.mkdir('/dir')
  })
  expect(result.current.error).not.toBeNull()

  let resolveCall: (value: IpcResponse<boolean>) => void = () => {}
  fsMock.mkdir.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveCall = resolve
      })
  )
  act(() => {
    void result.current.mkdir('/dir')
  })

  await waitFor(() => expect(result.current.error).toBeNull())
  resolveCall(okResponse(true))
})

it('clearError resets the error state', async () => {
  fsMock.mkdir.mockResolvedValue(errorResponse())
  const { result } = renderHook(() => useFileSystem())
  await act(async () => {
    await result.current.mkdir('/dir')
  })
  expect(result.current.error).not.toBeNull()

  act(() => {
    result.current.clearError()
  })

  expect(result.current.error).toBeNull()
})

it('propagates a rejection from the IPC call instead of swallowing it', async () => {
  fsMock.mkdir.mockRejectedValue(new Error('IPC crashed'))
  const { result } = renderHook(() => useFileSystem())

  await expect(result.current.mkdir('/dir')).rejects.toThrow('IPC crashed')
  // isLoading is still reset via the finally block even though the error propagates.
  await waitFor(() => expect(result.current.isLoading).toBe(false))
})

it('falls through to the fallback without setting an error when the response is neither a success nor a recognised error shape', async () => {
  // success: true but data undefined fails isIpcSuccess's `data !== undefined` check,
  // and isIpcError also fails (no `error` field) - handleError silently does nothing.
  fsMock.mkdir.mockResolvedValue({ success: true } as unknown as IpcResponse<boolean>)
  const { result } = renderHook(() => useFileSystem())

  const returned = await act(async () => result.current.mkdir('/dir'))

  expect(returned).toBe(false)
  expect(result.current.error).toBeNull()
})
