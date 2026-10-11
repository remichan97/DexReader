import { describe, expect, it } from 'vitest'
import { forwardOrigin, getOrigin, originFrom } from './navigationOrigin'

describe('navigationOrigin', () => {
  it('records pathname and search as the origin', () => {
    expect(originFrom({ pathname: '/library', search: '?q=one' })).toEqual({
      from: '/library?q=one'
    })
  })

  it('reads a recorded origin back out of router state', () => {
    expect(getOrigin({ from: '/downloads' })).toBe('/downloads')
    expect(getOrigin(originFrom({ pathname: '/creator/author/1', search: '' }))).toBe(
      '/creator/author/1'
    )
  })

  it('ignores missing or malformed state', () => {
    expect(getOrigin(null)).toBeUndefined()
    expect(getOrigin(undefined)).toBeUndefined()
    expect(getOrigin('/library')).toBeUndefined()
    expect(getOrigin({})).toBeUndefined()
    expect(getOrigin({ from: 42 })).toBeUndefined()
  })

  it('rejects origins that are not in-app routes', () => {
    expect(getOrigin({ from: 'https://example.com' })).toBeUndefined()
  })

  it('forwards an origin only when there is one', () => {
    expect(forwardOrigin('/library')).toEqual({ from: '/library' })
    expect(forwardOrigin(undefined)).toEqual({})
  })
})
