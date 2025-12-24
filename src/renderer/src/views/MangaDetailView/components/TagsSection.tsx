import type { JSX } from 'react'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface TagsSectionProps {
  readonly manga: MangaEntity
}

/**
 * Tags section - Currently displays tags (to be repurposed for Alternative names)
 *
 * Note: Tags are now displayed inline below the title in the hero section.
 * This section will be repurposed to display alternative titles/names.
 */
export default function TagsSection({ manga }: TagsSectionProps): JSX.Element {
  // Temporarily hidden - will be repurposed for alternative names
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mangaPlaceholder = manga
  return <></>
}
