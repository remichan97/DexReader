import { Link, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components'
import { Open16Regular } from '@fluentui/react-icons'
import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'
import { Badge } from '@renderer/components/Badge'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ChangelogItem } from './ChangelogItem'
import { RELEASES_URL } from './constants'
import { formatReleaseDate, formatVersionList, releaseTabId } from './releaseSelection'

export interface ReleaseDetailProps {
  readonly release: ChangelogRelease
  readonly installedVersion: string
  readonly language: string
  readonly onSelectVersion: (version: string) => void
  readonly onOpenLink: (url: string) => void
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM
  },
  title: {
    margin: 0,
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold
  },
  date: {
    color: tokens.colorNeutralForeground3
  },
  github: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS
  },
  notice: {
    marginBottom: tokens.spacingVerticalM
  },
  heading: {
    margin: `${tokens.spacingVerticalL} 0 ${tokens.spacingVerticalXS}`,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  items: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalXL
  },
  empty: {
    color: tokens.colorNeutralForeground3
  }
})

/**
 * The right column: the selected release's header, a notice saying how it relates to the
 * releases around it, and its notes by category.
 */
export function ReleaseDetail(props: ReleaseDetailProps): React.JSX.Element {
  const styles = useStyles()
  const { t } = useTranslation('changelog')
  const { release } = props

  const renderVersionLink = (version: string): React.JSX.Element => (
    <Link key={version} inline onClick={() => props.onSelectVersion(version)}>
      v{version}
    </Link>
  )

  const categoryLabel = (category: ChangelogCategory, title: string | undefined): string =>
    category === ChangelogCategory.Unknown && title ? title : t(`category.${category}`)

  return (
    <section role="tabpanel" aria-labelledby={releaseTabId(release.version)}>
      <div className={styles.header}>
        <h1 className={styles.title}>v{release.version}</h1>
        {release.version === props.installedVersion && (
          <Badge variant="info">{t('badge.installed')}</Badge>
        )}
        {release.isYanked && <Badge variant="warning">{t('badge.notPublished')}</Badge>}
        {release.date && (
          <span className={styles.date}>{formatReleaseDate(release.date, props.language)}</span>
        )}
        {!release.isYanked && (
          <Link
            className={styles.github}
            onClick={() => props.onOpenLink(`${RELEASES_URL}/tag/v${release.version}`)}
          >
            {t('detail.viewOnGitHub')} <Open16Regular aria-hidden />
          </Link>
        )}
      </div>

      {release.foldedInto && (
        <MessageBar className={styles.notice} intent="info">
          <MessageBarBody>
            {t('detail.foldedPrefix')} {renderVersionLink(release.foldedInto)}
          </MessageBarBody>
        </MessageBar>
      )}

      {release.includes && release.includes.length > 0 && (
        <MessageBar className={styles.notice} intent="info">
          <MessageBarBody>
            {t('detail.includesPrefix')}{' '}
            {formatVersionList(release.includes, props.language).map((part, index) =>
              part.kind === 'version' ? (
                renderVersionLink(part.value)
              ) : (
                <span key={`text-${index}`}>{part.value}</span>
              )
            )}
          </MessageBarBody>
        </MessageBar>
      )}

      {release.sections.length === 0 && <p className={styles.empty}>{t('detail.noNotes')}</p>}

      {release.sections.map((section, index) => (
        <div key={`${section.category}-${index}`}>
          <h2 className={styles.heading}>{categoryLabel(section.category, section.title)}</h2>
          <ul className={styles.items}>
            {section.items.map((item, itemIndex) => (
              <ChangelogItem key={itemIndex} item={item} onOpenLink={props.onOpenLink} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
