/**
 * Library Search Query Parser
 *
 * Parses Discord/GitHub-style search syntax with filter keywords.
 *
 * Supported filters:
 * - status:ongoing|completed|hiatus|cancelled
 * - tag:tagName (checks if manga has tag)
 * - downloaded:yes|no
 * - author:authorName
 * - artist:artistName
 * - year:2024 or year:>2020 or year:<2019
 *
 * Examples:
 * - "one piece status:ongoing" → text: "one piece", status: "ongoing"
 * - "author:Oda downloaded:yes" → author: "Oda", downloaded: true
 * - "romance tag:isekai year:>2020" → text: "romance", tag: "isekai", year: { op: ">", value: 2020 }
 */

export interface ParsedLibraryQuery {
  /** Plain text search (searches title, author, artist) */
  text: string
  /** Publication status filter */
  status: string | null
  /** Tag filter (searches manga tags) */
  tag: string | null
  /** Downloaded filter */
  downloaded: boolean | null
  /** Author name filter */
  author: string | null
  /** Artist name filter */
  artist: string | null
  /** Year filter with optional comparison operator */
  year: { op: '=' | '>' | '<'; value: number } | null
}

export interface ActiveFilter {
  key: string
  label: string
  value: string
}

/**
 * Parse library search query with filter keywords
 *
 * @param query - Raw search input string
 * @returns Parsed query object with filters
 */
export function parseLibraryQuery(query: string): ParsedLibraryQuery {
  const result: ParsedLibraryQuery = {
    text: '',
    status: null,
    tag: null,
    downloaded: null,
    author: null,
    artist: null,
    year: null
  }

  if (!query.trim()) {
    return result
  }

  // Split by spaces, but preserve quoted strings
  // Match: word:value pairs OR quoted strings OR regular words
  const tokens: string[] = []
  const regex = /(\w+:"[^"]+"|"[^"]+"|[^\s]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(query)) !== null) {
    tokens.push(match[1])
  }

  const textParts: string[] = []

  tokens.forEach((token) => {
    // Check if token is a filter (contains colon)
    const colonIndex = token.indexOf(':')

    if (colonIndex > 0) {
      const key = token.slice(0, colonIndex).toLowerCase()
      let value = token.slice(colonIndex + 1)

      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }

      // Process filter based on key
      switch (key) {
        case 'status':
          result.status = value.toLowerCase()
          break

        case 'tag':
          result.tag = value.toLowerCase()
          break

        case 'downloaded':
          result.downloaded = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
          break

        case 'author':
          result.author = value
          break

        case 'artist':
          result.artist = value
          break

        case 'year': {
          // Handle comparison operators: year:>2020, year:<2019, year:2024
          const yearMatch = value.match(/^([><]?)(\d{4})$/)
          if (yearMatch) {
            const op = yearMatch[1] || '='
            const year = parseInt(yearMatch[2], 10)
            result.year = { op: op as '=' | '>' | '<', value: year }
          }
          break
        }

        default:
          // Unknown filter, treat as text
          textParts.push(token)
      }
    } else {
      // Not a filter, treat as text search
      // Remove quotes if present
      let text = token
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1)
      }
      textParts.push(text)
    }
  })

  result.text = textParts.join(' ').trim()

  return result
}

/**
 * Extract active filters from parsed query for display as chips
 *
 * @param parsed - Parsed query object
 * @returns Array of active filters with labels
 */
export function getActiveFilters(parsed: ParsedLibraryQuery): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  if (parsed.status) {
    filters.push({
      key: 'status',
      label: 'Status',
      value: parsed.status.charAt(0).toUpperCase() + parsed.status.slice(1)
    })
  }

  if (parsed.tag) {
    filters.push({
      key: 'tag',
      label: 'Tag',
      value: parsed.tag.charAt(0).toUpperCase() + parsed.tag.slice(1)
    })
  }

  if (parsed.downloaded !== null) {
    filters.push({
      key: 'downloaded',
      label: 'Downloaded',
      value: parsed.downloaded ? 'Yes' : 'No'
    })
  }

  if (parsed.author) {
    filters.push({
      key: 'author',
      label: 'Author',
      value: parsed.author
    })
  }

  if (parsed.artist) {
    filters.push({
      key: 'artist',
      label: 'Artist',
      value: parsed.artist
    })
  }

  if (parsed.year) {
    const { op, value } = parsed.year
    const opSymbol = op === '=' ? '' : op
    filters.push({
      key: 'year',
      label: 'Year',
      value: `${opSymbol}${value}`
    })
  }

  return filters
}

/**
 * Get help text for search syntax
 *
 * @returns Array of example searches with descriptions
 */
export function getSearchSyntaxHelp(): Array<{ example: string; description: string }> {
  return [
    { example: 'status:ongoing', description: 'Filter by publication status' },
    { example: 'tag:romance', description: 'Filter manga with specific tag' },
    { example: 'downloaded:yes', description: 'Show only downloaded manga' },
    { example: 'author:"Naoki Urasawa"', description: 'Filter by author (use quotes for spaces)' },
    { example: 'artist:Inoue', description: 'Filter by artist name' },
    { example: 'year:2024', description: 'Filter by publication year' },
    { example: 'year:>2020', description: 'Filter year greater than 2020' },
    { example: 'year:<2019', description: 'Filter year less than 2019' },
    {
      example: 'one piece status:ongoing',
      description: 'Combine text search with filters'
    }
  ]
}
