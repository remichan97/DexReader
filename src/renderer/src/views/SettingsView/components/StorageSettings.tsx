import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'

interface StorageSettingsProps {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  onSelectDownloadsFolder: () => void
}

export function StorageSettings({
  downloadsPath,
  isLoadingPath,
  isChangingPath,
  onSelectDownloadsFolder
}: StorageSettingsProps): React.JSX.Element {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Downloads Location
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--win-text-secondary)',
            marginBottom: '12px'
          }}
        >
          Where should we save your downloaded chapters?
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '12px',
            alignItems: 'start'
          }}
        >
          <Input
            type="text"
            value={isLoadingPath ? 'Loading...' : downloadsPath}
            onChange={() => {}}
            readOnly
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              cursor: 'default',
              width: '100%'
            }}
          />
          <Button
            variant="secondary"
            onClick={onSelectDownloadsFolder}
            loading={isChangingPath}
            disabled={isLoadingPath}
          >
            Browse...
          </Button>
        </div>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--win-text-tertiary)',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Lightbulb16Regular style={{ flexShrink: 0 }} />
          <span>Tip: Choose a location with plenty of free space for your manga collection.</span>
        </p>
      </div>
    </div>
  )
}
