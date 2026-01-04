import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenRegular,
  PlayCircle24Regular,
  Heart24Regular,
  Heart24Filled
} from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useLibraryStore, useToastStore } from '@renderer/stores'
import {
  getCoverImageUrl,
  getMangaTitle,
  getAuthorName,
  getArtistName,
  getMangaYear,
  getContentRatingText,
  mapPublicationStatus,
  CoverSize,
  type MangaStatus
} from '@renderer/utils/mangaHelpers'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface MangaHeroSectionProps {
  readonly manga: MangaEntity
  readonly chapters: ChapterEntity[]
  readonly progress: NonNullable<
    Awaited<ReturnType<Window['progress']['getProgress']>>['data']
  > | null
}

/**
 * Hero section with cover image and metadata
 */
export default function MangaHeroSection({
  manga,
  chapters,
  progress
}: MangaHeroSectionProps): JSX.Element {
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)
  const coverUrl = getCoverImageUrl(manga, CoverSize.Large)
  const title = getMangaTitle(manga)
  const author = getAuthorName(manga)
  const artist = getArtistName(manga)
  const status = mapPublicationStatus(manga.attributes.status)
  const year = getMangaYear(manga)
  const contentRating = getContentRatingText(manga.attributes.contentRating)
  const demographic = manga.attributes.publicationDemographic
  const lastVolume = manga.attributes.lastVolume
  const lastChapter = manga.attributes.lastChapter

  // Extract tags from attributes
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

  const handleReadClick = (): void => {
    if (chapters.length === 0) return

    // If progress exists, continue from last read position
    if (progress) {
      const lastChapter = chapters.find((ch) => ch.id === progress.lastChapterId)
      if (lastChapter) {
        // Continue from last read page
        const startPage = progress.currentPage

        navigate(`/reader/${manga.id}/${lastChapter.id}`, {
          state: {
            chapterNumber: lastChapter.attributes.chapter,
            chapterTitle: lastChapter.attributes.title,
            mangaTitle: getMangaTitle(manga),
            chapters: chapters,
            startPage, // Start at last read page
            coverUrl // Pass cover URL for progress tracking
          }
        })
        return
      }
    }

    // Navigate to first chapter (no progress or chapter not found)
    const firstChapter = chapters[0]
    navigate(`/reader/${manga.id}/${firstChapter.id}`, {
      state: {
        chapterNumber: firstChapter.attributes.chapter,
        chapterTitle: firstChapter.attributes.title,
        mangaTitle: getMangaTitle(manga),
        chapters: chapters,
        coverUrl // Pass cover URL for progress tracking // Pass full chapter list for navigation
      }
    })
  }

  const handleAddToLibrary = async (): Promise<void> => {
    try {
      const newStatus = await toggleFavourite(manga.id)

      showToast({
        title: newStatus ? 'Added to Library!' : 'Removed from Library!',
        message: getMangaTitle(manga),
        variant: 'info',
        duration: 3000
      })
    } catch (error) {
      console.error('Error toggling favourite:', error)
      showToast({
        title: 'Error',
        message: 'Failed to update library',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleTagClick = (tagId: string): void => {
    navigate(`/browse?tag=${tagId}`)
  }

  return (
    <div className="manga-detail-view__hero">
      {/* Cover Image */}
      <div className="manga-detail-view__cover">
        <img src={coverUrl} alt={`${title} cover`} loading="eager" />
      </div>

      {/* Metadata */}
      <div className="manga-detail-view__info">
        <h1 className="manga-detail-view__title">{title}</h1>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="manga-detail-view__tags-row">
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
        )}

        <div className="manga-detail-view__metadata">
          <p className="manga-detail-view__author">
            <strong>Author:</strong> {author}
          </p>
          <p className="manga-detail-view__artist">
            <strong>Artist:</strong> {artist}
          </p>
          <p className="manga-detail-view__status">
            <strong>Status:</strong> <StatusBadge status={status} />
          </p>
          {demographic && (
            <p className="manga-detail-view__demographic">
              <strong>Demographic:</strong> <DemographicBadge demographic={demographic} />
            </p>
          )}
          {year && (
            <p className="manga-detail-view__year">
              <strong>Year:</strong> {year}
            </p>
          )}
          <p className="manga-detail-view__rating">
            <strong>Rating:</strong> {contentRating}
          </p>
          {(lastVolume || lastChapter) && (
            <p className="manga-detail-view__length">
              <strong>Length:</strong>{' '}
              {lastVolume && `${lastVolume} volume${lastVolume === '1' ? '' : 's'}`}
              {lastVolume && lastChapter && ' • '}
              {lastChapter && `${lastChapter} chapter${lastChapter === '1' ? '' : 's'}`}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="manga-detail-view__actions">
          {progress ? (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<PlayCircle24Regular />}
            >
              Continue Reading
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<BookOpenRegular />}
            >
              Start Reading
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleAddToLibrary}
            icon={isFavourite(manga.id) ? <Heart24Filled /> : <Heart24Regular />}
          >
            {isFavourite(manga.id) ? 'Remove from Library' : 'Add to Library'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Status badge component
 */
interface StatusBadgeProps {
  readonly status: MangaStatus
}

function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/**
 * Demographic badge component
 */
interface DemographicBadgeProps {
  readonly demographic: string
}

function DemographicBadge({ demographic }: DemographicBadgeProps): JSX.Element {
  const displayText = demographic.charAt(0).toUpperCase() + demographic.slice(1)
  return (
    <span className={`demographic-badge demographic-badge--${demographic}`}>{displayText}</span>
  )
}
