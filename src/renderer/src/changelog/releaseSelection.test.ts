import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import {
  formatReleaseDate,
  formatVersionList,
  pickInitialVersion,
  releaseTabId
} from './releaseSelection'

function release(version: string, isYanked = false): ChangelogRelease {
  return { version, isYanked, sections: [] }
}

describe('releaseTabId', () => {
  it('gives each version its own id', () => {
    expect(releaseTabId('1.17.0')).toBe('release-tab-1.17.0')
    expect(releaseTabId('1.17.0')).not.toBe(releaseTabId('1.17.1'))
  })
})

describe('pickInitialVersion', () => {
  it('selects the installed version when the changelog has it', () => {
    const releases = [release('1.2.0'), release('1.1.0'), release('1.0.0')]

    expect(pickInitialVersion(releases, '1.1.0')).toBe('1.1.0')
  })

  it('selects the installed version even when it is unpublished', () => {
    expect(pickInitialVersion([release('1.2.0'), release('1.1.0', true)], '1.1.0')).toBe('1.1.0')
  })

  it('falls back to the newest published release when the installed one is missing', () => {
    const releases = [release('1.3.0', true), release('1.2.0'), release('1.1.0')]

    expect(pickInitialVersion(releases, '9.9.9')).toBe('1.2.0')
  })

  it('falls back to the first release when none is published', () => {
    expect(pickInitialVersion([release('1.1.0', true), release('1.0.0', true)], '9.9.9')).toBe(
      '1.1.0'
    )
  })

  it('returns undefined when there are no releases', () => {
    expect(pickInitialVersion([], '1.0.0')).toBeUndefined()
  })
})

describe('formatReleaseDate', () => {
  it('formats the date for the language', () => {
    expect(formatReleaseDate('2026-04-22', 'en-GB')).toBe('22 Apr 2026')
    expect(formatReleaseDate('2026-04-22', 'en-US')).toBe('Apr 22, 2026')
  })

  it('does not shift the day, whatever the local time zone is', () => {
    expect(formatReleaseDate('2026-01-01', 'en-GB')).toBe('1 Jan 2026')
    expect(formatReleaseDate('2026-12-31', 'en-GB')).toBe('31 Dec 2026')
  })

  it('returns the original text when the date is invalid', () => {
    expect(formatReleaseDate('not a date', 'en-GB')).toBe('not a date')
  })
})

describe('formatVersionList', () => {
  function render(versions: string[], language: string): string {
    return formatVersionList(versions, language)
      .map((part) => (part.kind === 'version' ? `v${part.value}` : part.value))
      .join('')
  }

  it('returns a single version on its own', () => {
    expect(formatVersionList(['1.10.0'], 'en-GB')).toEqual([{ kind: 'version', value: '1.10.0' }])
  })

  it('keeps the connecting words apart from the versions', () => {
    expect(formatVersionList(['1.10.0', '1.11.0'], 'en-GB')).toEqual([
      { kind: 'version', value: '1.10.0' },
      { kind: 'text', value: ' and ' },
      { kind: 'version', value: '1.11.0' }
    ])
  })

  it('follows the language for the serial comma', () => {
    expect(render(['1', '2', '3'], 'en-GB')).toBe('v1, v2 and v3')
    expect(render(['1', '2', '3'], 'en-US')).toBe('v1, v2, and v3')
  })

  it('returns nothing for an empty list', () => {
    expect(formatVersionList([], 'en-GB')).toEqual([])
  })
})
