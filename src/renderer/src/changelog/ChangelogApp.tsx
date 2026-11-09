import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components'
import type { ChangelogPayload } from '@shared/contracts/changelog/changelog-payload.contract'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ReleaseDetail } from './ReleaseDetail'
import { ReleaseList } from './ReleaseList'
import { pickInitialVersion } from './releaseSelection'

export interface ChangelogAppProps {
  readonly language: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; payload: ChangelogPayload }

const useStyles = makeStyles({
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1
  },
  listColumn: {
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`
  },
  detailColumn: {
    overflowY: 'auto',
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`
  },
  centred: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground1
  }
})

/**
 * The changelog window's content: a list of releases beside the notes for the selected one.
 * Main reports its own failures, so this only has to show the user that loading failed.
 */
export function ChangelogApp(props: ChangelogAppProps): React.JSX.Element {
  const styles = useStyles()
  const { t } = useTranslation(['changelog', 'common'])
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined)
  const detailRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (): Promise<void> => {
    setState({ status: 'loading' })
    try {
      const result = await globalThis.changelog.getChangelog()
      if (!result.success || !result.data) {
        setState({ status: 'error' })
        return
      }
      setSelectedVersion(pickInitialVersion(result.data.releases, result.data.installedVersion))
      setState({ status: 'ready', payload: result.data })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // A different release starts at the top of its notes, not wherever the last one was scrolled to.
  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.scrollTop = 0
    }
  }, [selectedVersion])

  const openLink = useCallback((url: string): void => {
    // Main logs a refused or failed open, and there is nothing useful to tell the user here.
    globalThis.changelog.openExternal(url).catch(() => undefined)
  }, [])

  if (state.status === 'loading') {
    return (
      <div className={styles.centred}>
        <ProgressRing size="large" aria-label={t('changelog:state.loading')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.centred}>
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>{t('changelog:state.errorTitle')}</MessageBarTitle>
            {t('changelog:state.errorBody')}
          </MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => void load()}>{t('common:button.retry')}</Button>
          </MessageBarActions>
        </MessageBar>
      </div>
    )
  }

  const { releases, installedVersion } = state.payload
  const selected = releases.find((release) => release.version === selectedVersion)

  return (
    <div className={styles.layout}>
      <nav className={styles.listColumn}>
        <ReleaseList
          releases={releases}
          installedVersion={installedVersion}
          selectedVersion={selectedVersion}
          language={props.language}
          onSelect={setSelectedVersion}
        />
      </nav>
      <main ref={detailRef} className={styles.detailColumn}>
        {selected && (
          <ReleaseDetail
            release={selected}
            installedVersion={installedVersion}
            language={props.language}
            onSelectVersion={setSelectedVersion}
            onOpenLink={openLink}
          />
        )}
      </main>
    </div>
  )
}
