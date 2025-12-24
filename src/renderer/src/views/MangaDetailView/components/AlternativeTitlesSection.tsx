import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import { getLanguageName, getLanguageCode } from '@renderer/utils/languageHelpers'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface AlternativeTitlesSectionProps {
  readonly manga: MangaEntity
}

const INITIAL_DISPLAY_COUNT = 5

/**
 * Alternative Titles section
 * Displays all alternative titles for the manga with language indicators
 * Limits initial display to prevent pushing chapter list too far down
 */
export default function AlternativeTitlesSection({
  manga
}: AlternativeTitlesSectionProps): JSX.Element {
  const [showAll, setShowAll] = useState(false)

  // Extract alternative titles from attributes
  const altTitles = (
    manga.attributes as {
      altTitles?: Array<Record<string, string>>
    }
  )?.altTitles

  // Transform altTitles into a flat array with language codes
  const titles: Array<{ languageCode: string; title: string }> = []

  if (altTitles) {
    altTitles.forEach((titleObj) => {
      Object.entries(titleObj).forEach(([languageCode, title]) => {
        titles.push({ languageCode, title })
      })
    })
  }

  // Don't render if no alternative titles
  if (titles.length === 0) return <></>

  // Determine which titles to display
  const displayedTitles = showAll ? titles : titles.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = titles.length > INITIAL_DISPLAY_COUNT

  return (
    <div className="manga-detail-view__alt-titles">
      <h2 className="section-title">Alternative Titles</h2>
      <div className="alt-titles-list">
        {displayedTitles.map((item) => (
          <div key={`${item.languageCode}-${item.title}`} className="alt-title-item">
            <span
              className="alt-title-language"
              title={getLanguageName(item.languageCode)}
              aria-label={getLanguageName(item.languageCode)}
            >
              {getLanguageCode(item.languageCode)}
            </span>
            <span className="alt-title-text">{item.title}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          onClick={() => setShowAll(!showAll)}
          className="alt-titles-toggle"
        >
          {showAll ? 'Show Less' : `Show ${titles.length - INITIAL_DISPLAY_COUNT} More`}
        </Button>
      )}
    </div>
  )
}
