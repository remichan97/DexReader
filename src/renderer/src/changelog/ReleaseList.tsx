import { useEffect } from 'react'
import {
  Tab,
  TabList,
  makeStyles,
  mergeClasses,
  tokens,
  type SelectTabData,
  type SelectTabEvent
} from '@fluentui/react-components'
import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { Badge } from '@renderer/components/Badge'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { formatReleaseDate, releaseTabId } from './releaseSelection'

export interface ReleaseListProps {
  readonly releases: ChangelogRelease[]
  readonly installedVersion: string
  readonly selectedVersion: string | undefined
  readonly language: string
  readonly onSelect: (version: string) => void
}

const useStyles = makeStyles({
  // No explicit width: a vertical TabList stretches itself and its tabs to the column, and a
  // 100% width on top of the padding made the list wider than the column.
  list: {
    padding: tokens.spacingVerticalS
  },
  tab: {
    height: 'auto',
    minHeight: '52px',
    justifyContent: 'flex-start'
  },
  muted: {
    color: tokens.colorNeutralForeground3
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXXS,
    textAlign: 'left'
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  date: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  }
})

/**
 * The left column: one tab per release, newest first. A vertical tab list gives arrow-key
 * navigation and the selected state for free, and the detail pane is its tab panel.
 */
export function ReleaseList(props: ReleaseListProps): React.JSX.Element {
  const styles = useStyles()
  const { t } = useTranslation('changelog')

  const handleSelect = (_event: SelectTabEvent, data: SelectTabData): void => {
    props.onSelect(String(data.value))
  }

  // Keep the selected release visible, both on open and when a link elsewhere selects it. The tab
  // is found by id, not by `aria-selected`: Fluent's tabs pick up a new selection in a later
  // render than this effect, so at this point `aria-selected` still marks the previous tab and the
  // list would scroll back to it.
  useEffect(() => {
    if (props.selectedVersion === undefined) {
      return
    }
    document
      .getElementById(releaseTabId(props.selectedVersion))
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [props.selectedVersion])

  return (
    <TabList
      vertical
      size="large"
      aria-label={t('list.ariaLabel')}
      className={styles.list}
      selectedValue={props.selectedVersion}
      onTabSelect={handleSelect}
    >
      {props.releases.map((release) => (
        <Tab
          key={release.version}
          id={releaseTabId(release.version)}
          value={release.version}
          className={mergeClasses(styles.tab, release.isYanked && styles.muted)}
        >
          <span className={styles.body}>
            <span className={styles.title}>
              <span>v{release.version}</span>
              {release.version === props.installedVersion && (
                <Badge variant="info" size="small">
                  {t('badge.installed')}
                </Badge>
              )}
              {release.isYanked && (
                <Badge variant="warning" size="small">
                  {t('badge.notPublished')}
                </Badge>
              )}
            </span>
            {release.date && (
              <span className={styles.date}>{formatReleaseDate(release.date, props.language)}</span>
            )}
          </span>
        </Tab>
      ))}
    </TabList>
  )
}
