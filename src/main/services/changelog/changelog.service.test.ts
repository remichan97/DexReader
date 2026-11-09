import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'

// The service reads the changelog text once, in the constructor of a module-level singleton, so
// each test swaps the text and re-evaluates the module to get a service built from its fixture.
const state = vi.hoisted(() => ({ source: '' }))

vi.mock('../../changelog/changelog-source', () => ({
  getChangelogSource: (): string => state.source
}))

async function parse(text: string): Promise<ChangelogRelease[]> {
  state.source = text
  vi.resetModules()
  const { changelogService } = await import('./changelog.service')
  return changelogService.processChangelogText()
}

describe('changelogService', () => {
  describe('release headings', () => {
    it('parses the version and the date', async () => {
      const [release] = await parse('## [1.2.3] - 2026-05-06\n\n### Added\n\n- Something\n')

      expect(release.version).toBe('1.2.3')
      expect(release.date).toBe('2026-05-06')
      expect(release.isYanked).toBe(false)
    })

    it('flags a yanked release without leaking the marker into the version or date', async () => {
      const [release] = await parse('## [1.11.0] - 2026-06-24 [YANKED]\n\n### Changed\n\n- Item\n')

      expect(release.version).toBe('1.11.0')
      expect(release.date).toBe('2026-06-24')
      expect(release.isYanked).toBe(true)
    })

    it('leaves the date undefined when the heading has none', async () => {
      const [release] = await parse('## [Unreleased]\n\n### Added\n\n- Item\n')

      expect(release.version).toBe('Unreleased')
      expect(release.date).toBeUndefined()
      expect(release.isYanked).toBe(false)
    })

    it('keeps releases in file order', async () => {
      const releases = await parse('## [2.0.0] - 2026-02-01\n\n## [1.0.0] - 2026-01-01\n')

      expect(releases.map((release) => release.version)).toEqual(['2.0.0', '1.0.0'])
    })

    it('returns no releases when there are no release headings', async () => {
      await expect(parse('# Changelog\n\nNothing here yet.\n')).resolves.toEqual([])
      await expect(parse('')).resolves.toEqual([])
    })

    it('ignores everything before the first release heading', async () => {
      const releases = await parse(
        '# Changelog\n\n- A stray bullet\n\n### Added\n\n- Another\n\n## [1.0.0] - 2026-01-01\n'
      )

      expect(releases).toHaveLength(1)
      expect(releases[0].sections).toEqual([])
    })
  })

  describe('sections', () => {
    it.each([
      ['Added', ChangelogCategory.Added],
      ['Changed', ChangelogCategory.Changed],
      ['Deprecated', ChangelogCategory.Deprecated],
      ['Removed', ChangelogCategory.Removed],
      ['Fixed', ChangelogCategory.Fixed],
      ['Security', ChangelogCategory.Security],
      ['Dependencies', ChangelogCategory.Dependencies],
      ['Build', ChangelogCategory.Build]
    ])('maps the "%s" heading to its category without a title', async (heading, category) => {
      const [release] = await parse(`## [1.0.0] - 2026-01-01\n\n### ${heading}\n\n- Item\n`)

      expect(release.sections).toEqual([{ category, title: undefined, items: ['Item'] }])
    })

    it('maps an unrecognised heading to Unknown and keeps its text as the title', async () => {
      const [release] = await parse('## [1.0.0] - 2026-01-01\n\n### Improved\n\n- Item\n')

      expect(release.sections).toEqual([
        { category: ChangelogCategory.Unknown, title: 'Improved', items: ['Item'] }
      ])
    })

    it('does not treat inherited object keys as categories', async () => {
      const [release] = await parse('## [1.0.0] - 2026-01-01\n\n### constructor\n\n- Item\n')

      expect(release.sections[0].category).toBe(ChangelogCategory.Unknown)
      expect(release.sections[0].title).toBe('constructor')
    })

    it('groups items under their own heading, in heading order', async () => {
      const [release] = await parse(
        [
          '## [1.0.0] - 2026-01-01',
          '',
          '### Fixed',
          '',
          '- Fix one',
          '- Fix two',
          '',
          '### Added',
          '',
          '- Add one',
          ''
        ].join('\n')
      )

      expect(release.sections.map((section) => [section.category, section.items])).toEqual([
        [ChangelogCategory.Fixed, ['Fix one', 'Fix two']],
        [ChangelogCategory.Added, ['Add one']]
      ])
    })

    it('keeps a heading that has no items as an empty section', async () => {
      const [release] = await parse('## [1.0.0] - 2026-01-01\n\n### Added\n\n### Fixed\n\n- Fix\n')

      expect(release.sections.map((section) => section.items.length)).toEqual([0, 1])
    })

    it('puts bullets that have no heading into one implicit Changed section', async () => {
      const [release] = await parse('## [0.9.0] - 2026-04-01\n\n- initial release\n- second\n')

      expect(release.sections).toEqual([
        { category: ChangelogCategory.Changed, items: ['initial release', 'second'] }
      ])
    })

    it('does not leak headingless bullets into the previous release', async () => {
      const releases = await parse(
        [
          '## [0.9.1] - 2026-04-02',
          '',
          '### Fixed',
          '',
          '- Fix',
          '',
          '## [0.9.0] - 2026-04-01',
          '',
          '- initial release',
          ''
        ].join('\n')
      )

      expect(releases[0].sections).toEqual([
        { category: ChangelogCategory.Fixed, title: undefined, items: ['Fix'] }
      ])
      expect(releases[1].sections).toEqual([
        { category: ChangelogCategory.Changed, items: ['initial release'] }
      ])
    })
  })

  describe('items', () => {
    it('keeps consecutive bullets as separate items', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Added\n\n- One\n- Two\n- Three\n'
      )

      expect(release.sections[0].items).toEqual(['One', 'Two', 'Three'])
    })

    it('keeps the markdown of an item untouched', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Added\n\n- **Library**: a [link](https://example.com) and `code`\n'
      )

      expect(release.sections[0].items).toEqual([
        '**Library**: a [link](https://example.com) and `code`'
      ])
    })

    it('appends indented sub-bullets and wrapped lines to their parent item', async () => {
      const [release] = await parse(
        [
          '## [1.0.0] - 2026-01-01',
          '',
          '### Changed',
          '',
          '- Parent',
          '  - Child one',
          '  - Child two',
          '- Wrapped',
          '  continues here',
          '- Last',
          ''
        ].join('\n')
      )

      expect(release.sections[0].items).toEqual([
        'Parent\n  - Child one\n  - Child two',
        'Wrapped\n  continues here',
        'Last'
      ])
    })

    it('trims trailing whitespace from appended lines', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Changed\n\n- Parent\n  - Child   \n'
      )

      expect(release.sections[0].items).toEqual(['Parent\n  - Child'])
    })

    it('skips blank lines between items', async () => {
      const [release] = await parse('## [1.0.0] - 2026-01-01\n\n### Added\n\n- One\n\n\n- Two\n')

      expect(release.sections[0].items).toEqual(['One', 'Two'])
    })

    it('drops prose that appears before the first item of a section', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Added\n\nSome intro paragraph.\n\n- One\n'
      )

      expect(release.sections[0].items).toEqual(['One'])
    })
  })

  describe('link references', () => {
    it('skips reference-style link definitions instead of appending them to an item', async () => {
      const releases = await parse(
        [
          '## [1.0.0] - 2026-01-01',
          '',
          '### Added',
          '',
          '- One',
          '',
          '[keep a changelog]: https://keepachangelog.com/en/1.0.0/',
          '[semantic versioning]: https://semver.org/spec/v2.0.0.html',
          ''
        ].join('\n')
      )

      expect(releases[0].sections[0].items).toEqual(['One'])
    })
  })

  describe('separators and comments', () => {
    it.each([['---'], ['-----'], ['---   ']])(
      'drops the horizontal rule %j instead of appending it to the last item',
      async (rule) => {
        const releases = await parse(
          `## [1.1.0] - 2026-02-01\n\n### Added\n\n- One\n\n${rule}\n\n## [1.0.0] - 2026-01-01\n`
        )

        expect(releases[0].sections[0].items).toEqual(['One'])
      }
    )

    it.each([
      ['<!-- Links -->'],
      ['<!-- Versions -->'],
      ['<!--no spaces-->'],
      ['<!-- Links -->  ']
    ])('drops the HTML comment %j instead of appending it to the last item', async (comment) => {
      const [release] = await parse(`## [1.0.0] - 2026-01-01\n\n### Added\n\n- One\n\n${comment}\n`)

      expect(release.sections[0].items).toEqual(['One'])
    })

    it('drops the trailing links block of the file from the oldest release', async () => {
      const [release] = await parse(
        [
          '## [0.9.0] - 2026-04-01',
          '',
          '- initial release',
          '',
          '<!-- Links -->',
          '',
          '[keep a changelog]: https://keepachangelog.com/en/1.0.0/',
          '[semantic versioning]: https://semver.org/spec/v2.0.0.html',
          '',
          '<!-- Versions -->',
          ''
        ].join('\n')
      )

      expect(release.sections).toEqual([
        { category: ChangelogCategory.Changed, items: ['initial release'] }
      ])
    })

    it('does not create a section out of a release that only has separators', async () => {
      const [release] = await parse('## [1.0.0] - 2026-01-01\n\n---\n\n<!-- note -->\n')

      expect(release.sections).toEqual([])
    })

    it('keeps bullets that merely mention a rule or a comment', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Fixed\n\n- Render `---` as a rule\n- Strip <!-- hidden --> notes\n'
      )

      expect(release.sections[0].items).toEqual([
        'Render `---` as a rule',
        'Strip <!-- hidden --> notes'
      ])
    })

    it('keeps a rule that sits inside an indented continuation line', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\n\n### Fixed\n\n- Parent\n  ---\n  more\n'
      )

      expect(release.sections[0].items).toEqual(['Parent\n  ---\n  more'])
    })
  })

  describe('input tolerance', () => {
    it('handles Windows line endings', async () => {
      const [release] = await parse(
        '## [1.0.0] - 2026-01-01\r\n\r\n### Added\r\n\r\n- One\r\n- Two\r\n'
      )

      expect(release.version).toBe('1.0.0')
      expect(release.sections[0].items).toEqual(['One', 'Two'])
    })

    it('strips a leading byte order mark', async () => {
      const [release] = await parse('\uFEFF## [1.0.0] - 2026-01-01\n\n### Added\n\n- One\n')

      expect(release.version).toBe('1.0.0')
    })

    it('gives the same result when called repeatedly', async () => {
      state.source = '## [1.0.0] - 2026-01-01\n\n### Added\n\n- One\n- Two\n'
      vi.resetModules()
      const { changelogService } = await import('./changelog.service')

      const first = changelogService.processChangelogText()
      const second = changelogService.processChangelogText()

      expect(second).toEqual(first)
      expect(second[0].sections[0].items).toEqual(['One', 'Two'])
    })
  })

  describe('the real CHANGELOG.md', () => {
    async function parseRealChangelog(): Promise<ChangelogRelease[]> {
      const actual = await vi.importActual<typeof import('../../changelog/changelog-source')>(
        '../../changelog/changelog-source'
      )
      return parse(actual.getChangelogSource())
    }

    it('parses every release with a clean version number', async () => {
      const releases = await parseRealChangelog()

      expect(releases.length).toBeGreaterThan(0)
      for (const release of releases) {
        expect(release.version).toMatch(/^\d+\.\d+\.\d+$/)
        expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it('lists each version once', async () => {
      const versions = (await parseRealChangelog()).map((release) => release.version)

      expect(new Set(versions).size).toBe(versions.length)
    })

    it('flags unpublished releases as yanked and leaves published ones alone', async () => {
      const releases = await parseRealChangelog()

      expect(releases.find((release) => release.version === '1.11.0')).toMatchObject({
        date: '2026-06-24',
        isYanked: true
      })
      expect(releases.find((release) => release.version === '1.11.1')?.isYanked).toBe(false)
    })

    it('gives every release at least one section, and every section at least one item', async () => {
      for (const release of await parseRealChangelog()) {
        expect(release.sections.length, `${release.version} has no sections`).toBeGreaterThan(0)
        for (const section of release.sections) {
          expect(section.items.length, `${release.version} / ${section.category}`).toBeGreaterThan(
            0
          )
        }
      }
    })

    it('keeps the headingless first release out of the release above it', async () => {
      const releases = await parseRealChangelog()
      const oldest = releases.find((release) => release.version === '0.9.0')
      const next = releases.find((release) => release.version === '0.9.1')

      expect(oldest?.sections).toHaveLength(1)
      expect(oldest?.sections[0].category).toBe(ChangelogCategory.Changed)
      expect(oldest?.sections[0].items[0]).toMatch(/^initial release/)
      expect(next?.sections.flatMap((section) => section.items).join('\n')).not.toContain(
        'initial release'
      )
    })

    it('leaves no horizontal rule or HTML comment inside any item', async () => {
      const items = (await parseRealChangelog()).flatMap((release) =>
        release.sections.flatMap((section) => section.items)
      )

      expect(items.filter((item) => /(^|\n)(-{3,}|<!--.*-->)\s*($|\n)/.test(item))).toEqual([])
    })

    it('keeps the title of headings outside the known categories', async () => {
      const unknown = (await parseRealChangelog())
        .flatMap((release) => release.sections)
        .filter((section) => section.category === ChangelogCategory.Unknown)

      expect(unknown.length).toBeGreaterThan(0)
      for (const section of unknown) {
        expect(section.title).toBeTruthy()
      }
    })
  })
})
