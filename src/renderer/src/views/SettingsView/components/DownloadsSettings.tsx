import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'
import './DownloadsSettings.css'

interface DownloadsSettingsProps {
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

export function DownloadsSettings({
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
}: Readonly<DownloadsSettingsProps>): React.JSX.Element {
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
    <div className="downloads-settings__container">
      <div>
        <h4 className="downloads-settings__heading">Downloads Location</h4>
        <p className="downloads-settings__description">
          Where should we save your downloaded chapters?
        </p>
        <div className="downloads-settings__controls">
          <Input
            type="text"
            value={isLoadingPath ? 'Loading...' : downloadsPath}
            onChange={() => {}}
            readOnly
            className="downloads-settings__path-display"
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
        <p className="downloads-settings__info-box">
          <Lightbulb16Regular className="downloads-settings__info-icon" />
          <span>Tip: Choose a location with plenty of free space for your manga collection.</span>
        </p>
      </div>

      {/* Download Confirmation Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">Download Confirmation</h4>
        <p className="downloads-settings__description">
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
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">Download Quality</h4>

        <Select
          value={defaultQuality}
          onChange={onDefaultQualityChange}
          options={qualityOptions}
          label="Default quality"
          helperText={getQualityHelperText()}
        />
      </div>

      {/* Concurrent Downloads Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">Concurrent Downloads</h4>
        <p className="downloads-settings__description">
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
