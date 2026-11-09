/**
 * A deliberately small subset of Markdown, covering what the changelog actually uses. Producing
 * tokens rather than HTML keeps the window free of `innerHTML`: components map each token to a
 * React node, so nothing in the release notes can inject markup.
 */

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'bold'; children: InlineToken[] }
  | { kind: 'link'; href: string; label: string }

// One line of an item below its first line: a nested bullet, a `####` heading, or loose prose.
export interface ItemLine {
  kind: 'bullet' | 'heading' | 'text'
  text: string
}

export interface ParsedItem {
  text: string // The item's own first line, including any prose that continued it
  lines: ItemLine[] // Everything below it, in order
}

// Alternatives are tried left to right at each position, so code spans win over bold and links:
// anything inside backticks stays literal. Bold text cannot itself contain an asterisk, which
// keeps matching linear. A bare URL takes everything up to whitespace; trailing punctuation is
// trimmed afterwards so a sentence-ending full stop is not swallowed into the link.
const INLINE_REGEX =
  /`(?<code>[^`]+)`|\*\*(?<bold>[^*]+)\*\*|\[(?<label>[^[\]]+)\]\((?<href>[^)\s]+)\)|(?<url>https?:\/\/[^\s<>`]+)/g

// Only these can be opened from the window; `openExternal` in main enforces the same list.
const LINKABLE_REGEX = /^(?:https?:|mailto:)/i

const URL_TRAILING_PUNCTUATION = new Set(['.', ',', ';', ':', '!', '?', ')', ']'])

const NESTED_BULLET_REGEX = /^\s+[-*] (.*)$/
const HEADING_LINE_REGEX = /^\s*#{4,6} (.*)$/

function appendText(tokens: InlineToken[], value: string): void {
  const last = tokens.at(-1)
  if (last?.kind === 'text') {
    last.value += value
  } else {
    tokens.push({ kind: 'text', value })
  }
}

function trimTrailingPunctuation(url: string): string {
  let end = url.length
  while (end > 0 && URL_TRAILING_PUNCTUATION.has(url[end - 1])) {
    end--
  }
  return url.slice(0, end)
}

function bareUrlTokens(url: string): InlineToken[] {
  const href = trimTrailingPunctuation(url)
  if (!URL.canParse(href)) {
    return [{ kind: 'text', value: url }]
  }
  const tokens: InlineToken[] = [{ kind: 'link', href, label: href }]
  if (href.length < url.length) {
    tokens.push({ kind: 'text', value: url.slice(href.length) })
  }
  return tokens
}

function toTokens(match: RegExpMatchArray): InlineToken[] {
  const groups = match.groups ?? {}
  if (groups.code !== undefined) {
    return [{ kind: 'code', value: groups.code }]
  }
  if (groups.bold !== undefined) {
    return [{ kind: 'bold', children: tokenizeInline(groups.bold) }]
  }
  if (groups.url !== undefined) {
    return bareUrlTokens(groups.url)
  }
  if (groups.href !== undefined && LINKABLE_REGEX.test(groups.href)) {
    return [{ kind: 'link', href: groups.href, label: groups.label }]
  }
  return [{ kind: 'text', value: match[0] }]
}

/**
 * Split one line of release notes into inline tokens. Markers that never close, and links with a
 * protocol the window may not open, are left as plain text.
 *
 * @param text A single line, without a leading list marker
 * @returns The tokens in reading order, with adjacent plain text merged
 */
export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let cursor = 0

  for (const match of text.matchAll(INLINE_REGEX)) {
    if (match.index > cursor) {
      appendText(tokens, text.slice(cursor, match.index))
    }
    for (const token of toTokens(match)) {
      if (token.kind === 'text') {
        appendText(tokens, token.value)
      } else {
        tokens.push(token)
      }
    }
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    appendText(tokens, text.slice(cursor))
  }
  return tokens
}

// What an item's nested lines render as: consecutive bullets share one list.
export type ItemBlock =
  | { kind: 'bullets'; items: string[] }
  | { kind: 'heading' | 'text'; text: string }

/**
 * Group an item's nested lines so that consecutive bullets become a single list.
 *
 * @param lines The lines returned by `splitItem`
 * @returns The blocks to render, in order
 */
export function groupItemLines(lines: ItemLine[]): ItemBlock[] {
  const blocks: ItemBlock[] = []

  for (const line of lines) {
    const last = blocks.at(-1)
    if (line.kind !== 'bullet') {
      blocks.push({ kind: line.kind, text: line.text })
    } else if (last?.kind === 'bullets') {
      last.items.push(line.text)
    } else {
      blocks.push({ kind: 'bullets', items: [line.text] })
    }
  }
  return blocks
}

/**
 * Break a parsed changelog item into its own text and the lines beneath it. The parser keeps an
 * item's continuation lines joined with `\n`, so nested bullets arrive as indented `- ` lines.
 * Nesting deeper than one level is flattened into the first, which is all the changelog uses.
 *
 * @param raw An item as returned by the changelog parser
 * @returns The item text and its nested lines
 */
export function splitItem(raw: string): ParsedItem {
  const [first, ...rest] = raw.split('\n')
  let text = first.trim()
  const lines: ItemLine[] = []

  for (const rawLine of rest) {
    const heading = HEADING_LINE_REGEX.exec(rawLine)
    const bullet = NESTED_BULLET_REGEX.exec(rawLine)
    const previous = lines.at(-1)

    if (heading) {
      lines.push({ kind: 'heading', text: heading[1].trim() })
    } else if (bullet) {
      lines.push({ kind: 'bullet', text: bullet[1].trim() })
    } else if (previous && previous.kind !== 'heading') {
      previous.text += ` ${rawLine.trim()}`
    } else if (previous) {
      lines.push({ kind: 'text', text: rawLine.trim() })
    } else {
      text += ` ${rawLine.trim()}`
    }
  }

  return { text, lines }
}
