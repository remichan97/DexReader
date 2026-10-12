import { JP, CN, HK, GB, MX, ES } from 'country-flag-icons/react/3x2'
import { LanguageList } from '@renderer/constants/language-list.constant'
import { getLanguageFlag } from './languageFlags'

describe('getLanguageFlag', () => {
  it('maps language codes to a flag', () => {
    expect(getLanguageFlag('en')).toBe(GB)
    expect(getLanguageFlag('ja')).toBe(JP)
  })

  it('is case-insensitive', () => {
    expect(getLanguageFlag('JA')).toBe(JP)
  })

  it('gives regional variants their own flag where one exists', () => {
    expect(getLanguageFlag('es')).toBe(ES)
    expect(getLanguageFlag('es-la')).toBe(MX)
    expect(getLanguageFlag('zh')).toBe(CN)
    expect(getLanguageFlag('zh-hk')).toBe(HK)
  })

  it('shares the base flag with romanised variants', () => {
    expect(getLanguageFlag('ja-ro')).toBe(getLanguageFlag('ja'))
    expect(getLanguageFlag('ko-ro')).toBe(getLanguageFlag('ko'))
    expect(getLanguageFlag('zh-ro')).toBe(getLanguageFlag('zh'))
  })

  it('falls back to the base language for unlisted regional codes', () => {
    expect(getLanguageFlag('en-us')).toBe(GB)
  })

  it('returns undefined when there is no sensible flag', () => {
    expect(getLanguageFlag('ca')).toBeUndefined()
    expect(getLanguageFlag('xx')).toBeUndefined()
  })

  it('covers every language the filter and settings offer', () => {
    const unmapped = LanguageList.filter((language) => !getLanguageFlag(language.code))

    expect(unmapped).toEqual([])
  })
})
