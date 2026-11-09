import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { groupItemLines, splitItem, tokenizeInline, type InlineToken } from './inlineMarkdown'

// Rebuilds the source text from tokens, so a test can prove nothing was dropped or reordered.
function reconstruct(tokens: InlineToken[]): string {
  return tokens
    .map((token) => {
      switch (token.kind) {
        case 'text':
          return token.value
        case 'code':
          return `\`${token.value}\``
        case 'bold':
          return `**${reconstruct(token.children)}**`
        case 'link':
          return token.label
      }
    })
    .join('')
}

describe('tokenizeInline', () => {
  it('returns plain text as a single token', () => {
    expect(tokenizeInline('Nothing special here')).toEqual([
      { kind: 'text', value: 'Nothing special here' }
    ])
  })

  it('returns no tokens for an empty line', () => {
    expect(tokenizeInline('')).toEqual([])
  })

  it('reads bold text', () => {
    expect(tokenizeInline('A **bold** word')).toEqual([
      { kind: 'text', value: 'A ' },
      { kind: 'bold', children: [{ kind: 'text', value: 'bold' }] },
      { kind: 'text', value: ' word' }
    ])
  })

  it('reads inline code', () => {
    expect(tokenizeInline('Run `npm test` now')).toEqual([
      { kind: 'text', value: 'Run ' },
      { kind: 'code', value: 'npm test' },
      { kind: 'text', value: ' now' }
    ])
  })

  it('reads inline code inside bold text', () => {
    expect(tokenizeInline('**The `api` layer**')).toEqual([
      {
        kind: 'bold',
        children: [
          { kind: 'text', value: 'The ' },
          { kind: 'code', value: 'api' },
          { kind: 'text', value: ' layer' }
        ]
      }
    ])
  })

  it('keeps bold markers inside a code span literal', () => {
    expect(tokenizeInline('Use `**kind**` here')).toEqual([
      { kind: 'text', value: 'Use ' },
      { kind: 'code', value: '**kind**' },
      { kind: 'text', value: ' here' }
    ])
  })

  it('reads several spans on one line', () => {
    expect(tokenizeInline('**UI**: `a` and `b`')).toEqual([
      { kind: 'bold', children: [{ kind: 'text', value: 'UI' }] },
      { kind: 'text', value: ': ' },
      { kind: 'code', value: 'a' },
      { kind: 'text', value: ' and ' },
      { kind: 'code', value: 'b' }
    ])
  })

  it.each([
    ['an unclosed bold marker', 'Half **open'],
    ['an unclosed backtick', 'Half `open'],
    ['an empty code span', 'Nothing `` here'],
    ['a lone asterisk pair', '** **']
  ])('leaves %s as text', (_label, text) => {
    expect(reconstruct(tokenizeInline(text))).toBe(text)
    expect(tokenizeInline(text).every((token) => token.kind !== 'link')).toBe(true)
  })

  describe('links', () => {
    it('reads a bare URL', () => {
      expect(tokenizeInline('See https://example.com/path for more')).toEqual([
        { kind: 'text', value: 'See ' },
        { kind: 'link', href: 'https://example.com/path', label: 'https://example.com/path' },
        { kind: 'text', value: ' for more' }
      ])
    })

    it.each(['.', ',', ';', ':', '!', '?', ')'])(
      'leaves a trailing "%s" outside a bare URL',
      (punctuation) => {
        expect(tokenizeInline(`Go to https://example.com${punctuation}`)).toEqual([
          { kind: 'text', value: 'Go to ' },
          { kind: 'link', href: 'https://example.com', label: 'https://example.com' },
          { kind: 'text', value: punctuation }
        ])
      }
    )

    it('keeps a query string inside a bare URL', () => {
      expect(tokenizeInline('https://example.com/a?b=1&c=2')).toEqual([
        {
          kind: 'link',
          href: 'https://example.com/a?b=1&c=2',
          label: 'https://example.com/a?b=1&c=2'
        }
      ])
    })

    it('does not link a URL inside a code span', () => {
      expect(tokenizeInline('`https://example.com`')).toEqual([
        { kind: 'code', value: 'https://example.com' }
      ])
    })

    it('reads a Markdown link', () => {
      expect(tokenizeInline('Read [the docs](https://example.com/docs) first')).toEqual([
        { kind: 'text', value: 'Read ' },
        { kind: 'link', href: 'https://example.com/docs', label: 'the docs' },
        { kind: 'text', value: ' first' }
      ])
    })

    it('links only the innermost label when brackets are nested', () => {
      expect(tokenizeInline('[a [b](https://example.com)')).toEqual([
        { kind: 'text', value: '[a ' },
        { kind: 'link', href: 'https://example.com', label: 'b' }
      ])
    })

    it('accepts a mailto link', () => {
      expect(tokenizeInline('[Write to us](mailto:team@example.com)')).toEqual([
        { kind: 'link', href: 'mailto:team@example.com', label: 'Write to us' }
      ])
    })

    it.each([
      ['javascript:', '[click](javascript:alert(1))'],
      ['file:', '[open](file:///etc/passwd)'],
      ['data:', '[x](data:text/html;base64,AAAA)'],
      ['a relative path', '[x](../secret)']
    ])('leaves a link with %s as text', (_label, text) => {
      const tokens = tokenizeInline(text)

      expect(tokens.some((token) => token.kind === 'link')).toBe(false)
      expect(reconstruct(tokens)).toBe(text)
    })
  })

  it('never produces markup: angle brackets stay plain text', () => {
    expect(tokenizeInline('<img src=x onerror=alert(1)> and **<b>**')).toEqual([
      { kind: 'text', value: '<img src=x onerror=alert(1)> and ' },
      { kind: 'bold', children: [{ kind: 'text', value: '<b>' }] }
    ])
  })
})

