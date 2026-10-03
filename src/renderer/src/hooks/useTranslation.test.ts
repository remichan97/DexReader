import { renderHook } from '@testing-library/react'
import { useTranslation } from './useTranslation'

const useI18nTranslation = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string | string[]) => useI18nTranslation(namespace)
}))

beforeEach(() => {
  vi.clearAllMocks()
  useI18nTranslation.mockReturnValue({ t: vi.fn(), i18n: {} })
})

it('passes no namespace through by default', () => {
  renderHook(() => useTranslation())

  expect(useI18nTranslation).toHaveBeenCalledWith(undefined)
})

it('passes a single namespace through', () => {
  renderHook(() => useTranslation('errors'))

  expect(useI18nTranslation).toHaveBeenCalledWith('errors')
})

it('passes multiple namespaces through', () => {
  renderHook(() => useTranslation(['common', 'dialogs']))

  expect(useI18nTranslation).toHaveBeenCalledWith(['common', 'dialogs'])
})

it('returns whatever react-i18next returns, unchanged', () => {
  const returnValue = { t: vi.fn(), i18n: { language: 'en-GB' } }
  useI18nTranslation.mockReturnValue(returnValue)

  const { result } = renderHook(() => useTranslation())

  expect(result.current).toBe(returnValue)
})
