import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Switch } from '@renderer/components/Switch'
import { Select, type SelectOption } from '@renderer/components/Select'

interface StorageSettingsProps {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  shouldConfirmBatchDownload: boolean
  batchConfirmThreshold: number
  shouldAskForQuality: boolean
  defaultQuality: 'data' | 'data-saver'
  onSelectDownloadsFolder: () => void
  onBatchConfirmToggle: (enabled: boolean) => void
  onBatchThresholdChange: (value: number) => void
  onAskForQualityToggle: (enabled: boolean) => void
  onDefaultQualityChange: (quality: string | string[]) => void
}

export function StorageSettings({
  downloadsPath,
  isLoadingPath,
  isChangingPath,
  shouldConfirmBatchDownload,
  batchConfirmThreshold,
  shouldAskForQuality,
  defaultQuality,
  onSelectDownloadsFolder,
  onBatchConfirmToggle,
  onBatchThresholdChange,
  onAskForQualityToggle,
  onDefaultQualityChange
}: Readonly<StorageSettingsProps>): React.JSX.Element {
  const qualityOptions: SelectOption[] = [
    { value: 'data', label: 'High Quality' },
    { value: 'data-saver', label: 'Data Saver' }
  ]
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

      {/* Batch Download Settings */}
      <div
        style={{
          borderTop: '1px solid var(--win-border-default)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Batch Downloads</h4>

        <Switch
          checked={shouldConfirmBatchDownload}
          onChange={onBatchConfirmToggle}
          label="Confirm before batch downloads"
          description="Show a confirmation dialog when downloading multiple chapters"
        />

        {shouldConfirmBatchDownload && (
          <div style={{ marginTop: '16px' }}>
            <label
              htmlFor="batch-threshold"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--win-text-primary)'
              }}
            >
              Ask when downloading more than
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Input
                id="batch-threshold"
                type="text"
                inputMode="numeric"
                value={String(batchConfirmThreshold)}
                onChange={(value) => {
                  const num = Number.parseInt(value, 10)
                  if (!Number.isNaN(num) && num >= 1 && num <= 999) {
                    onBatchThresholdChange(num)
                  }
                }}
                min={1}
                max={999}
                style={{
                  width: '100px'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--win-text-secondary)' }}>chapters</span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--win-text-tertiary)',
                marginTop: '8px'
              }}
            >
              Downloads with fewer chapters will start immediately without confirmation.
            </p>
          </div>
        )}
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

        <Switch
          checked={shouldAskForQuality}
          onChange={onAskForQualityToggle}
          label="Ask for quality before downloading"
          description="Show quality selection dialog before each download session"
        />

        <div style={{ marginTop: '16px' }}>
          <Select
            value={defaultQuality}
            onChange={onDefaultQualityChange}
            options={qualityOptions}
            label="Download quality"
            helperText={
              shouldAskForQuality
                ? 'Pre-selected value in quality dialog'
                : 'Quality used for all downloads'
            }
          />
        </div>
      </div>
    </div>
  )
}
