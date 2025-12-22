import type { JSX } from 'react'
import { GlobeRegular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface ExternalLinksSectionProps {
  readonly manga: MangaEntity
}

/**
 * External links section
 */
export default function ExternalLinksSection({ manga }: ExternalLinksSectionProps): JSX.Element {
  const links = manga.attributes.links || {}

  // Service name mapping
  const serviceNames: Record<string, string> = {
    al: 'AniList',
    ap: 'Anime-Planet',
    bw: 'BookWalker',
    mu: 'MangaUpdates',
    mal: 'MyAnimeList',
    kt: 'Kitsu',
    amz: 'Amazon',
    cdj: 'CDJapan',
    ebj: 'eBookJapan',
    raw: 'Official Raw'
  }

  // Build URLs from link keys
  const getExternalUrl = (key: string, value: string): string => {
    const urlMap: Record<string, (val: string) => string> = {
      al: (id) => `https://anilist.co/manga/${id}`,
      ap: (slug) => `https://www.anime-planet.com/manga/${slug}`,
      bw: (slug) => `https://bookwalker.jp/${slug}`,
      mu: (id) => `https://www.mangaupdates.com/series/${id}`,
      mal: (id) => `https://myanimelist.net/manga/${id}`,
      kt: (id) => `https://kitsu.io/manga/${id}`,
      raw: (url) => url // Raw is already a full URL
    }
    return urlMap[key] ? urlMap[key](value) : value
  }

  // Handle external link click with confirmation
  const handleExternalLinkClick = async (key: string, value: string): Promise<void> => {
    const url = getExternalUrl(key, value)
    const serviceName = serviceNames[key]

    const confirmed = await globalThis.api.showConfirmDialog(
      `Open ${serviceName}?`,
      `You're about to open an external website in your default browser. Just so you know where you're headed:\n\n${url}`
    )

    if (confirmed) {
      globalThis.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const linkEntries = Object.entries(links).filter(([key]) => serviceNames[key])

  if (linkEntries.length === 0) return <></>

  return (
    <section className="external-links-section">
      <h3>External Links</h3>
      <div className="external-links-list">
        {linkEntries.map(([key, value]) => (
          <Button
            key={key}
            variant="secondary"
            size="small"
            icon={<GlobeRegular />}
            onClick={() => handleExternalLinkClick(key, value)}
            title={`View on ${serviceNames[key]}`}
          >
            {serviceNames[key]}
          </Button>
        ))}
      </div>
    </section>
  )
}