describe('splitItem', () => {
  it('returns a single-line item with no nested lines', () => {
    expect(splitItem('**Changelog window**: shows what changed')).toEqual({
      text: '**Changelog window**: shows what changed',
      lines: []
    })
  })

  it('reads nested bullets in order', () => {
    expect(splitItem('Upgrade tooling\n  - First\n  - Second')).toEqual({
      text: 'Upgrade tooling',
      lines: [
        { kind: 'bullet', text: 'First' },
        { kind: 'bullet', text: 'Second' }
      ]
    })
  })

  it('flattens deeper nesting into the nested level', () => {
    expect(splitItem('Top\n  - Child\n    - Grandchild')).toEqual({
      text: 'Top',
      lines: [
        { kind: 'bullet', text: 'Child' },
        { kind: 'bullet', text: 'Grandchild' }
      ]
    })
  })

  it('joins loose continuation prose onto the item text', () => {
    expect(splitItem('A long item\n  that wraps')).toEqual({
      text: 'A long item that wraps',
      lines: []
    })
  })

  it('joins loose continuation prose onto the preceding bullet', () => {
    expect(splitItem('Top\n  - Child\n    carries on')).toEqual({
      text: 'Top',
      lines: [{ kind: 'bullet', text: 'Child carries on' }]
    })
  })

  it('reads a #### heading as its own line', () => {
    expect(splitItem("Last of the group\n#### What's Included")).toEqual({
      text: 'Last of the group',
      lines: [{ kind: 'heading', text: "What's Included" }]
    })
  })

  it('keeps prose after a heading separate from the heading', () => {
    expect(splitItem('Last\n#### Next Steps\nThis release lays the groundwork')).toEqual({
      text: 'Last',
      lines: [
        { kind: 'heading', text: 'Next Steps' },
        { kind: 'text', text: 'This release lays the groundwork' }
      ]
    })
  })

  it('trims trailing whitespace from the item text', () => {
    expect(splitItem('  Padded  ').text).toBe('Padded')
  })

  it('treats a three-hash line as prose, not a heading', () => {
    expect(splitItem('Item\n### Not a heading')).toEqual({
      text: 'Item ### Not a heading',
      lines: []
    })
  })
})

describe('groupItemLines', () => {
  it('returns no blocks for no lines', () => {
    expect(groupItemLines([])).toEqual([])
  })

  it('puts consecutive bullets in one list', () => {
    expect(
      groupItemLines([
        { kind: 'bullet', text: 'a' },
        { kind: 'bullet', text: 'b' }
      ])
    ).toEqual([{ kind: 'bullets', items: ['a', 'b'] }])
  })

  it('starts a new list after a heading or prose', () => {
    expect(
      groupItemLines([
        { kind: 'bullet', text: 'a' },
        { kind: 'heading', text: 'Next Steps' },
        { kind: 'text', text: 'Some prose' },
        { kind: 'bullet', text: 'b' }
      ])
    ).toEqual([
      { kind: 'bullets', items: ['a'] },
      { kind: 'heading', text: 'Next Steps' },
      { kind: 'text', text: 'Some prose' },
      { kind: 'bullets', items: ['b'] }
    ])
  })
})

describe('against the real CHANGELOG.md', () => {
  const lines = readFileSync(resolve(__dirname, '../../../../CHANGELOG.md'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^\s*- /.test(line))
    .map((line) => line.replace(/^\s*- /, ''))

  it('finds the bullets to check', () => {
    expect(lines.length).toBeGreaterThan(300)
  })

  it('rebuilds every bullet exactly from its tokens', () => {
    const mismatches = lines.filter((line) => reconstruct(tokenizeInline(line)) !== line)

    expect(mismatches).toEqual([])
  })

  it('recognises the bold and code spans the changelog relies on', () => {
    const kinds = new Set(lines.flatMap((line) => tokenizeInline(line).map((token) => token.kind)))

    expect(kinds).toContain('bold')
    expect(kinds).toContain('code')
  })
})
