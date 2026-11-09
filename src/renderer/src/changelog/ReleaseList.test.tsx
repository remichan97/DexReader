import { render } from '@testing-library/react'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { ReleaseList } from './ReleaseList'

vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const releases: ChangelogRelease[] = ['1.3.0', '1.2.0', '1.1.0'].map((version) => ({
  version,
  date: '2026-01-01',
  sections: []
}))

const scrolled: string[] = []

beforeEach(() => {
  scrolled.length = 0
  Element.prototype.scrollIntoView = function (this: Element): void {
    scrolled.push(this.id)
  }
})

function list(selectedVersion: string | undefined): React.JSX.Element {
  return (
    <FluentProvider theme={webLightTheme}>
      <ReleaseList
        releases={releases}
        installedVersion="1.3.0"
        selectedVersion={selectedVersion}
        language="en-GB"
        onSelect={vi.fn()}
      />
    </FluentProvider>
  )
}

describe('ReleaseList scrolling', () => {
  it('scrolls the selected release into view when the window opens', () => {
    render(list('1.2.0'))

    expect(scrolled).toEqual(['release-tab-1.2.0'])
  })

  it('scrolls to the newly selected release, not back to the previous one', () => {
    const { rerender } = render(list('1.3.0'))
    scrolled.length = 0

    rerender(list('1.1.0'))

    // Fluent moves aria-selected to the new tab in a later render than the effect, so a lookup by
    // aria-selected would find the old tab here and scroll the list back to it.
    expect(scrolled).toEqual(['release-tab-1.1.0'])
  })

  it('does not scroll when nothing is selected', () => {
    render(list(undefined))

    expect(scrolled).toEqual([])
  })
})
