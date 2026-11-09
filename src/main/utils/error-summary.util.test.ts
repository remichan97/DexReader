import { summariseError, summariseErrorText } from './error-summary.util'

describe('summariseErrorText', () => {
  it('returns a one-line message unchanged', () => {
    expect(summariseErrorText('Something broke')).toBe('Something broke')
  })

  it('keeps the first line and notes how many lines were left out', () => {
    const text = 'Cannot parse releases feed: HttpError: 504\nmethod: GET\nData: <html>\nmore'

    expect(summariseErrorText(text)).toBe(
      'Cannot parse releases feed: HttpError: 504\n    … 3 more lines omitted'
    )
  })

  it('uses the singular for a single omitted line', () => {
    expect(summariseErrorText('Failed\nDetails')).toBe('Failed\n    … 1 more line omitted')
  })

  it('keeps the first few stack frames and drops the rest', () => {
    const frames = Array.from({ length: 8 }, (_, index) => `    at frame${index} (file.js:1:1)`)

    expect(summariseErrorText(['Failed', ...frames].join('\n'))).toBe(
      ['Failed', ...frames.slice(0, 5), '    … 3 more lines omitted'].join('\n')
    )
  })

  it('drops a dumped payload sitting between the message and the stack', () => {
    const feed = Array.from({ length: 300 }, (_, index) => `<entry>${index}</entry>`)
    const text = [
      'Cannot parse releases feed: 504',
      ...feed,
      '    at GitHubProvider (a.js:1:1)'
    ].join('\n')

    expect(summariseErrorText(text)).toBe(
      'Cannot parse releases feed: 504\n    at GitHubProvider (a.js:1:1)\n    … 300 more lines omitted'
    )
  })

  it('does not mistake indented payload lines for stack frames', () => {
    expect(summariseErrorText('Failed\n    <updated>2026-01-01</updated>')).toBe(
      'Failed\n    … 1 more line omitted'
    )
  })

  it('truncates a very long first line', () => {
    const summary = summariseErrorText('x'.repeat(2000))

    expect(summary).toBe(`${'x'.repeat(500)}…`)
  })

  it('trims whitespace around the first line', () => {
    expect(summariseErrorText('  Failed  ')).toBe('Failed')
  })

  it('returns an empty string for empty text', () => {
    expect(summariseErrorText('')).toBe('')
  })
})

describe('summariseError', () => {
  it('uses the stack of an Error so the origin is kept', () => {
    const error = new Error('Boom')
    error.stack = 'Error: Boom\n    at somewhere (file.js:1:1)'

    expect(summariseError(error)).toBe('Error: Boom\n    at somewhere (file.js:1:1)')
  })

  it('falls back to the message when an Error has no stack', () => {
    const error = new Error('Boom')
    error.stack = undefined

    expect(summariseError(error)).toBe('Boom')
  })

  it('shortens an Error whose message carries a large payload', () => {
    const error = new Error(`Feed failed: 504\n${'<entry/>\n'.repeat(100)}`)

    const summary = summariseError(error)

    expect(summary.startsWith('Error: Feed failed: 504')).toBe(true)
    expect(summary.split('\n').length).toBeLessThanOrEqual(7)
  })

  it.each([
    ['a string', 'plain failure', 'plain failure'],
    ['a number', 42, '42'],
    ['undefined', undefined, 'undefined']
  ])('describes %s', (_label, value, expected) => {
    expect(summariseError(value)).toBe(expected)
  })
})
