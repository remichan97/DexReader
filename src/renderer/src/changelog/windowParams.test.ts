import { readWindowParams } from './windowParams'

describe('readWindowParams', () => {
  it.each(['en-GB', 'en-US', 'vi-VN'])('accepts the supported language %s', (language) => {
    expect(readWindowParams(`?lng=${language}&theme=light`).language).toBe(language)
  })

  it.each([
    ['is missing', ''],
    ['is empty', '?lng='],
    ['is not a supported locale', '?lng=fr-FR'],
    ['is the wrong case', '?lng=vi-vn'],
    ['looks like an injection attempt', '?lng=../../etc/passwd']
  ])('falls back to en-GB when the language %s', (_label, search) => {
    expect(readWindowParams(search).language).toBe('en-GB')
  })

  it('reads the dark theme', () => {
    expect(readWindowParams('?theme=dark').theme).toBe('dark')
  })

  it.each([
    ['is missing', ''],
    ['is light', '?theme=light'],
    ['is system', '?theme=system'],
    ['is unrecognised', '?theme=neon']
  ])('uses the light theme when the theme %s', (_label, search) => {
    expect(readWindowParams(search).theme).toBe('light')
  })

  it('reads both parameters together', () => {
    expect(readWindowParams('?lng=vi-VN&theme=dark')).toEqual({ language: 'vi-VN', theme: 'dark' })
  })
})
