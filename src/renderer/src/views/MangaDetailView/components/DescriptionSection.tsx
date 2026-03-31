import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface DescriptionSectionProps {
  readonly manga: MangaEntity
}

/**
 * Description section with expand/collapse functionality
 */
export default function DescriptionSection({ manga }: DescriptionSectionProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  // Get description (prefer English)
  const description =
    manga.attributes.description?.en ||
    manga.attributes.description?.['ja-ro'] ||
    Object.values(manga.attributes.description || {})[0] ||
    'No description available.'

  const maxLength = 300
  const shouldTruncate = description.length > maxLength
  const displayText =
    expanded || !shouldTruncate ? description : description.slice(0, maxLength) + '...'

  return (
    <div className="manga-detail-view__description">
      <h2 className="section-title">Description</h2>
      <p className="description-text">{displayText}</p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          className="description-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  )
}
