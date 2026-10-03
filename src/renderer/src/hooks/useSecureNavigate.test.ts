import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSecureNavigate } from './useSecureNavigate'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const isEnabled = vi.fn()
const getRequireForSettings = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function mountSecureNavigate(
  onReauthRequired?: (route: string) => void
): ReturnType<typeof renderHook<ReturnType<typeof useSecureNavigate>, unknown>> {
  return renderHook(() => useSecureNavigate(onReauthRequired), { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.gatekeeper = {
    isEnabled,
    getRequireForSettings
  } as unknown as typeof globalThis.gatekeeper
  isEnabled.mockResolvedValue({ success: true, data: false })
  getRequireForSettings.mockResolvedValue({ success: true, data: false })
})

it('navigates directly to a non-settings route without checking gatekeeper at all', async () => {
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/library')

  expect(isEnabled).not.toHaveBeenCalled()
  expect(navigateMock).toHaveBeenCalledWith('/library')
  expect(onReauthRequired).not.toHaveBeenCalled()
})

it('navigates directly to /settings without checking gatekeeper when no callback was provided', async () => {
  const { result } = mountSecureNavigate(undefined)

  await result.current('/settings')

  expect(isEnabled).not.toHaveBeenCalled()
  expect(navigateMock).toHaveBeenCalledWith('/settings')
})

it('navigates directly to /settings when gatekeeper is disabled', async () => {
  isEnabled.mockResolvedValue({ success: true, data: false })
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/settings')

  expect(navigateMock).toHaveBeenCalledWith('/settings')
  expect(onReauthRequired).not.toHaveBeenCalled()
})

it('navigates directly to /settings when gatekeeper is enabled but re-auth is not required for Settings', async () => {
  isEnabled.mockResolvedValue({ success: true, data: true })
  getRequireForSettings.mockResolvedValue({ success: true, data: false })
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/settings')

  expect(navigateMock).toHaveBeenCalledWith('/settings')
  expect(onReauthRequired).not.toHaveBeenCalled()
})

it('triggers onReauthRequired instead of navigating when gatekeeper is enabled and Settings requires re-auth', async () => {
  isEnabled.mockResolvedValue({ success: true, data: true })
  getRequireForSettings.mockResolvedValue({ success: true, data: true })
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/settings')

  expect(onReauthRequired).toHaveBeenCalledWith('/settings')
  expect(navigateMock).not.toHaveBeenCalled()
})

it('treats an unsuccessful IPC response as "no re-auth needed" and proceeds to navigate', async () => {
  isEnabled.mockResolvedValue({ success: false, error: { message: 'IPC unavailable' } })
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/settings')

  expect(navigateMock).toHaveBeenCalledWith('/settings')
  expect(onReauthRequired).not.toHaveBeenCalled()
})

it('fails open and still navigates when the gatekeeper check itself throws', async () => {
  isEnabled.mockRejectedValue(new Error('IPC crashed'))
  const onReauthRequired = vi.fn()
  const { result } = mountSecureNavigate(onReauthRequired)

  await result.current('/settings')

  expect(navigateMock).toHaveBeenCalledWith('/settings')
  expect(onReauthRequired).not.toHaveBeenCalled()
})
