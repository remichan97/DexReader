import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/Button'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface TagsSectionProps {
  readonly manga: MangaEntity
}

/**
 * Tags section
 */
export default function TagsSection({ manga }: TagsSectionProps): JSX.Element {
  const navigate = useNavigate()

  // Extract tags from attributes (tags are always included in manga response)
  const tags =
    (
      manga.attributes as {
        tags?: Array<{ id: string; attributes: { name: { en?: string }; group: string } }>
      }
    )?.tags?.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name.en || 'Unknown',
      group: tag.attributes.group
    })) || []

  const handleTagClick = (tagId: string): void => {
    navigate(`/browse?tag=${tagId}`)
  }

  if (tags.length === 0) return <></>

  return (
    <div className="manga-detail-view__tags">
      <h2 className="section-title">Tags</h2>
      <div className="tags-container">
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant="ghost"
            className="tag tag--theme"
            onClick={() => handleTagClick(tag.id)}
          >
            {tag.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
