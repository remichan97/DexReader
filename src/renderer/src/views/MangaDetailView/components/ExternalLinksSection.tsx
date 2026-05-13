import type { JSX } from 'react'
import { GlobeRegular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']

interface ExternalLinksSectionProps {
  readonly manga: MangaEntity
}

/**
 * External links section
 */
export default function ExternalLinksSection({ manga }: ExternalLinksSectionProps): JSX.Element {
  const { t } = useTranslation(['mangaDetail', 'common'])
  const links = manga.attributes.links || {}

  // Service name mapping
  const serviceNames: Record<string, string> = {
    al: t('mangaDetail:externalLinks.services.anilist', { defaultValue: 'AniList' }),
    ap: t('mangaDetail:externalLinks.services.animePlanet', { defaultValue: 'Anime-Planet' }),
    bw: t('mangaDetail:externalLinks.services.bookwalker', { defaultValue: 'BookWalker' }),
    mu: t('mangaDetail:externalLinks.services.mangaUpdates', { defaultValue: 'MangaUpdates' }),
    mal: t('mangaDetail:externalLinks.services.myAnimeList', { defaultValue: 'MyAnimeList' }),
    kt: t('mangaDetail:externalLinks.services.kitsu', { defaultValue: 'Kitsu' }),
    amz: t('mangaDetail:externalLinks.services.amazon', { defaultValue: 'Amazon' }),
    cdj: t('mangaDetail:externalLinks.services.cdJapan', { defaultValue: 'CDJapan' }),
    ebj: t('mangaDetail:externalLinks.services.ebookJapan', { defaultValue: 'eBookJapan' }),
    raw: t('mangaDetail:externalLinks.services.officialRaw', { defaultValue: 'Official Raw' })
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

    const result = await globalThis.api.showDialog({
      message: t('mangaDetail:externalLinks.dialog.openService', {
        defaultValue: 'Open {{service}}?',
        service: serviceName
      }),
      detail: t('mangaDetail:externalLinks.dialog.detail', {
        defaultValue:
          "You're about to open an external website in your default browser. Just so you know where you're headed:\n\n{{url}}",
        url
      }),
      buttons: [
        t('common:button.openInBrowser'),
        t('common:button.copyLink'),
        t('common:button.cancel')
      ],
      type: 'question',
      defaultId: 0,
      cancelId: 2,
      noLink: true // Use normal buttons instead of command links (VS Code style)
    })

    if (result.success && result.data) {
      if (result.data.response === 0) {
        // User clicked "Open in Browser"
        globalThis.open(url, '_blank', 'noopener,noreferrer')
      } else if (result.data.response === 1) {
        // User clicked "Copy Link"
        try {
          await navigator.clipboard.writeText(url)
        } catch (error) {
          rendererLog.error('[ExternalLinksSection] Failed to copy link:', error)
        }
      }
      // response === 2 means Cancel, do nothing
    }
  }

  const linkEntries = Object.entries(links).filter(([key]) => serviceNames[key])

  if (linkEntries.length === 0) return <></>

  return (
    <section className="external-links-section">
      <h2>{t('mangaDetail:externalLinks.title', { defaultValue: 'External Links' })}</h2>
      <div className="external-links-list flex flex-wrap gap-2">
        {linkEntries.map(([key, value]) => (
          <Button
            key={key}
            variant="secondary"
            size="small"
            icon={<GlobeRegular />}
            onClick={() => handleExternalLinkClick(key, value)}
            title={t('mangaDetail:externalLinks.viewOn', {
              defaultValue: 'View on {{service}}',
              service: serviceNames[key]
            })}
          >
            {serviceNames[key]}
          </Button>
        ))}
      </div>
    </section>
  )
}
