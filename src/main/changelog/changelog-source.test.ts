import { getChangelogSource } from './changelog-source'

describe('changelog-source', () => {
  it('returns the repository changelog as text', () => {
    const text = getChangelogSource()

    expect(text.startsWith('# Changelog')).toBe(true)
  })

  it('contains at least one release heading in the Keep a Changelog shape', () => {
    expect(getChangelogSource()).toMatch(/^## \[\d+\.\d+\.\d+\] - \d{4}-\d{2}-\d{2}/m)
  })
})
