import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'

interface StorageSettingsProps {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  downloadConfirmation: 'always' | 'batch-only' | 'never'
  defaultQuality: 'data' | 'data-saver'
  maxConcurrentDownloads: number
  onSelectDownloadsFolder: () => void
  onDownloadConfirmationChange: (confirmation: string | string[]) => void
  onDefaultQualityChange: (quality: string | string[]) => void
  onMaxConcurrentDownloadsChange: (count: string | string[]) => void
}

export function StorageSettings({
  downloadsPath,
  isLoadingPath,
  isChangingPath,
  downloadConfirmation,
  defaultQuality,
  maxConcurrentDownloads,
  onSelectDownloadsFolder,
  onDownloadConfirmationChange,
  onDefaultQualityChange,
  onMaxConcurrentDownloadsChange
}: Readonly<StorageSettingsProps>): React.JSX.Element {
  const confirmationOptions: SelectOption[] = [
    { value: 'always', label: 'Always' },
    { value: 'batch-only', label: 'Batch Only' },
    { value: 'never', label: 'Never' }
  ]

  const qualityOptions: SelectOption[] = [
    { value: 'data', label: 'High Quality' },
    { value: 'data-saver', label: 'Data Saver' }
  ]

  const concurrentDownloadsOptions: SelectOption[] = [
    { value: '1', label: '1 (Sequential)' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' }
  ]

  // Generate helper text based on confirmation setting
  const getConfirmationHelperText = (): string => {
    if (downloadConfirmation === 'always') {
      return 'Show quality dialog before every download'
    }
    if (downloadConfirmation === 'batch-only') {
      return 'Only ask when downloading multiple chapters at once'
    }
    return 'Start downloads immediately without confirmation'
  }

  const getQualityHelperText = (): string => {
    return downloadConfirmation === 'never'
      ? 'Quality used for all downloads'
      : 'Pre-selected value in quality dialog'
  }

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

      {/* Download Confirmation Settings */}
      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Download Confirmation
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--win-text-secondary)',
            marginBottom: '12px'
          }}
        >
          When should we ask before downloading chapters?
        </p>

        <Select
          value={downloadConfirmation}
          onChange={onDownloadConfirmationChange}
          options={confirmationOptions}
          label="Confirmation behavior"
          helperText={getConfirmationHelperText()}
        />
      </div>

      {/* Download Quality Settings */}
      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Download Quality
        </h4>

        <Select
          value={defaultQuality}
          onChange={onDefaultQualityChange}
          options={qualityOptions}
          label="Default quality"
          helperText={getQualityHelperText()}
        />
      </div>

      {/* Concurrent Downloads Settings */}
      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          Concurrent Downloads
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--win-text-secondary)',
            marginBottom: '12px'
          }}
        >
          How many chapters should download at the same time?
        </p>

        <Select
          value={String(maxConcurrentDownloads)}
          onChange={onMaxConcurrentDownloadsChange}
          options={concurrentDownloadsOptions}
          label="Maximum concurrent downloads"
          helperText="Higher values download faster but use more bandwidth and resources"
        />
      </div>
    </div>
  )
}
