import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { Select, type SelectOption } from '@renderer/components/Select'
import { RadioGroup, Radio } from '@renderer/components/Radio'
import './DownloadsSettings.css'

interface DownloadsSettingsProps {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  downloadConfirmation: 'always' | 'batch-only' | 'never'
  defaultQuality: 'data' | 'data-saver'
  maxConcurrentDownloads: number
  onSelectDownloadsFolder: () => void
  onDownloadConfirmationChange: (confirmation: string) => void
  onDefaultQualityChange: (quality: string) => void
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
  const concurrentDownloadsOptions: SelectOption[] = [
    { value: '1', label: '1 (Sequential)' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' }
  ]

  return (
    <div className="downloads-settings__container flex flex-col gap-5">
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
        <p className="downloads-settings__info-box flex items-center gap-1.5">
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

        <RadioGroup
          value={downloadConfirmation}
          onChange={(value) =>
            onDownloadConfirmationChange(value as 'always' | 'batch-only' | 'never')
          }
          name="download-confirmation"
          label="Confirmation behaviour"
        >
          <Radio value="always" label="Always" description="Ask which quality before downloading" />
          <Radio
            value="batch-only"
            label="Batch Only"
            description="Only ask when downloading multiple chapters at once"
          />
          <Radio
            value="never"
            label="Never"
            description="Start downloads immediately without confirmation"
          />
        </RadioGroup>
      </div>

      {/* Download Quality Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">Download Quality</h4>
        <p className="downloads-settings__description">
          {downloadConfirmation === 'never'
            ? 'Quality used for all downloads'
            : 'Default quality selection'}
        </p>

        <RadioGroup
          value={defaultQuality}
          onChange={(value) => onDefaultQualityChange(value as 'data' | 'data-saver')}
          name="default-quality"
          label="Default quality"
        >
          <Radio
            value="data"
            label="High Quality"
            description="Full resolution images, best visual quality"
          />
          <Radio
            value="data-saver"
            label="Data Saver"
            description="Compressed images, smaller file sizes"
          />
        </RadioGroup>
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
