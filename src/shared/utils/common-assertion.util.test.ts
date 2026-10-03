import { isUUID, isDateStamp } from './common-assertion.util'

describe('isUUID', () => {
  it('accepts a lowercase UUID', () => {
    expect(isUUID('019353d8-5fbf-7c7c-8a3d-123456789abc')).toBe(true)
  })

  it('accepts an uppercase UUID', () => {
    expect(isUUID('019353D8-5FBF-7C7C-8A3D-123456789ABC')).toBe(true)
  })

  it.each(['not-a-uuid', '', '019353d8-5fbf-7c7c-8a3d', '019353d85fbf7c7c8a3d123456789abc'])(
    'rejects %s',
    (value) => {
      expect(isUUID(value)).toBe(false)
    }
  )
})

describe('isDateStamp', () => {
  it('accepts a YYYY-MM-DD date', () => {
    expect(isDateStamp('2026-01-01')).toBe(true)
  })

  it.each(['2026-1-1', '01-01-2026', 'not-a-date', '2026-01-01T00:00:00.000Z'])(
    'rejects %s',
    (value) => {
      expect(isDateStamp(value)).toBe(false)
    }
  )
})
