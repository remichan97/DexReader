import type { JSX } from 'react'
import { MessageBar, MessageBarBody, MessageBarActions } from '@fluentui/react-components'
import { WifiOff24Regular, CloudOff24Regular } from '@fluentui/react-icons'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'

export function OfflineStatusBar(): JSX.Element | null {
  const status = useConnectivityStore((state) => state.status)
  const setOnline = useConnectivityStore((state) => state.setOnline)
  const checkConnectivity = useConnectivityStore((state) => state.checkConnectivity)
  const { t } = useTranslation('common')

  if (status === 'online') {
    return null // Don't show banner when online
  }

  const isUserInitiated = status === 'offline-user'

  return (
    <MessageBar
      intent="warning"
      icon={isUserInitiated ? <CloudOff24Regular /> : <WifiOff24Regular />}
    >
      <MessageBarBody>
        {isUserInitiated ? (
          <>
            <strong>{t('message.info.youreOffline')}</strong> —{' '}
            {t('message.info.onlyDownloadedContent')}
          </>
        ) : (
          <>
            <strong>{t('message.info.noInternet')}</strong> —{' '}
            {t('message.info.downloadedContentAvailable')}
          </>
        )}
      </MessageBarBody>
      <MessageBarActions>
        {isUserInitiated ? (
          <Button variant="ghost" size="small" onClick={setOnline}>
            {t('button.goOnline')}
          </Button>
        ) : (
          <Button variant="ghost" size="small" onClick={checkConnectivity}>
            {t('button.retry')}
          </Button>
        )}
      </MessageBarActions>
    </MessageBar>
  )
}
